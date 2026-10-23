// Node B, the camera.
//
// Waits for Node A. When a Capture arrives over ESP-NOW it answers at once,
// switches the light on, takes one photo, switches the light off, and posts the
// photo with the grams to the backend's POST /meals. If the network is down it
// keeps both on the microSD card and sends them later. Then it tells Node A how
// it went.
//
// Node B is the board on the Wi-Fi: it joins the phone's hotspot, so ESP-NOW
// runs on the hotspot's channel, and Node A finds it there.
//
// The Wi-Fi name, password and the backend's address are set over the serial
// line and saved on the board, so an image flashed from the site works as is.
// Every event is printed, one line each. Format and commands: ../README.md.

#include <Arduino.h>
#include <HTTPClient.h>
#include <Preferences.h>
#include <SD_MMC.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <esp_arduino_version.h>
#include <esp_camera.h>
#include <esp_now.h>
#include <esp_wifi.h>
#include <time.h>

#include "camera_pins.h"
#include "config.h"
#include "pins.h"
#include "sfs_protocol.h"

#if __has_include("secrets.h")
#include "secrets.h"
#else
#include "secrets.example.h"
#endif
#ifndef SFS_BACKEND_ROOT_CA
#define SFS_BACKEND_ROOT_CA nullptr
#endif

// --- settings ----------------------------------------------------------------

Preferences settings;
String ssid, password, backend;

void loadSettings() {
  settings.begin("sfs-node-b", false);
  ssid = settings.getString("ssid", SFS_WIFI_SSID);
  password = settings.getString("pass", SFS_WIFI_PASSWORD);
  backend = settings.getString("backend", SFS_BACKEND_URL);
}

// --- the camera and the light --------------------------------------------------

bool cameraOk = false;

bool startCamera() {
  camera_config_t camera = {};
  camera.ledc_channel = LEDC_CHANNEL_0;
  camera.ledc_timer = LEDC_TIMER_0;
  camera.pin_d0 = CAM_PIN_D0;
  camera.pin_d1 = CAM_PIN_D1;
  camera.pin_d2 = CAM_PIN_D2;
  camera.pin_d3 = CAM_PIN_D3;
  camera.pin_d4 = CAM_PIN_D4;
  camera.pin_d5 = CAM_PIN_D5;
  camera.pin_d6 = CAM_PIN_D6;
  camera.pin_d7 = CAM_PIN_D7;
  camera.pin_xclk = CAM_PIN_XCLK;
  camera.pin_pclk = CAM_PIN_PCLK;
  camera.pin_vsync = CAM_PIN_VSYNC;
  camera.pin_href = CAM_PIN_HREF;
  camera.pin_sccb_sda = CAM_PIN_SIOD;
  camera.pin_sccb_scl = CAM_PIN_SIOC;
  camera.pin_pwdn = CAM_PIN_PWDN;
  camera.pin_reset = CAM_PIN_RESET;
  camera.xclk_freq_hz = 20000000;
  camera.pixel_format = PIXFORMAT_JPEG;
  camera.frame_size = FRAMESIZE_SVGA;
  camera.jpeg_quality = config::kJpegQuality;
  camera.fb_count = psramFound() ? 2 : 1;
  camera.fb_location = psramFound() ? CAMERA_FB_IN_PSRAM : CAMERA_FB_IN_DRAM;
  camera.grab_mode = CAMERA_GRAB_LATEST;
  return esp_camera_init(&camera) == ESP_OK;
}

void light(bool on) { digitalWrite(PIN_LIGHT, on ? HIGH : LOW); }

// One photo under our light. The caller returns the frame with esp_camera_fb_return.
camera_fb_t *takePhoto() {
  light(true);
  delay(config::kLightSettleMs);
  // Frames already in the buffer, or exposed for the room's light: not ours.
  for (int i = 0; i < config::kDiscardFrames; i++) {
    camera_fb_t *old = esp_camera_fb_get();
    if (old) esp_camera_fb_return(old);
  }
  camera_fb_t *frame = esp_camera_fb_get();
  light(false);
  return frame;
}

// --- Wi-Fi and the date ------------------------------------------------------

bool online = false;

void startWifi() {
  WiFi.disconnect();
  if (ssid.isEmpty()) {
    Serial.println("E wifi not-set");
    return;
  }
  WiFi.begin(ssid.c_str(), password.c_str());
}

void watchWifi() {
  bool now = WiFi.status() == WL_CONNECTED;
  if (now == online) return;
  online = now;
  if (online) {
    configTime(0, 0, "pool.ntp.org");  // UTC, as the backend dates meals
    Serial.printf("E wifi up ch=%d ip=%s\n", WiFi.channel(), WiFi.localIP().toString().c_str());
  } else {
    Serial.println("E wifi down");
  }
}

