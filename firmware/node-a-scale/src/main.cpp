// Node A, the scale.
//
// Reads the load cell through the HX711, shows the weight, and on PHOTO takes
// twelve readings, keeps the median, and hands the grams to Node B over
// ESP-NOW. Node B photographs the plate and posts both to the backend.
//
// The order that works on the bench (and that the /prototype page plays):
//   1. Put the empty plate on. Press TARE: the display goes to zero.
//   2. Put the food on. The display shows the food alone.
//   3. Press PHOTO.
//
// Everything the board does is also printed on the serial line at 115200 baud,
// one line per event, so the Workbench pages can read it. The format and the
// commands it accepts are in ../README.md.
//
// Two chips, one program. The board in hand is an ESP8266 NodeMCU; the ESP32
// DevKit on the original request is still built, because the Wokwi simulator
// has no ESP8266. What differs between them (saving settings, the radio's calls)
// is kept to the `#if defined(ESP8266)` blocks below.

#include <Arduino.h>
#include <Wire.h>
#if defined(ESP8266)
#include <EEPROM.h>
#include <ESP8266WiFi.h>
#include <espnow.h>
#else
#include <Preferences.h>
#include <WiFi.h>
#include <esp_arduino_version.h>
#include <esp_now.h>
#include <esp_wifi.h>
#endif

#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#ifndef SIMULATE_SCALE
#include <HX711.h>
#endif

#include "config.h"
#include "pins.h"
#include "sfs_protocol.h"

// --- the reading -------------------------------------------------------------

#ifndef SIMULATE_SCALE
HX711 cell;
#else
float simGrams = 0;   // where the weight is going: `sim <grams>`
float simNow = 0;     // where it is, while it lands
float simSpeed = 0;
int simSign = 1;      // -1 plays a cell with its white and green swapped: `sim sign -1`
#endif

// The last readings, newest last. Raw counts straight from the converter.
constexpr int kHistory = 16;
long history[kHistory];
int historyCount = 0;
uint32_t readingsTaken = 0;  // ever, so a caller can wait for fresh ones

long tareOffset = 0;
bool tared = false;
float countsPerGram = SFS_COUNTS_PER_GRAM;  // replaced by the saved value, if any
bool overloaded = false;

// --- what the board remembers ------------------------------------------------
//
// Two values survive a restart: the calibration, and the channel Node B was last
// found on. NAN means no calibration saved; 0, no channel.

#if defined(ESP8266)
// The ESP8266 has no Preferences. A few bytes of its emulated EEPROM do the job.
struct Saved {
  uint32_t magic;
  float cpg;
  uint8_t channel;
};
constexpr uint32_t kSavedMagic = 0x53465341;  // "SFSA": anything else is a blank or foreign flash
Saved saved;

void settingsBegin() {
  EEPROM.begin(sizeof(Saved));
  EEPROM.get(0, saved);
  if (saved.magic != kSavedMagic) saved = {kSavedMagic, NAN, 0};
}
void settingsWrite() {
  EEPROM.put(0, saved);
  EEPROM.commit();
}
float savedCountsPerGram() { return saved.cpg; }
void saveCountsPerGram(float value) {
  saved.cpg = value;
  settingsWrite();
}
uint8_t savedChannel() { return saved.channel; }
void saveChannel(uint8_t channel) {
  saved.channel = channel;
  settingsWrite();
}
#else
Preferences settings;

void settingsBegin() { settings.begin("sfs-node-a", false); }
float savedCountsPerGram() { return settings.isKey("cpg") ? settings.getFloat("cpg", NAN) : NAN; }
void saveCountsPerGram(float value) {
  if (isnan(value)) settings.remove("cpg");
  else settings.putFloat("cpg", value);
}
uint8_t savedChannel() { return settings.getUChar("channel", 0); }
void saveChannel(uint8_t channel) { settings.putUChar("channel", channel); }
#endif

bool calibrated() { return !isnan(countsPerGram) && countsPerGram > 0; }

