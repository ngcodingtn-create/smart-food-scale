// The frames the two boards send each other over ESP-NOW.
//
// Both nodes include this one file, so they cannot disagree about the layout.
// Change it here, and rebuild both.
//
// The conversation, Node A (scale) first:
//
//   Hello       A → everyone   "is the camera on this channel?"   (broadcast)
//   HelloAck    B → A          "yes, I am here"                    (unicast)
//   Capture     A → B          "photograph the plate; it weighs `grams`"
//   CaptureAck  B → A          "got it, shooting now"              (same seq)
//   Result      B → A          what became of the upload           (same seq)
//
// Node B is connected to the hotspot, so it can only listen on the hotspot's
// channel. Node A does not join the hotspot: it finds Node B by trying each
// channel with a Hello until one answers. See decision D12 and the electronics
// research report, question 7.

#pragma once

#include <stdint.h>

namespace sfs {

// "SFS1" read as a little-endian number. A frame without it is not ours.
constexpr uint32_t kMagic = 0x31534653;

enum class Kind : uint8_t {
  Hello = 1,
  HelloAck = 2,
  Capture = 3,
  CaptureAck = 4,
  Result = 5,
};

// Node B's report on a capture, once the upload has been tried.
enum class Outcome : uint8_t {
  Saved = 0,   // the backend stored the meal
  Queued = 1,  // no network: kept on the microSD card, sent later
  Failed = 2,  // the backend refused it, or the card is missing
};

struct __attribute__((packed)) Frame {
  uint32_t magic;
  Kind kind;
  // The sender's Wi-Fi channel. In a HelloAck it tells Node A where to stay.
  uint8_t channel;
  // Counts up from 1 for each capture. Acks and results carry the same number.
  uint16_t seq;
  // Capture only: the median mass, in grams.
  float grams;
  // Result only: an Outcome.
  uint8_t outcome;
};

static_assert(sizeof(Frame) == 13, "Frame layout changed: rebuild both nodes");

}  // namespace sfs