// Today in UTC, or "" if the clock was never set: the backend then uses its own date.
String today() {
  struct tm now;
  if (!getLocalTime(&now, 0)) return "";
  char text[11];
  strftime(text, sizeof text, "%Y-%m-%d", &now);
  return text;
}

// --- the upload --------------------------------------------------------------

struct Upload {
  int status;    // the HTTP status, or a negative number when nothing came back
  bool unknown;  // 422 because the backend could not name the dish
};

String field(const String &boundary, const char *name, const String &value) {
  return "--" + boundary + "\r\nContent-Disposition: form-data; name=\"" + name + "\"\r\n\r\n" + value + "\r\n";
}

// POST /meals as multipart/form-data: `grams`, perhaps `eaten_on`, and `image`.
// The same fields the backend's tests send (backend/tests/test_meals_api.py).
Upload upload(const uint8_t *jpeg, size_t length, float grams, const String &date) {
  if (backend.isEmpty()) {
    Serial.println("E error backend-not-set");
    return {-1, false};
  }
  const char *rootCa = SFS_BACKEND_ROOT_CA;
  bool tls = backend.startsWith("https://");
  if (tls && rootCa == nullptr) {
    // Refused, not sent unchecked: see secrets.example.h.
    Serial.println("E error https-needs-root-ca");
    return {-1, false};
  }

  String boundary = "sfs" + String(esp_random(), HEX);
  String head = field(boundary, "grams", String(grams, 1));
  if (date.length()) head += field(boundary, "eaten_on", date);
  head += "--" + boundary + "\r\nContent-Disposition: form-data; name=\"image\"; filename=\"plate.jpg\"\r\n" +
          "Content-Type: image/jpeg\r\n\r\n";
  String tail = "\r\n--" + boundary + "--\r\n";

  size_t total = head.length() + length + tail.length();
  uint8_t *body = static_cast<uint8_t *>(psramFound() ? ps_malloc(total) : malloc(total));
  if (!body) {
    Serial.println("E error out-of-memory");
    return {-1, false};
  }
  memcpy(body, head.c_str(), head.length());
  memcpy(body + head.length(), jpeg, length);
  memcpy(body + head.length() + length, tail.c_str(), tail.length());

  WiFiClient plain;
  WiFiClientSecure secure;
  HTTPClient http;
  http.setTimeout(config::kUploadTimeoutMs);
  bool begun;
  if (tls) {
    secure.setCACert(rootCa);
    begun = http.begin(secure, backend + "/meals");
  } else {
    begun = http.begin(plain, backend + "/meals");
  }
  Upload result = {-1, false};
  if (begun) {
    http.addHeader("Content-Type", "multipart/form-data; boundary=" + boundary);
    result.status = http.POST(body, total);
    if (result.status == 422) result.unknown = http.getString().indexOf("could not be identified") >= 0;
    http.end();
  }
  free(body);
  return result;
}

// --- the card: captures kept while the network is down ---------------------------

bool cardOk = false;

// Writes /queue/<n>.jpg, then /queue/<n>.txt. The .txt last, so a capture is only
// ever seen once both are complete.
bool keep(const uint8_t *jpeg, size_t length, float grams, const String &date) {
  if (!cardOk) return false;
  uint32_t id = settings.getUInt("qid", 0) + 1;
  settings.putUInt("qid", id);
  char base[24];
  snprintf(base, sizeof base, "/queue/%08lu", static_cast<unsigned long>(id));

  File photo = SD_MMC.open(String(base) + ".jpg", FILE_WRITE);
  if (!photo) return false;
  size_t written = photo.write(jpeg, length);
  photo.close();
  if (written != length) return false;

  File meta = SD_MMC.open(String(base) + ".txt", FILE_WRITE);
  if (!meta) return false;
  meta.printf("grams=%.1f\neaten_on=%s\n", grams, date.c_str());
  meta.close();
  return true;
}

// The oldest capture waiting on the card, as "/queue/<n>" without an extension.
String oldestKept(int *count) {
  String oldest;
  *count = 0;
  File folder = SD_MMC.open("/queue");
  if (!folder) return oldest;
  for (File entry = folder.openNextFile(); entry; entry = folder.openNextFile()) {
    String name = entry.name();
    entry.close();
    if (!name.endsWith(".txt")) continue;
    (*count)++;
    String base = "/queue/" + name.substring(name.lastIndexOf('/') + 1, name.length() - 4);
    if (oldest.isEmpty() || base < oldest) oldest = base;
  }
  return oldest;
}