long medianOf(long *values, int count) {
  // Insertion sort on a copy: twelve values, no need for anything cleverer.
  long sorted[kHistory];
  for (int i = 0; i < count; i++) {
    long value = values[i];
    int j = i;
    while (j > 0 && sorted[j - 1] > value) {
      sorted[j] = sorted[j - 1];
      j--;
    }
    sorted[j] = value;
  }
  // An even count takes the mean of the middle two.
  return count % 2 ? sorted[count / 2] : (sorted[count / 2 - 1] + sorted[count / 2]) / 2;
}

// The median of the newest `count` readings.
long recentMedian(int count) {
  count = min(count, historyCount);
  long recent[kHistory];
  for (int i = 0; i < count; i++) recent[i] = history[historyCount - count + i];
  return medianOf(recent, count);
}

float toGrams(long raw) { return calibrated() ? (raw - tareOffset) / countsPerGram : NAN; }

// One new reading if the converter has one ready. True when it did.
bool readCell() {
  long raw;
#ifndef SIMULATE_SCALE
  if (!cell.is_ready()) return false;
  raw = cell.read();
  // The HX711 pins its output at the ends of its range when overdriven.
  overloaded = raw >= 0x7FFFFF || raw <= -0x800000;
#else
  static uint32_t last = 0;
  if (millis() - last < 100) return false;  // the real converter's 10 per second
  last = millis();
  // A weight does not arrive at once: it overshoots and wobbles, then settles.
  simSpeed += (simGrams - simNow) * config::kSimSpring - simSpeed * config::kSimDamping;
  simNow += simSpeed;
  raw = config::kSimZeroCounts + simSign * lroundf(simNow * config::kSimCountsPerGram) + random(-3, 4);
  overloaded = false;
#endif
  if (historyCount == kHistory) {
    memmove(history, history + 1, sizeof(long) * (kHistory - 1));
    historyCount--;
  }
  history[historyCount++] = raw;
  readingsTaken++;
  return true;
}

// --- the link to Node B ------------------------------------------------------

const uint8_t kBroadcast[6] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};

uint8_t cameraMac[6];
uint8_t cameraChannel = 0;  // 0: not found yet
uint16_t nextSeq = 1;

// Written by the radio's callback, read by the loop. The flag is set last.
volatile bool inboxFull = false;
sfs::Frame inbox;
uint8_t inboxFrom[6];

void onFrame(const uint8_t *from, const uint8_t *data, int length) {
  if (length != sizeof(sfs::Frame) || inboxFull) return;
  sfs::Frame frame;
  memcpy(&frame, data, sizeof frame);
  if (frame.magic != sfs::kMagic) return;
  memcpy(inboxFrom, from, 6);
  inbox = frame;
  inboxFull = true;
}

#if defined(ESP8266)
// The ESP8266's ESP-NOW is the older API: plain pointers, a role, and 0 for success.
void onReceive(uint8_t *mac, uint8_t *data, uint8_t length) { onFrame(mac, data, length); }

void setChannel(uint8_t channel) { wifi_set_channel(channel); }

void addPeer(const uint8_t *mac, uint8_t channel) {
  uint8_t *address = const_cast<uint8_t *>(mac);
  if (esp_now_is_peer_exist(address)) esp_now_del_peer(address);
  esp_now_add_peer(address, ESP_NOW_ROLE_COMBO, channel, nullptr, 0);
}

bool radioBegin() {
  if (esp_now_init() != 0) return false;
  esp_now_set_self_role(ESP_NOW_ROLE_COMBO);
  esp_now_register_recv_cb(onReceive);
  return true;
}

void radioSend(const uint8_t *to, sfs::Frame &frame) {
  esp_now_send(const_cast<uint8_t *>(to), reinterpret_cast<uint8_t *>(&frame), sizeof frame);
}
#else
// The callback's shape changed with version 3 of the ESP32 Arduino core.
#if ESP_ARDUINO_VERSION_MAJOR >= 3
void onReceive(const esp_now_recv_info_t *info, const uint8_t *data, int length) { onFrame(info->src_addr, data, length); }
#else
void onReceive(const uint8_t *mac, const uint8_t *data, int length) { onFrame(mac, data, length); }
#endif

