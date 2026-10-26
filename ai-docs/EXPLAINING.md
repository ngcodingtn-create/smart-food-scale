# How to explain a step to the owner

The owner chose this on 26 October 2026, after the display finally lit up: "this approach of
3D is the perfect one … continue always like this explanation, change it in all steps." It is
the standard for every hands-on step, on the site and in artifacts. The model to copy is
**Display, Four Wires**: `ai-docs/artifacts/display-four-wires.html`
(<https://claude.ai/artifact/Ape5eHUNFwnXMfbNmTy84M>).

## What every explanation has

1. **A real 3D scene** (three.js), not a flat drawing: the owner can drag to turn it and scroll
   or pinch to zoom.
2. **Their bench, as it is**, from the photos they sent: the NodeMCU **upside down, pins up,
   USB away from them**, the breadboard on its right, the parts where they really are, the
   wires already made (their colours). Never the textbook layout when theirs differs.
3. **Seen from where they stand**: the first camera is at the NodeMCU's far end, breadboard
   on the right. Each step flies the camera to where the hands work, and to a low side view
   when something is hidden under a part.
4. **One action per step**, short pills to jump between them, Back, Replay, Next, ← → keys.
   Each step says who does it ("You do" / "Claude") in two or three plain lines.
5. **Pins found by counting, never by printed names** (the names are underneath the
   upside-down board): "row next to the breadboard, 6th pin from the far end", with the name
   after it ("that pin is 3V"). A pulsing ring on the target pin; a "far end · count from here"
   tag.
6. **Labels pinned to the 3D parts** (HTML tags projected from 3D points), a few words each.
7. **The wire grows** from one end to the other; sockets push down onto pins; parts lift out
   and drop in; the USB slides out at the start and back in at the end; the result is shown
   (the screen lights up, the LED glows).
8. **The same content as plain cards under the scene** (the list of wires), so it still works
   without WebGL or for a quick read.
9. **Claude checks the result from the laptop** and says so in the last step (board.py, or
   the live page `/admin/wire`). The board's reading decides "done", not the picture.

## What it is not

- Not long text. Two or three lines per step; the picture carries the rest.
- Not an invented layout: if the photos and the guide disagree, draw the photos and say what
  differs. Nothing is drawn as fact that was not seen or read from the board.
- Not a replacement for the board's check: a step is done when the board says so.

## Where it lives

- Artifacts for one-off answers (claude.ai, three.js r128 from cdnjs and OrbitControls from
  jsdelivr, `three@0.128.0/examples/js/controls/OrbitControls.js`).
- The site's build companion for every step page: the 3D bench in
  `web/components/admin/build/bench3d/` (three from npm, already a dependency for `/rig`),
  scenes as data, one per step. Every step of milestones 1 to 9 has one (26 October); only
  milestone 0, meeting the parts, keeps its 2.5D scenes.
- What a scene can show (`bench3d/model.ts`): the NodeMCU, breadboard and display; button,
  transistors, resistors, diode, buzzer module; the owner's XFW-HX711 and load cell (on a book,
  taped, with a cup); capacitors; the ESP32-CAM on its MB base or on the breadboard; LEDs that
  glow; a microSD card; a phone and a laptop whose screens change per beat; a phone charger;
  the rig's pieces from `rig/specs.ts`. A beat can add things, take them off (`remove`), press
  with a finger, put a mass or food in, light the LEDs, and change the display's text.
  `bench: false` drops the bench, for the rig and the laptop-and-phone steps.
- Draw what the owner has from their photos; label anything drawn from a reference instead.