// Send the oldest kept capture. One per call; the loop calls it now and then.
void sendKept() {
  if (!cardOk || !online) return;
  int count;
  String base = oldestKept(&count);
  if (base.isEmpty()) return;

  File meta = SD_MMC.open(base + ".txt");
  float grams = 0;
  String date;
  while (meta.available()) {
    String row = meta.readStringUntil('\n');
    if (row.startsWith("grams=")) grams = row.substring(6).toFloat();
    if (row.startsWith("eaten_on=")) date = row.substring(9);
  }
  meta.close();

  File photo = SD_MMC.open(base + ".jpg");
  size_t length = photo ? photo.size() : 0;
  uint8_t *jpeg = length ? static_cast<uint8_t *>(psramFound() ? ps_malloc(length) : malloc(length)) : nullptr;
  if (!jpeg) {
    if (photo) photo.close();
    Serial.printf("E error cannot-read %s\n", base.c_str());
    return;
  }
  photo.read(jpeg, length);
  photo.close();

  Upload result = upload(jpeg, length, grams, date);
  free(jpeg);
  // Saved, or refused for good (a 4xx will not change on retry): either way it is done.
  bool done = result.status == 201 || (result.status >= 400 && result.status < 500);
  if (done) {
    SD_MMC.remove(base + ".txt");
    SD_MMC.remove(base + ".jpg");
  }
  Serial.printf("E flush id=%s status=%d %s left=%d\n", base.c_str(), result.status, done ? "done" : "kept",
                done ? count - 1 : count);
}

// --- one capture, start to finish ----------------------------------------------

const char *outcomeName(sfs::Outcome outcome) {
  switch (outcome) {
    case sfs::Outcome::Saved: return "saved";
    case sfs::Outcome::Queued: return "queued";
    case sfs::Outcome::Unknown: return "unknown";
    default: return "failed";
  }
}

sfs::Outcome shootAndSend(float grams) {
  if (!cameraOk) {
    Serial.println("E error no-camera");
    return sfs::Outcome::Failed;
  }
  uint32_t start = millis();
  camera_fb_t *frame = takePhoto();
  if (!frame) {
    Serial.println("E error no-photo");
    return sfs::Outcome::Failed;
  }
  Serial.printf("E photo bytes=%u ms=%lu\n", frame->len, millis() - start);

  String date = today();
  Upload result = online ? upload(frame->buf, frame->len, grams, date) : Upload{-1, false};
  sfs::Outcome outcome;
  if (result.status == 201) outcome = sfs::Outcome::Saved;
  else if (result.unknown) outcome = sfs::Outcome::Unknown;
  else if (result.status >= 400 && result.status < 500) outcome = sfs::Outcome::Failed;
  else outcome = keep(frame->buf, frame->len, grams, date) ? sfs::Outcome::Queued : sfs::Outcome::Failed;
  esp_camera_fb_return(frame);

  Serial.printf("E upload g=%.1f status=%d outcome=%s\n", grams, result.status, outcomeName(outcome));
  return outcome;
}

// --- ESP-NOW: talking to Node A --------------------------------------------------

struct Received {
  sfs::Frame frame;
  uint8_t from[6];
};
QueueHandle_t inbox;

void onFrame(const uint8_t *from, const uint8_t *data, int length) {
  if (length != sizeof(sfs::Frame)) return;
  Received received;
  memcpy(&received.frame, data, sizeof received.frame);
  if (received.frame.magic != sfs::kMagic) return;
  memcpy(received.from, from, 6);
  xQueueSend(inbox, &received, 0);  // full: dropped, and Node A retries
}

// The callback's shape changed with version 3 of the ESP32 Arduino core.
#if ESP_ARDUINO_VERSION_MAJOR >= 3
void onReceive(const esp_now_recv_info_t *info, const uint8_t *data, int length) { onFrame(info->src_addr, data, length); }
#else
void onReceive(const uint8_t *mac, const uint8_t *data, int length) { onFrame(mac, data, length); }
#endif

void reply(const uint8_t *to, sfs::Kind kind, uint16_t seq, float grams, sfs::Outcome outcome) {
  if (!esp_now_is_peer_exist(to)) {
    esp_now_peer_info_t peer = {};
    memcpy(peer.peer_addr, to, 6);
    peer.channel = 0;  // whatever channel the hotspot put us on
    esp_now_add_peer(&peer);
  }
  sfs::Frame frame = {sfs::kMagic, kind, static_cast<uint8_t>(WiFi.channel()), seq, grams,
                      static_cast<uint8_t>(outcome)};
  esp_now_send(to, reinterpret_cast<const uint8_t *>(&frame), sizeof frame);
}