void setChannel(uint8_t channel) {
  esp_wifi_set_promiscuous(true);
  esp_wifi_set_channel(channel, WIFI_SECOND_CHAN_NONE);
  esp_wifi_set_promiscuous(false);
}

void addPeer(const uint8_t *mac, uint8_t) {
  if (esp_now_is_peer_exist(mac)) esp_now_del_peer(mac);
  esp_now_peer_info_t peer = {};
  memcpy(peer.peer_addr, mac, 6);
  peer.channel = 0;  // whatever channel the radio is on
  peer.encrypt = false;
  esp_now_add_peer(&peer);
}

bool radioBegin() {
  if (esp_now_init() != ESP_OK) return false;
  esp_now_register_recv_cb(onReceive);
  return true;
}

void radioSend(const uint8_t *to, sfs::Frame &frame) {
  esp_now_send(to, reinterpret_cast<const uint8_t *>(&frame), sizeof frame);
}
#endif

void send(const uint8_t *to, sfs::Kind kind, uint16_t seq, float grams) {
  sfs::Frame frame = {sfs::kMagic, kind, cameraChannel, seq, grams, 0};
  radioSend(to, frame);
}

// Wait up to `ms` for a frame of this kind (and this seq, when one is given).
bool await(sfs::Kind kind, uint16_t seq, uint32_t ms) {
  uint32_t start = millis();
  while (millis() - start < ms) {
    if (inboxFull) {
      bool match = inbox.kind == kind && (seq == 0 || inbox.seq == seq);
      if (match) return true;  // left in the inbox for the caller to read
      inboxFull = false;       // not what we wait for: drop it
    }
    readCell();  // keep the history fresh while waiting
    delay(2);
  }
  return false;
}

