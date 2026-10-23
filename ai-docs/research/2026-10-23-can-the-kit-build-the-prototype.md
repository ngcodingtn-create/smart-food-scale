# Can the lab's kit build the bench prototype?

Asked 23 October 2026, after the owner photographed what the lab handed over
(`/workbench/parts`, `web/components/workbench/kit.ts`). Web search was unavailable this
session; sources were read directly.

## Answer

Yes, with **one part missing** and **one decision**.

- **Missing: the HX711.** Without it nothing weighs. Not on the load cell's wires (the
  blue part is a 4-way connector). Find it in the bag, or get one.
- **Decision: the ESP8266 NodeMCU** handed over instead of the ESP32 DevKit. Either swap
  it at the lab, or port Node A's firmware to it. The port is possible:
  - ESP8266 and ESP32 boards talk to each other over ESP-NOW (Random Nerd Tutorials,
    <https://randomnerdtutorials.com/esp-now-esp8266-nodemcu-arduino-ide/>: "ESP8266 and
    ESP32 boards can communicate with each other using ESP-NOW").
  - Node A needs 7 GPIOs. The NodeMCU has enough once the boot pins are respected
    (<https://randomnerdtutorials.com/esp8266-pinout-reference-gpios/>: GPIO0 and GPIO2
    must not be low at boot, GPIO15 must not be high).
  - What changes in `firmware/node-a-scale/src/main.cpp`: the ESP-NOW calls (`espnow.h`,
    roles, callback signatures), setting the channel (`wifi_set_channel`), `Preferences`
    (ESP32 only) replaced by EEPROM or LittleFS for the calibration, and the pins.
    HX711 (bogde) and Adafruit SSD1306 both support the ESP8266.

## NodeMCU pins (proposed here; the port on 23 October moved tare and the HX711)

The pins as built are in `web/components/workbench/wiring.ts`: tare D5, HX711 DT D6
and SCK D7, which keeps their wires from crossing in the drawing. The table below is
the first proposal.

| Signal | NodeMCU | GPIO | Why there |
| --- | --- | --- | --- |
| OLED SDA | D2 | 4 | The usual I²C pins |
| OLED SCL | D1 | 5 | |
| HX711 DT | D5 | 14 | Free, no boot role |
| HX711 SCK | D6 | 12 | Free, no boot role |
| Tare button | D7 | 13 | Free, no boot role |
| Capture button | D3 | 0 | Pulled up; a button to GND is fine unless held at power-on |
| Buzzer (transistor base, 1 kΩ) | D8 | 15 | Held low at boot by the board, which a transistor base does not upset |

## Everything else

| Need | State |
| --- | --- |
| Camera, programmer base, LEDs, transistors, diode, resistors, OLED, breadboard, jumpers, cables | In hand |
| Second push button | One photographed; check |
| 100 nF ceramics | Not found. HX711 modules carry their own decoupling; the bench prototype can run without |
| 10 µF | The 100 µF 25 V does the job |
| 1000 µF ×2 | Final build only |
| 5 V 2 A charger | Laptop USB first. The ESP32-CAM is known to brown out on weak USB ports and long cables (RNT troubleshooting guide); if it resets, a short cable, a 100 µF across its 5 V and GND, then a phone charger |
| microSD | Optional: Node B runs without a card, it only cannot queue |
| Screws, spacers, two boards to mount the cell | Not in the kit. Measure the cell's threads first |
| Multimeter, soldering iron | Lab. An HX711 often comes with loose header pins to solder |
| Known weights for calibration | Not in the kit |

The buzzer module's type (coil or piezo) is still unknown: a multimeter between S and −.