String macText(const uint8_t *mac) {
  char text[18];
  snprintf(text, sizeof text, "%02X:%02X:%02X:%02X:%02X:%02X", mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
  return text;
}

uint16_t lastSeq = 0;
uint8_t lastFrom[6] = {};

void handle(const Received &received) {
  const sfs::Frame &frame = received.frame;
  if (frame.kind == sfs::Kind::Hello) {
    reply(received.from, sfs::Kind::HelloAck, 0, 0, sfs::Outcome::Saved);
    Serial.printf("E hello from=%s\n", macText(received.from).c_str());
  } else if (frame.kind == sfs::Kind::Capture) {
    // Ack first, so Node A stops waiting while the photo and upload take their time.
    reply(received.from, sfs::Kind::CaptureAck, frame.seq, frame.grams, sfs::Outcome::Saved);
    if (frame.seq == lastSeq && memcmp(received.from, lastFrom, 6) == 0) {
      // Node A missed our ack and sent it again: already taken, do not shoot twice.
      Serial.printf("E capture seq=%u repeat\n", frame.seq);
      return;
    }
    lastSeq = frame.seq;
    memcpy(lastFrom, received.from, 6);
    Serial.printf("E capture seq=%u g=%.1f from=%s\n", frame.seq, frame.grams, macText(received.from).c_str());
    sfs::Outcome outcome = shootAndSend(frame.grams);
    reply(received.from, sfs::Kind::Result, frame.seq, frame.grams, outcome);
  }
}

// --- the serial console ------------------------------------------------------

void info() {
  int kept = 0;
  if (cardOk) oldestKept(&kept);
  Serial.printf("E info node=b fw=%s psram=%d camera=%d card=%d wifi=%s ch=%d ssid=%s backend=%s kept=%d\n",
                SFS_FIRMWARE_VERSION, psramFound(), cameraOk, cardOk, online ? "up" : "down", WiFi.channel(),
                ssid.c_str(), backend.c_str(), kept);
}

void command(String text) {
  text.trim();
  if (text.startsWith("ssid ")) {
    ssid = text.substring(5);
    settings.putString("ssid", ssid);
    Serial.printf("E set ssid=%s\n", ssid.c_str());
  } else if (text.startsWith("pass ")) {
    password = text.substring(5);
    settings.putString("pass", password);
    Serial.println("E set pass");  // never printed back
  } else if (text.startsWith("backend ")) {
    String url = text.substring(8);
    url.trim();
    while (url.endsWith("/")) url.remove(url.length() - 1);
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      Serial.println("E error backend-needs-http-or-https");
      return;
    }
    backend = url;
    settings.putString("backend", backend);
    Serial.printf("E set backend=%s\n", backend.c_str());
  } else if (text == "wifi") {
    startWifi();
  } else if (text.startsWith("shoot ")) {
    // A capture without Node A, for testing the camera, the light and the upload.
    shootAndSend(text.substring(6).toFloat());
  } else if (text == "light on" || text == "light off") {
    light(text == "light on");
    Serial.printf("E light %s\n", text == "light on" ? "on" : "off");
  } else if (text == "flush") {
    sendKept();
  } else if (text == "info") {
    info();
  } else if (text.length()) {
    Serial.println("E help ssid <name> | pass <password> | backend <url> | wifi | shoot <grams> | light on|off | flush | info");
  }
}

String line;

void readConsole() {
  while (Serial.available()) {
    char c = Serial.read();
    if (c == '\n' || c == '\r') {
      if (line.length()) command(line);
      line = "";
    } else if (line.length() < 200) {
      line += c;
    }
  }
}

// --- start and run -----------------------------------------------------------

void setup() {
  // The light first: off, before anything else can take time.
  pinMode(PIN_LIGHT, OUTPUT);
  light(false);
  Serial.begin(115200);

  loadSettings();
  cameraOk = startCamera();
  if (!cameraOk) Serial.println("E error camera-init");

  // 1-bit mode, so GPIO 4, 12 and 13 stay free: 13 is the light.
  cardOk = SD_MMC.begin("/sdcard", true);
  if (cardOk) SD_MMC.mkdir("/queue");
  // GPIO 4 is the on-board flash LED, unused in 1-bit mode. Keep it dark.
  pinMode(4, OUTPUT);
  digitalWrite(4, LOW);

  inbox = xQueueCreate(4, sizeof(Received));
  WiFi.mode(WIFI_STA);
  // Power saving makes ESP-NOW unicast unreliable (electronics research, question 7).
  WiFi.setSleep(false);
  WiFi.setAutoReconnect(true);
  if (esp_now_init() == ESP_OK) {
    esp_now_register_recv_cb(onReceive);
  } else {
    Serial.println("E error espnow-init");
  }
  startWifi();

  Serial.printf("E boot node=b fw=%s psram=%d camera=%d card=%d\n", SFS_FIRMWARE_VERSION, psramFound(), cameraOk, cardOk);
}

void loop() {
  static uint32_t lastFlush = 0;

  watchWifi();
  Received received;
  if (xQueueReceive(inbox, &received, 0) == pdTRUE) handle(received);
  readConsole();

  if (online && millis() - lastFlush > config::kFlushEveryMs) {
    lastFlush = millis();
    sendKept();
  }
  delay(2);
}
