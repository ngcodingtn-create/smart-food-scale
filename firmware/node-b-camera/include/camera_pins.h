// The camera's pins on the AI-Thinker ESP32-CAM.
//
// Fixed by the board, not by our wiring: the OV2640 sits on its own connector.
// These are the values of CAMERA_MODEL_AI_THINKER in the ESP32 Arduino core's
// CameraWebServer example. The wiring page lists the same pins as taken.

#pragma once

#define CAM_PIN_PWDN 32
#define CAM_PIN_RESET -1  // not connected
#define CAM_PIN_XCLK 0
#define CAM_PIN_SIOD 26
#define CAM_PIN_SIOC 27

#define CAM_PIN_D7 35
#define CAM_PIN_D6 34
#define CAM_PIN_D5 39
#define CAM_PIN_D4 36
#define CAM_PIN_D3 21
#define CAM_PIN_D2 19
#define CAM_PIN_D1 18
#define CAM_PIN_D0 5
#define CAM_PIN_VSYNC 25
#define CAM_PIN_HREF 23
#define CAM_PIN_PCLK 22
