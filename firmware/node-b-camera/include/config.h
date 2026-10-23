// Node B's settings. The light's pin is not here: it is generated into pins.h
// from the wiring (web/components/workbench/wiring.ts). The camera's own pins
// are fixed by the board, in camera_pins.h.

#pragma once

#include <stdint.h>

#define SFS_FIRMWARE_VERSION "0.1.0"

namespace config {

// The photo. SVGA is 800 x 600, the size the /prototype page assumes. JPEG
// quality runs from 0 (best) to 63; 12 is the camera examples' usual choice.
constexpr int kJpegQuality = 12;

// After the light comes on: wait, then throw away a few frames so the camera's
// automatic exposure has caught up with the new light. A starting choice, to be
// tuned with a test photo on the rig.
constexpr uint32_t kLightSettleMs = 300;
constexpr int kDiscardFrames = 2;

// The upload.
constexpr uint32_t kUploadTimeoutMs = 20000;
// How often to retry what is waiting on the card, once the network is back.
constexpr uint32_t kFlushEveryMs = 15000;

}  // namespace config