String macText(const uint8_t *mac) {
  char text[18];
  snprintf(text, sizeof text, "%02X:%02X:%02X:%02X:%02X:%02X", mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
  return text;
}

// Try each channel with a Hello until Node B answers. The last good channel first.
bool findCamera() {
  uint8_t last = savedChannel();
  for (int attempt = 0; attempt <= config::kLastChannel; attempt++) {
    uint8_t channel = attempt == 0 ? last : attempt;
    if (channel == 0 || (attempt > 0 && channel == last)) continue;
    setChannel(channel);
    addPeer(kBroadcast, channel);
    inboxFull = false;
    send(kBroadcast, sfs::Kind::Hello, 0, 0);
    if (await(sfs::Kind::HelloAck, 0, config::kHelloWaitMs)) {
      memcpy(cameraMac, inboxFrom, 6);
      inboxFull = false;
      cameraChannel = channel;
      addPeer(cameraMac, channel);
      if (channel != last) saveChannel(channel);  // flash wears: write only on a change
      Serial.printf("E link found ch=%u mac=%s\n", channel, macText(cameraMac).c_str());
      return true;
    }
  }
  cameraChannel = 0;
  Serial.println("E link none");
  return false;
}

// --- the front panel ---------------------------------------------------------

Adafruit_SSD1306 oled(128, 64, &Wire, -1);
bool hasDisplay = false;
const char *note = "READY";
uint32_t holdingFor = 0;  // how long the button has been held towards a tare, for the countdown

void beep(uint16_t hz, uint16_t ms) {
  tone(PIN_BUZZER, hz, ms);
  delay(ms + 20);
}

void beepOk() { beep(config::kBeepHz, 60); }
void beepTwice() {
  beep(config::kBeepHz, 50);
  beep(config::kBeepHz, 50);
}
void beepError() { beep(config::kErrorHz, 350); }

void show() {
  if (!hasDisplay) return;
  oled.clearDisplay();
  oled.setTextColor(SSD1306_WHITE);

  // Top line: the link.
  oled.setTextSize(1);
  oled.setCursor(0, 0);
  if (cameraChannel) oled.printf("CAMERA ch %u", cameraChannel);
  else oled.print("CAMERA ?");

  // The number.
  oled.setCursor(0, 22);
  if (overloaded) {
    oled.setTextSize(2);
    oled.print("OVERLOAD");
  } else if (!calibrated()) {
    oled.setTextSize(1);
    oled.printf("raw %ld", historyCount ? recentMedian(config::kLiveSamples) : 0L);
  } else {
    float grams = historyCount ? toGrams(recentMedian(config::kLiveSamples)) : 0;
    if (fabsf(grams) < 0.05f) grams = 0;  // no "-0.0"
    oled.setTextSize(2);
    oled.printf("%.1f g", grams);
  }

  // Bottom line: what the scale is doing.
  oled.setTextSize(1);
  oled.setCursor(0, 56);
  if (holdingFor) oled.printf("HOLD: TARE IN %lu s", (unsigned long)((config::kHoldToTareMs - holdingFor + 999) / 1000));
  else oled.print(calibrated() ? note : "NOT CALIBRATED");
  oled.display();
}

struct Button {
  explicit Button(uint8_t pin) : pin(pin) {}
  uint8_t pin;
  bool down = false;
  uint32_t changed = 0;
  // True once per press, after 30 ms of steady contact.
  bool pressed() {
    bool now = digitalRead(pin) == LOW;
    if (now != down && millis() - changed > 30) {
      down = now;
      changed = millis();
      return down;
    }
    return false;
  }
};

// The one button: a click, or a hold of kHoldToTareMs.
struct MainButton {
  enum Event { None, Click, Hold };
  explicit MainButton(uint8_t pin) : pin(pin) {}
  uint8_t pin;
  bool down = false;
  bool held = false;  // this press already tared
  uint32_t changed = 0;
  uint32_t pressedAt = 0;
  Event poll() {
    bool now = digitalRead(pin) == LOW;
    if (now != down && millis() - changed > 30) {
      down = now;
      changed = millis();
      if (down) {
        held = false;
        pressedAt = changed;
        return None;
      }
      // Let go: a click if it was short; after a hold, or between the two, nothing.
      return !held && millis() - pressedAt < config::kClickMaxMs ? Click : None;
    }
    if (down && now && !held && millis() - changed >= config::kHoldToTareMs) {
      held = true;
      return Hold;
    }
    return None;
  }
  // How long it has been held past a click, while a tare is still to come.
  uint32_t holding() const {
    uint32_t ms = millis() - changed;
    return down && !held && ms >= config::kClickMaxMs ? ms : 0;
  }
};

MainButton mainButton{PIN_BUTTON_TARE};
Button captureButton{PIN_BUTTON_CAPTURE};  // the board's FLASH button, or a second button: PHOTO only

// --- what the buttons do -----------------------------------------------------

// Block until `count` readings newer than the call have arrived, then return their median.
long freshMedian(int count) {
  uint32_t from = readingsTaken;
  uint32_t start = millis();
  while (readingsTaken - from < (uint32_t)count) {
    readCell();
    if (millis() - start > 3000) break;  // the HX711 stopped answering
    delay(1);
  }
  if (readingsTaken == from) return tareOffset;  // nothing new: keep what we had
  return recentMedian(min<int>(count, readingsTaken - from));
}

void tare() {
  note = "TARING";
  show();
  uint32_t before = readingsTaken;
  long offset = freshMedian(config::kCaptureSamples);
  if (readingsTaken == before) {
    Serial.println("E error no-readings");
    note = "NO READINGS";
    beepError();
    return;
  }
  tareOffset = offset;
  tared = true;
  note = "TARE OK";
  Serial.printf("E tare offset=%ld\n", tareOffset);
  beepOk();
}

void capture() {
  if (!calibrated()) {
    Serial.println("E error not-calibrated");
    beepError();
    return;
  }
  note = "WEIGHING";
  show();
  long raw = freshMedian(config::kCaptureSamples);
  float grams = toGrams(raw);

  // Print the samples behind the median, for anyone checking the arithmetic.
  Serial.printf("E capture g=%.1f median=%ld samples=", grams, raw);
  for (int i = historyCount - config::kCaptureSamples; i < historyCount; i++) {
    Serial.printf(i + 1 < historyCount ? "%ld," : "%ld\n", history[max(i, 0)]);
  }

  // Over capacity in food alone is certainly too much. The plate's own mass is
  // not counted here: the scale cannot know it without an empty-cell reference.
  if (overloaded || grams > config::kCellCapacityG) {
    note = "OVERLOAD";
    Serial.println("E error overload");
    beepError();
    return;
  }
  if (!tared) {
    // Allowed, but the plate is inside that number. Say so; do not refuse.
    Serial.println("E warn not-tared");
  }
  if (grams < config::kMinMealG) {
    note = "NOTHING ON IT";
    Serial.println("E error too-light");
    beepError();
    return;
  }

  uint16_t seq = nextSeq++;
  bool sent = false;
  for (int round = 0; round < 2 && !sent; round++) {
    if (!cameraChannel && !findCamera()) break;
    for (int attempt = 0; attempt < config::kSendAttempts && !sent; attempt++) {
      inboxFull = false;
      send(cameraMac, sfs::Kind::Capture, seq, grams);
      sent = await(sfs::Kind::CaptureAck, seq, config::kAckWaitMs);
    }
    if (!sent) {
      // Node B moved channel (the hotspot did), or is off. Search once more.
      Serial.println("E link lost");
      cameraChannel = 0;
    }
  }
  inboxFull = false;

  Serial.printf("E sent seq=%u g=%.1f ok=%d\n", seq, grams, sent);
  if (sent) {
    note = "SENT";
    beepTwice();
  } else {
    note = "NO CAMERA";
    beepError();
  }
}

// --- the serial console ------------------------------------------------------

String line;

void command(String text) {
  text.trim();
  if (text == "tare") tare();
  else if (text == "capture") capture();
  else if (text == "find") findCamera();
  else if (text == "info") {
    Serial.printf("E info node=a fw=%s calibrated=%d cpg=%.6f tared=%d offset=%ld camera_ch=%u%s\n", SFS_FIRMWARE_VERSION,
                  calibrated(), countsPerGram, tared, tareOffset, cameraChannel,
#ifdef SIMULATE_SCALE
                  " simulated=1"
#else
                  ""
#endif
    );
  } else if (text == "cal clear") {
#ifdef SIMULATE_SCALE
    countsPerGram = NAN;  // uncalibrated until `cal`, as a fresh real scale would be
#else
    saveCountsPerGram(NAN);
    countsPerGram = SFS_COUNTS_PER_GRAM;
#endif
    Serial.println("E cal cleared");
  } else if (text.startsWith("cal ")) {
    float value = text.substring(4).toFloat();
    if (value > 0) {
      countsPerGram = value;
#ifdef SIMULATE_SCALE
      // A rehearsal: kept until the next restart, never saved, so nothing from the
      // pretend scale is left for the real one to read.
      Serial.printf("E cal cpg=%.6f saved=0\n", value);
#else
      saveCountsPerGram(value);
      Serial.printf("E cal cpg=%.6f\n", value);
#endif
    } else {
      Serial.println("E error cal-needs-a-positive-number");
    }
  }
#ifdef SIMULATE_SCALE
  else if (text.startsWith("sim sign ")) {
    simSign = text.substring(9).toInt() < 0 ? -1 : 1;
    Serial.printf("E sim sign=%d\n", simSign);
  } else if (text.startsWith("sim ")) {
    simGrams = text.substring(4).toFloat();
    Serial.printf("E sim g=%.1f\n", simGrams);
  }
#endif
  else if (text.length()) {
    Serial.println("E help tare | capture | find | info | cal <counts per gram> | cal clear | sim <grams> | sim sign <1|-1>");
  }
}

void readConsole() {
  while (Serial.available()) {
    char c = Serial.read();
    if (c == '\n' || c == '\r') {
      if (line.length()) command(line);
      line = "";
    } else if (line.length() < 64) {
      line += c;
    }
  }
}

// --- start and run -----------------------------------------------------------

void setup() {
  Serial.begin(115200);
  Serial.println();  // ends the chip's own start-up noise, so the boot line starts a line
  pinMode(PIN_BUTTON_TARE, INPUT_PULLUP);
  pinMode(PIN_BUTTON_CAPTURE, INPUT_PULLUP);
  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_BUZZER, LOW);

  settingsBegin();
  if (!isnan(savedCountsPerGram())) countsPerGram = savedCountsPerGram();
#ifdef SIMULATE_SCALE
  if (!calibrated()) countsPerGram = config::kSimCountsPerGram;
#endif

  Wire.begin(PIN_OLED_SDA, PIN_OLED_SCL);
  hasDisplay = oled.begin(SSD1306_SWITCHCAPVCC, config::kOledAddress);
  if (!hasDisplay) Serial.println("E error no-display");

#ifndef SIMULATE_SCALE
  cell.begin(PIN_HX711_DT, PIN_HX711_SCK);
  cell.set_gain(128);  // channel A, gain 128
#endif

#if defined(ESP8266)
  // The ESP8266 keeps Wi-Fi settings in flash and rejoins old networks by itself,
  // which would move it off the channel it is searching. It also dozes between
  // beacons by default, and misses frames while it does.
  WiFi.persistent(false);
  WiFi.setAutoConnect(false);
  WiFi.setSleepMode(WIFI_NONE_SLEEP);
#endif
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  if (radioBegin()) {
    addPeer(kBroadcast, 1);
  } else {
    Serial.println("E error espnow-init");
  }

  Serial.printf("E boot node=a fw=%s calibrated=%d cpg=%.6f%s\n", SFS_FIRMWARE_VERSION, calibrated(), countsPerGram,
#ifdef SIMULATE_SCALE
                " simulated=1"
#else
                ""
#endif
  );
  note = "STARTING";
  show();
  // Like a kitchen scale: whatever is on it at power-on is zero. Hold the button 5 s to zero again.
  tare();
  findCamera();
  note = "READY";
  show();
}

