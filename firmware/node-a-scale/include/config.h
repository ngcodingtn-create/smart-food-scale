// Node A's settings. Pin numbers are not here: they are generated into pins.h
// from the wiring (web/components/workbench/wiring.ts).

#pragma once

#include <math.h>
#include <stdint.h>

#define SFS_FIRMWARE_VERSION "0.2.0"

// Counts per gram, until the scale is calibrated and the real value is saved on
// the board. Unknown by default, on purpose: an uncalibrated scale shows raw
// counts and says so, rather than a number in grams that only looks right.
// A build may set it, for example the Wokwi simulator, whose load cell gives
// 2100 counts over 5 kg: 0.42 counts per gram.
#ifndef SFS_COUNTS_PER_GRAM
#define SFS_COUNTS_PER_GRAM NAN
#endif

namespace config {

// The reading. The HX711 runs at 10 samples a second (its RATE pin, not code).
constexpr int kCaptureSamples = 12;   // a capture is the median of this many
constexpr int kLiveSamples = 5;       // the live display is the median of this many
constexpr float kStableBandG = 1.0f;  // live readings within this band count as settled

// What a meal may weigh. The lower limit is the backend's own (SFS_MIN_GRAMS);
// the cell is a 3 kg cell (decision D13), so the plate and the food together
// may not pass that.
constexpr float kMinMealG = 0.5f;
constexpr float kCellCapacityG = 3000.0f;

// The link to Node B.
constexpr uint32_t kHelloWaitMs = 150;  // per channel, while searching
constexpr uint32_t kAckWaitMs = 600;    // per attempt, for a CaptureAck
constexpr int kSendAttempts = 3;
constexpr uint8_t kLastChannel = 13;

// The buzzer. A passive buzzer, so the firmware chooses the pitch.
constexpr uint16_t kBeepHz = 2700;
constexpr uint16_t kErrorHz = 900;

// The display.
constexpr uint8_t kOledAddress = 0x3C;

}  // namespace config

// SIMULATE_SCALE (the node-a-sim build): no load cell at all. The weight is set
// from the serial console with `sim <grams>`, so the buttons, the display, the
// link and the camera node can be tried on a bare board.
#ifdef SIMULATE_SCALE
namespace config {
constexpr float kSimCountsPerGram = 100.0f;  // made up, and only used by the simulation
constexpr long kSimZeroCounts = 84000;       // likewise
}  // namespace config
#endif