void loop() {
  static uint32_t lastShown = 0;

  if (readCell()) {
    long raw = history[historyCount - 1];
    float grams = toGrams(recentMedian(config::kLiveSamples));
    // Settled when the last few readings sit inside a narrow band.
    bool stable = false;
    if (calibrated() && historyCount >= config::kLiveSamples) {
      float low = INFINITY, high = -INFINITY;
      for (int i = historyCount - config::kLiveSamples; i < historyCount; i++) {
        float g = toGrams(history[i]);
        low = min(low, g);
        high = max(high, g);
      }
      stable = high - low < config::kStableBandG;
    }
    Serial.printf("R raw=%ld net=%ld g=%.1f stable=%d\n", raw, raw - tareOffset, grams, stable);
  }

  switch (mainButton.poll()) {
    case MainButton::Click: capture(); break;
    case MainButton::Hold: tare(); break;
    default: break;
  }
  holdingFor = mainButton.holding();
  if (captureButton.pressed()) capture();
  readConsole();

  // Node B reports how the upload went, some seconds after the capture.
  if (inboxFull && inbox.kind == sfs::Kind::Result) {
    static const char *names[] = {"saved", "queued", "failed", "unknown"};
    static const char *notes[] = {"SAVED", "QUEUED", "UPLOAD FAILED", "NOT RECOGNISED"};
    uint8_t outcome = min<uint8_t>(inbox.outcome, 3);
    Serial.printf("E result seq=%u outcome=%s\n", inbox.seq, names[outcome]);
    note = notes[outcome];
    inboxFull = false;
    if (outcome >= 2) beepError();
  } else if (inboxFull) {
    inboxFull = false;  // a late ack, or a Hello from somewhere: nothing to do
  }

  if (millis() - lastShown > 150) {
    show();
    lastShown = millis();
  }
}
