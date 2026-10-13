<!-- Recovered verbatim from a research subagent's final report (Claude Sonnet), run on 2026-10-12.
     A snapshot: prices, stock and links were true on that date only. Decisions D12 and D13 in
     docs/decisions.md were made from it. What it marks as unverified is still unverified. -->

# Smart Food Scale: BOM verification research (2026-10-12)

Evidence tags used below:
- **[P]** is a manufacturer datasheet or Espressif document that I opened and read.
- **[S]** is a secondary source (forum, retailer, tutorial).
- **[calc]** is my own arithmetic from [P] numbers.

Several datasheet PDFs could not be read by the fetch tool. I extracted their text locally from the saved copies, and I read the TAL221, TAL220B and HX711 tables as rendered images.

---

## 1. HX711 supply and logic levels

**Finding**
- **Chip supply and current [P].** The supply range is 2.6 to 5.5 V; the pin table lists VSUP as 2.7 to 5.5 V, a small internal inconsistency. Typical current is 1400 µA analog (including the regulator) plus 100 µA digital, quoted as under 1.5 mA, and under 1 µA in power-down. Full scale is ±0.5·AVDD/Gain, so ±20 mV at gain 128 with AVDD = 5 V. The datasheet also says "DVDD should be the same power supply as the MCU." https://cdn.sparkfun.com/datasheets/Sensors/ForceFlex/hx711_english.pdf
  - The 1.5 mA excludes the bridge. A 1000 to 1090 Ω TAL221 draws about 3 to 4 mA at 3.1 to 4.3 V [calc].
- **Green breakout excitation [S].** AVDD comes from the chip's regulator plus an external PNP, set by 20 k and 8.2 k resistors. The datasheet formula is AVDD = VBG·(R1+R2)/R2, about 1.25 × 28.2/8.2 = 4.3 V. SparkFun confirmed its schematic note had a typo and corrected it. https://community.sparkfun.com/t/hx711-avdd-value-for-sparkfun-load-cell-amplifier-hx711/36878
  - The hiveeyes thread agrees that the standard green board is 20 k/8.2 k, about 4.3 V, which is a 5 V design. https://community.hiveeyes.org/t/stromversorgung-hx711/893
  - The datasheet requires AVDD to sit at least 100 mV below VSUP, so at VCC = 3.3 V the regulator cannot regulate. Excitation then follows VCC minus a pass-element drop. I estimate about 3.0 to 3.2 V [calc]; no source measured it.
  - The hiveeyes thread notes the 5 V design is "a dimensioning decision, not an error", and that lower excitation wastes about one bit.
- **Cost of 3.3 V [S].** One SparkFun forum user measured a standard deviation of 2.08 g at 5 V versus 2.91 g at 3.3 V on a small cell, about 40% worse. It is a single anecdote. https://community.sparkfun.com/t/hx711-vcc-and-vdd-at-3-3v/36286
- **DOUT at 5 V is a hazard.**
  - On single-VCC modules DVDD is tied to VCC, so DOUT swings to 5 V.
  - Espressif specifies VIH max = VDD + 0.3 V for ESP32 GPIOs (about 3.6 V), and the pins are not 5 V tolerant [P]. https://documentation.espressif.com/esp32_datasheet_en.pdf (Table 5-3)
  - A Random Nerd Tutorials commenter claims inputs "can" take 5 V. That conflicts with the datasheet; trust the datasheet. https://randomnerdtutorials.com/esp32-cam-ai-thinker-pinout/
  - SparkFun's two-supply board handles this: VCC is the analog supply and VDD sets the logic level. SparkFun's own wording is "for 3.3 V logic, VCC to 5 V, VDD to 3.3 V". https://learn.sparkfun.com/tutorials/load-cell-amplifier-hx711-breakout-hookup-guide
  - For single-VCC boards run at 5 V, the forum suggestion is a divider on DOUT such as 4k7 + 10k. https://forum.arduino.cc/t/hx711-module-vcc-and-no-vdd/623955
- **Library and Espressif guidance [P/S].** The bogde/HX711 README gives no 3.3/5 V advice. It lists ESP32 DEVKIT V1 as tested and points to a "stable power supply" and the hiveeyes power page. https://raw.githubusercontent.com/bogde/HX711/master/README.md Espressif publishes nothing HX711-specific beyond the GPIO limits above.
- **Buck versus linear.** I found no source that measured an HX711 on a buck versus a linear regulator.
  - The AMS1117 datasheet lists use as a "Post Regulator for switching DC/DC Converter". It gives ripple rejection of 60 to 70 dB at 120 Hz, output noise of 0.003% of VOUT over 10 Hz to 10 kHz (about 99 µV rms [calc]), and dropout of 1.3 V typical (1.4 V max) at 1 A [P]. https://mm.digikey.com/Volume0/opasdata/d220001/medias/docus/8122/AMS11173.3SOT223.pdf
  - Many green boards leave E− unconnected to GND, which breaks the on-board regulator. https://forum.arduino.cc/t/hx711-noise-free-resolution-tests/351959

**Recommendation.** Drop the dedicated buck. The DevKit's own AMS1117 3V3 pin can supply the HX711 module (about 1.5 mA plus 3 mA for the cell) and already post-regulates the charger's 5 V. Add 10 µF and 100 nF at the module, check E− continuity to GND, and read E+ to E− with a multimeter. For a 1.5 to 2 kg cell the 3.3 V noise penalty is irrelevant (see Q3). If you ever want the full 4.3 V excitation, run VCC from 5 V and put a divider on DOUT only.

**Confidence.** High on datasheet facts and logic levels. Medium on buck versus LDO (principle plus datasheet only) and on AVDD at 3.3 V (an estimate, not a measurement).

---

## 2. HX711 rate jumper

**Finding**
- **Rate selection [P].** RATE = 0 gives 10 SPS and RATE = 1 gives 80 SPS. Settling after power-up, reset or gain change is 400 ms at 10 SPS and 50 ms at 80 SPS. Discard data until then. https://cdn.sparkfun.com/datasheets/Sensors/ForceFlex/hx711_english.pdf
- **SparkFun board [S].** A RATE solder jumper is closed by default (10 SPS). You open it by cutting the trace between the pads, hidden under red soldermask. https://community.sparkfun.com/t/switching-hx711-sampling-frequency-to-80hz/38826
- **Green boards [S].** Pin 15 is hard-wired to GND by a trace; for 80 SPS you cut the trace and wire the pin to VCC. Same thread notes "performance goes down if speed goes up". https://forum.arduino.cc/t/hx711-custom-or-higher-sample-rate/691994
- **Soldered v1.2 [S].** A 3-pad jumper defaults to 10 Hz, and v1.0 and v1.1 are 10 Hz only (from a search summary; I did not open the thread). https://community.soldered.com/t/hx711-load-cell-amplifier/169
- **Noise at gain 128 [P].** Input noise is 50 nV rms at 10 SPS and 90 nV rms at 80 SPS.
  - At AVDD = 4.3 V the LSB is about 2.0 nV, so the noise is about 25 counts at 10 SPS and 45 counts at 80 SPS. By the noise-free-bits formula NFR = 24 − log2(6.6·rms) (given in the Arduino forum thread below) that is about 16.6 and 15.8 bits [calc].
  - Bench tests on two boards found about 14 to 15 noise-free bits, "maybe 16" with careful grounding and shielding. That is 78 to 155 counts rms [calc]. https://forum.arduino.cc/t/hx711-noise-free-resolution-tests/351959

**Recommendation.** Stay at the default 10 SPS with no hardware mod. Budget for the pessimistic bench noise, not the datasheet floor.

**Confidence.** High on pin and default behavior. Medium on the board-to-board variation.

---

## 3. Load cell capacity versus tare load

**Finding**
- **TAL221 datasheet (HT Sensor, hosted by a distributor) [P].** https://cdn.components.ru/media/PDF/2459570.pdf

| Parameter | TAL221, 1000/1500 g column |
|---|---|
| Rated output | 1.0 ± 0.15 mV/V |
| Safe overload | 150 %FS |
| Ultimate overload | 200 %FS |
| Excitation | ≤ 6 Vdc |
| Combined error | 0.05 %FS |
| Non-linearity, hysteresis, repeatability | ± 0.05 %FS each |
| Creep | ± 0.05 %FS per 3 min |
| Zero balance | ± 0.1 %FS |
| Span and zero temperature coefficient | ± 0.1 %FS per 10 °C each |
| Corner correction | ± 0.1 %FS |
| Input / output resistance | 1090 ± 10 Ω / 1000 ± 10 Ω |
| Operating temperature | −10 to +40 °C |
| Size | 47 × 12 × 6 mm |
| Cable | 4 wires, Ø0.6 × 110 mm |

- **Overload conflict.**
  - A reseller lists 120% safe and 150% ultimate for the TAL221. https://china.org.ru/product/60694950318
  - The sibling TAL220F datasheet (different model) also says 120/150. https://cdn.shopify.com/s/files/1/0761/6561/1847/files/TAL220F.pdf
  - The manufacturer sheet for the TAL221 says 150/200. Use 120% as the conservative design limit.
- **Mounting hardware.** The drawing shows 2×M3 tapped holes at one end and 2×Ø3.2 through-holes at the other, with a 40 mm dimension along the length. Your M4/M5 assumption is wrong for the TAL221. The M5 holes belong to the 5 kg TAL220B.
- **TAL220B 5 kg [P].** Safe overload 120 %FS, ultimate 150 %FS, 1.0 ± 0.1 mV/V, excitation 3 to 10 V, combined error 0.05 %FS, creep ± 0.1 %FS per 3 min, temperature coefficient of span and zero ± 0.05 %FS per 10 °C each. Size 55 × 12.7 × 12.7 mm with 2×M5 holes and Ø0.8 × 200 mm cable. https://cdn.sparkfun.com/assets/e/5/f/5/6/TAL220B.pdf
  - Unbranded "kit" cells vary: vendors list 1.0 ± 0.1, 1.2 ± 0.2 (SainSmart) and 2 ± 0.1 (Soldered) mV/V for "5 kg". That changes noise in grams by up to 2×. https://sainsmart.com/products/5kg-scale-load-weight-weighing-sensor-hx711-ad-sensor-with-base-tray-for-aduino and https://www.mouser.com/catalog/specsheets/Soldered_108321%20load%20cell%20module%20high%20precision%205kg.pdf (neither opened).
- **Real plate weights.** I found few per-plate figures.
  - Tuxton vitrified china: 6″ = 0.53 lb (240 g), 6.75″ = 0.69 lb (313 g), 7.875″ = 0.95 lb (431 g) [S]. Interpolated to 18 cm that is about 350 g. https://tuxton.com/products/chicago-plate
  - Commercial listings I could only see in search summaries (403 on fetch): Steelite 6¾″ at 15.2 oz (431 g), Steelite 7¼″ at about 13.8 oz (391 g), Olympia 185 mm at about 427 g per plate if the 5.12 kg is per pack of 12. https://www.chefsdeal.com/p/china-plates/steelite-6314p1015 and https://www.nisbets.com.au/olympia-whiteware-rounded-square-plates-185mm/u169
  - Domestic ware: IKEA Stilenlig 17 cm side plate is 0.29 kg including packaging. https://www.dimensions.com/element/ikea-stilenlig-side-plate-6-inch A 16 cm Dior porcelain plate is about 160 g (search summary only).
  - Corelle Premium 6¾″: 21 lb per 36-plate case is at most 265 g including packaging. https://www.webstaurantstore.com/corelle-premium-6-3-4-round-glass-bright-white-coupe-plate-case/5501152539C.html
  - Melamine and polypropylene plates are roughly 100 to 200 g: a Haba 18 cm melamine plate is 140 g and a Sterntaler 21.8 cm polypropylene plate is 109 g (galaxus listings, possibly package weights). https://www.galaxus.ch/en/s10/product/haba-teller-pinguin-childrens-tableware-54237114
  - So ceramic alone runs about 160 to 430 g. Add 50 to 150 g of platform and your 300 to 450 g tare is realistic, and it can be higher.
- **Food headroom [calc].** Tare is 300 to 450 g.

| Cell | Food to rated capacity | Food to safe overload |
|---|---|---|
| 1 kg | 550 to 700 g | 1050 to 1200 g at 150%; 750 to 900 g at 120% |
| 1.5 kg (TAL221) | 1050 to 1200 g | 1800 to 1950 g at 150% |
| 5 kg | 4550 to 4700 g | 5550 to 5700 g at 120% |

  - Accuracy is only specified up to 100% of rated capacity.
- **Resolution and noise, HX711 gain 128, 10 SPS [calc].** Assumes 1.0 mV/V and 4.3 V excitation; the datasheet floor uses 50 nV, the bench figure uses 14.5 noise-free bits.

| Cell | Counts per gram | Noise at datasheet floor | Noise at bench-realistic level |
|---|---|---|---|
| 1 kg | about 2150 | 0.012 g rms | about 0.05 g rms |
| 1.5 kg | about 1430 | 0.017 g rms | about 0.08 g rms |
| 5 kg | about 430 | 0.058 g rms (0.38 g peak-to-peak) | about 0.26 g rms |

  - At 80 SPS the datasheet-floor noise is about 1.8× higher per sample.
  - At 3.1 V excitation it is about 1.4× higher.
  - Noise is not the limiting factor for any of these cells at a 1 g target.
- **Absolute accuracy [calc from P].** 0.05 %FS is 0.5 g on 1 kg and 2.5 g on 5 kg. Creep per 3 min is 0.5 g (TAL221 1 kg) versus 5 g (TAL220B 5 kg). Zero drift is about 1 g per 10 °C (TAL221 1 kg) versus 2.5 g per 10 °C (TAL220B 5 kg). Tare right before each weighing. The 5 kg cell is 5× worse in grams.
- **Geometry.** The 130 mm platform under a 180 mm plate puts food up to about 90 mm off-centre on a 47 mm-long beam. The ± 0.1 %FS corner correction applies to an unspecified platform size.

**Recommendation.** Use a 1.5 to 2 kg bar cell: either TAL221 in the 1500 g version (same footprint and 1.0 mV/V column) or a TAL220B 2 kg. Cap plate plus platform at 350 g, targeting 300 g or less, which means a melamine or polypropylene plate or a thin porcelain one under about 250 g. If you stay at 1 kg, cap the tare at 250 g and accept a food limit of about 750 g.

**Confidence.** High on datasheet figures. Medium on plate weights (several are package weights or search summaries). Medium-low on gram-level noise, because it is computed and unmeasured.

---

## 4. Who drives the lighting, and with what

**Finding**
- **WS2812B logic level [P].** VIH = 0.7·VDD, VIL = 0.3·VDD, reset above 50 µs, and the test conditions use VDD = 4.5 to 5.5 V. At 5 V that is 3.5 V minimum for "high". https://cdn-shop.adafruit.com/datasheets/WS2812B.pdf
  - ESP32 VOH is only guaranteed ≥ 0.8·VDD, which is 2.64 V (Espressif datasheet above). A 3.3 V GPIO does not meet spec; it usually works on the bench and is not guaranteed.
- **Workarounds.**
  - **Level shifter:** Adafruit recommends a 74AHCT125 or 74HCT245, a 300 to 500 Ω series resistor on data, and 500 to 1000 µF (6.3 V or higher) across power. https://learn.adafruit.com/adafruit-neopixel-uberguide/best-practices https://learn.adafruit.com/adafruit-neopixel-uberguide/powering-neopixels
  - **SN74AHCT125:** VCC 4.5 to 5.5 V, VIH min 2 V, VIL max 0.8 V, tpd 6.5 to 8.5 ns max [P]. https://www.ti.com/lit/ds/symlink/sn74ahct125.pdf OE is active low, so tie it to GND.
  - **Diode trick [S]:** One signal diode in series with only the first pixel's VDD. It drops about 0.7 V, giving about 4.3 V and a VIH of about 3.0 V. The sources treat it as a workaround, not a guarantee, and a Schottky's smaller drop leaves too little margin. https://macmyths.com/cheating-at-5v-ws2812-control-to-use-3-3v-data/ A PJRC forum author also recommends a 74AHCT125. https://forum.pjrc.com/threads/71002-Launchpad-for-a-toddler?p=313353
  - **"Sacrificial pixel":** No source used that term; it is the same first-pixel-undervolted idea.
- **Free pins on Node B.**
  - With SD in 1-bit mode GPIO 12 and 13 are freed (SD uses 14, 15 and 2). Flash is on GPIO 4, which is also SD DATA1; one report says the flash stays dimly on even in 1-bit mode. https://randomnerdtutorials.com/esp32-cam-ai-thinker-pinout/
  - GPIO 12 (MTDI) is a strapping pin, pulled down by default; if it is high at reset the flash voltage is set to 1.8 V and boot fails on 3.3 V flash [P]. https://documentation.espressif.com/esp32_datasheet_en.pdf (Section 3.2)
  - GPIO 2 and 15 are also strapping pins. GPIO 13 is not. GPIO 14 is also free if SD is dropped.
  - So GPIO 13 is usable for WS2812B data on Node B (with a buffer); 12, 2 and 15 are best avoided, and GPIO 4 drives the flash LED.
  - Node A's own pin map uses GPIO 5, a strapping pin that defaults to pull-up [P]. It works, but a non-strapping pin such as GPIO 25 to 27 or 32/33 avoids boot-state coupling.
- **Flash LED draw and suitability.**
  - AI-Thinker spec: 180 mA at 5 V without flash and 310 mA with flash at full brightness, so the flash is about 130 mA [calc]. https://atta.szlcsc.com/upload/public/pdf/source/231023/C17416982-30bc871038898b12774324a310c0150b.pdf
  - Forum reports say it has no current-limiting resistor and is "not made for continuous operation" (Prusa forum, relayed from GitHub; I did not see the schematic). https://forum.prusa3d.com/forum/user-mods/esp32cam-software-and-lighting-options/
  - It is a single small point source beside the lens, so at 25 cm expect a hotspot and a specular glint on glazed ceramic [my engineering judgment, no source tested it].
  - General lighting practice: a large diffused source gives a gentle highlight, an angle near 45° moves glare out of the lens, and a polarizer helps on non-metals. https://evezone.evetech.co.za/quick-bytes/taming-harsh-glare-product-photography-softened-continuous-lighting
- **Ring size.** A 12-pixel WS2812B ring is a small source (my estimate is a few cm across), so it will still give a localized highlight. The simplest fix is two or more cool-white non-addressable strips or COB panels at about 45° behind a diffuser, switched by a logic-level MOSFET.

**Recommendation.** Node A should drive the lighting. It has free non-strapping pins, a 5 V rail, and it already sequences tare, weigh and shoot. Preferred option is a non-addressable white LED panel or strips with a diffuser, switched by a logic-level N-MOSFET with PWM from Node A. That needs no level shifter or timing-sensitive protocol, and the flash LED can be dropped. If you keep the WS2812B ring, drive it from Node A through the 74AHCT125 (OE to GND) with a 330 Ω series resistor and a 1000 µF/6.3 V+ capacitor, and cap current in firmware.

**Confidence.** High on the WS2812B threshold and the pin facts. Medium on the diode trick and the glare reasoning.

---

## 5. ESP32-CAM power

**Finding**
- **Rated current.** AI-Thinker lists 180 mA at 5 V without flash, 310 mA with flash at full brightness, 6 mA in deep sleep, and a supply range of 4.75 to 5.25 V. https://atta.szlcsc.com/upload/public/pdf/source/231023/C17416982-30bc871038898b12774324a310c0150b.pdf
- **Measured figures conflict [S].** Mischianti gives about 80 mA not streaming, 100 to 160 mA streaming, and 270 mA streaming with flash. It states no test conditions and writes "mAh". https://mischianti.org/esp32-cam-pinout-specs-and-arduino-ide-configuration-1/
- **Peaks.**
  - The ESP32 datasheet gives 240 mA for 802.11b TX at 1 Mbps (+19.5 dBm), 190 mA for 11g 54 Mbps, 180 mA for 11n MCS7 and 95 to 100 mA for RX at 3.3 V [P]. It also requires an external supply able to deliver at least 0.5 A. https://documentation.espressif.com/esp32_datasheet_en.pdf (Tables 5-2 and 5-4)
  - ESP-NOW's default rate is 1 Mbps [P] (https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-reference/network/esp_now.html), so I infer it uses the 240 mA TX class. That is a deduction, not stated.
  - Guides say Wi-Fi plus camera init can spike above 500 mA. I found no scope-level measurements of camera init. https://electricalflux.com/mcu-general/esp32-cam-hardware-compatibility
- **Why it browns out.** The 3.3 V comes from a linear AMS1117 (dropout 1.3 V typical at 1 A [P]). Causes listed by MakerGuides: thin or long wires, breadboard contacts, weak USB ports, power banks with auto-shutdown, powering via the 3.3 V pin, a defective AMS1117. https://www.makerguides.com/fix-brownout-of-esp32-cam/
- **Recommended supply and capacitance.** A regulated 5 V/2 A (at least 1 A) supply to the 5 V pin, 22 AWG or thicker short leads, and 470 to 1000 µF low-ESR plus 0.1 µF at the board (MakerGuides, ElectricalFlux). Random Nerd Tutorials says to "always" power through the 5 V pin. https://randomnerdtutorials.com/esp32-cam-ai-thinker-pinout/
  - A USB charger into the 5 V pin is fine given the 4.75 to 5.25 V spec. Avoid power banks and any long USB cable.
- **Budget for 5 V/2 A.**

| Item | Typical | Worst case | Source |
|---|---|---|---|
| Node B (camera) | 180 mA | 500 mA (spike class) or 310 mA with flash | [P], [S] |
| Node A (ESP32 plus OLED, HX711, buzzer, LDO quiescent) | about 150 mA | about 350 mA | [calc]; OLED and buzzer assumed, AMS1117 quiescent 3 to 10 mA is [P] |
| WS2812B ring, 12 pixels | 240 mA (at 20 mA each) | 720 mA (at 60 mA each) | Adafruit rule of thumb |
| **Total** | about 570 mA | about 1.57 A | [calc] |

  - 5 V/2 A is adequate. Worst case is about 78% of capacity, so cap ring current in firmware (for example 5 V at 400 mA) and star-wire the supply to each board.

**Recommendation.** Keep the 5 V/2 A supply and the 470 to 1000 µF plus 100 nF at the camera, wired straight to the 5 V pin with short thick leads and no breadboard. Add 1000 µF on the ring and star-wire from the supply.

**Confidence.** High on rated figures. Medium on the budget (several assumed loads). Low on true peak behavior (no scope measurements found).

---

## 6. Flashing the ESP32-CAM

**Finding**
- **FTDI or CP2102 adapter.** Wire GND, 5 V to VCC, U0R to TX, U0T to RX and GPIO 0 to GND, then press RST. Remove the GPIO 0 link and press RST after upload. The article tells you to set the adapter to 5 V, but several reader comments warn a 5 V logic setting can damage the ESP32 inputs; one suggests logic at 3.3 V with the adapter's 5 V pin to the camera's 5 V pin. https://randomnerdtutorials.com/program-upload-code-esp32-cam/
  - 5 V logic into U0R exceeds the ESP32's VIH max (VDD + 0.3 V, Espressif datasheet above). I did not verify here that these adapters' 3.3 V pins can only supply tens of mA; power the camera from 5 V.
- **ESP32-CAM-MB (CH340).** Plug-in shield, "click Upload" in the best case. Fallback is to hold IO0 and tap RST. Known issues: charge-only cables fail, some modules lack the "GND/R" pad so auto-reset fails, "Timed out waiting for packet header", and weak laptop USB ports. https://randomnerdtutorials.com/upload-code-esp32-cam-mb-usb/
  - Reliability depends on the DTR/RTS timing of the host and the board's reset wiring, not the CH340 chip itself; there is no head-to-head test. https://forum.micropython.org/viewtopic.php?p=56534
- **Arduino Uno as bridge.** Tie the Uno's RESET to GND, cross TX/RX, GPIO 0 to GND, 5 V to 5 V. The Uno's 5 V TX goes into a 3.3 V RX, and its 5 V supply is limited by USB, so brownouts during upload are common. https://circuitdigest.com/microcontroller-projects/how-to-program-esp32-cam-using-arduino

**Recommendation.** Buy the ESP32-CAM-MB and a known-good data cable as the primary method, and keep a CP2102/FT232 adapter set to 3.3 V logic with a separate 5 V feed as backup. Treat the Uno as a last resort.

**Confidence.** Medium; this rests on anecdotes rather than measured tests.

---

## 7. ESP-NOW + Wi-Fi coexistence

**Finding**
- **Channel rule [P].** A peer's channel is 0 to 14. Channel 0 means "send on the current channel"; otherwise it must match the local device's channel, and `esp_now_send()` can return `ESP_ERR_ESPNOW_CHAN`. ESP-NOW data must be sent after Wi-Fi starts. https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-reference/network/esp_now.html
- **Station follows the AP [P].** A station joined to a router sits on the router's channel, and a soft-AP follows the station's channel. https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-reference/network/esp_wifi.html
- **Practical pattern [S].** Random Nerd Tutorials: the sender must use the same channel as the receiver, the router assigns it, and the sender scans for the SSID and sets the channel in `setup()`. An auto-pairing variant has the sender try channels until the server replies. https://randomnerdtutorials.com/esp32-esp-now-wi-fi-web-server/ The author admits "not sure if there's a better way", and a reader called it unstable.
- **What Node A must do.** Node A, not on Wi-Fi, must be in station mode with `esp_wifi_set_channel(n)` set to Node B's channel before adding the peer, or run a channel-scan handshake.
  - The Espressif sources above confirm the rule but not a specific Arduino call sequence; the call pattern is from the tutorial.
- **Payload size [P].** v1 is 250 bytes; v2 is 1470 bytes. v2 devices receive from both; v1 devices receive only v1 packets plus v2 packets up to 250 bytes. Longer v2 packets to v1 devices are truncated or dropped. Your tare/weight/shoot messages are a few bytes. Check the IDF version for v2.
- **Power save [S].** One ESP32 forum poster reports heavy unicast ESP-NOW loss whenever Wi-Fi power save is not off, while broadcast was fine. The Espressif docs say sleep is supported only as a station. https://esp32.com/viewtopic.php?p=70762
  - Disable modem sleep on Node B (`WiFi.setSleep(false)`) and test.
- **Phone hotspot.** I found no source documenting an Android or iOS hotspot changing 2.4 GHz channels. The risk follows from the channel rule: if the AP moves, Node B follows it and Node A silently misses.

**Recommendation.** Fix the router's 2.4 GHz channel if you control it, and hard-code the same channel on Node A. For hotspots or an unknown AP, use a hop-and-reply handshake at boot and after any Wi-Fi reconnect, and re-read Node B's channel after every reconnect. As an alternative, make Node B a soft-AP on a fixed channel.

**Confidence.** High on the rule and payload limits. Medium-low on hotspot behavior (inferred, no direct source).

---

## 8. microSD in 1-bit mode on the AI-Thinker board

**Finding**
- **Pins.** 4-bit mode uses GPIO 14 (CLK), 15 (CMD), 2 (D0), 4 (D1), 12 (D2) and 13 (D3). In 1-bit mode GPIO 12 and 13 are freed. GPIO 4 stays the flash LED, which still glows dimly per one reader report (`SD_MMC.begin("/sdcard", true)`). https://randomnerdtutorials.com/esp32-cam-ai-thinker-pinout/
  - GPIO 16 is the PSRAM chip-select on the module. A commenter notes GPIO 2 must be low at power-up for programming, which an SD card can break. https://randomnerdtutorials.com/program-upload-code-esp32-cam/
- **Current.** SD cards draw up to 100 to 200 mA while writing per card specs I could only see in a search summary; one tester logged 300 mA peaks. https://forum.arduino.cc/t/power-consumption-to-write-to-sd-card/129434 That adds directly to the brownout risk on a 5 V rail already near 310 mA.
- **Is it needed?** For a "fallback" that only has to survive a failed upload, a retry from PSRAM or a small partition in the module's 4 MB flash (about 50 to 100 KB per JPEG) is likely enough. That sizing is my estimate, not sourced.

**Recommendation.** Drop the SD card from the first build. That frees GPIO 2, 12, 13, 14 and 15, removes a 100 to 200 mA write-spike source, and avoids the flash-LED and GPIO 2 side effects. Keep it only if offline storage is a real requirement.

**Confidence.** High on pins, medium on the current figures and the fallback sizing.

---

## 9. WROOM versus WROVER on a 30-pin DevKit V1

**Finding**
- **WROOM-32 [P].** GPIO16 and GPIO17 are normal GPIOs on module pins 27 and 28, with 4 MB SPI flash and no PSRAM. The v3.8 datasheet is marked Not Recommended For New Designs (the WROOM-32E is the successor). https://documentation.espressif.com/esp32-wroom-32_datasheet_en.pdf
- **WROVER-E [P].** The module offers PSRAM variants (N4R8, N8R8, N16R8, plus EOL N4R2, N8R2, N16R2), and pins 27 and 28 are listed as unconnected. https://documentation.espressif.com/esp32-wrover-e_esp32-wrover-ie_datasheet_en.pdf
- **Chip level [P].** GPIO16 is PSRAM CE# and GPIO17 is PSRAM SCLK for external PSRAM. https://documentation.espressif.com/esp32_datasheet_en.pdf (Table 2-6)
  - Espressif's ESP-WROVER-KIT docs say the same and do not route those pins to the headers (search summary, I did not open it). https://github.com/espressif/esp-idf/blob/v5.1.2/docs/en/hw-reference/esp32/get-started-wrover-kit.rst
- **DevKit V1.** The DOIT ESP32 DevKit V1 is documented as based on the ESP32-WROOM-32, with micro-USB. https://docs.zephyrproject.org/latest/boards/others/doit_esp32_devkit_v1/doc/index.html I found no source for a "DevKit V1" shipping with WROVER, but unbranded clones vary; one forum thread says some boards wire module pins 27 and 28 to breakout pads anyway. https://esp32.com/viewtopic.php?p=41314

**Recommendation.** Keep HX711 on GPIO 16 and 17 but read the module marking when the board arrives. If it says WROVER, move the HX711 to other pins such as 25 to 27.

**Confidence.** High on the datasheet facts; medium on what clone boards actually ship.

---

## 10. OV2640 lens, field of view and plate fit

**Finding**
- **Sensor [P].** Image area is 3590 × 2684 µm, pixels are 2.2 µm, optical format is 1/4″, chief ray angle is 25° non-linear, and UXGA runs at 15 fps. https://www.uctronics.com/download/cam_module/OV2640DS.pdf (read from the saved PDF)
- **Field of view.** The stock lens is quoted as 65° (Arducam), 66° (espboards), 68° with f/2.4 (SunFounder) and 75° (ElectricalFlux). None says whether that is horizontal or diagonal. https://blog.arducam.com/esp32-machine-vision-learning-guide/ https://www.espboards.dev/blog/esp32-camera-modules-compared/ https://docs.sunfounder.com/projects/esp-cam-kit/en/latest/component_camera.html
- **Focus.**
  - The lens is fixed focus with a threaded barrel; you can turn it with needle-nose pliers to move the focus nearer or farther. https://www.espboards.dev/blog/esp32-camera-modules-compared/
  - The glue is hot-melt, and warming it helps. https://forum.arduino.cc/t/eps32-cam-out-of-focus-ov2640/881989
  - I found no primary source for the factory focus distance. One secondary summary says it is set far (about 1 m to infinity, with blur inside about 30 cm), but I could not reconfirm it. Test yours.
- **Fit [calc].** The OV2640 is 4:3, so the vertical angle limits. Vertical coverage is 0.78·D if 66° is diagonal, or 0.97·D if 66° is horizontal.
  - At 250 mm that is 195 mm (diagonal case) or 244 mm (horizontal case). A 180 mm plate fits in both but with only about 7 mm of margin per side in the diagonal case.
  - A 10% margin (200 mm) needs 257 mm (diagonal case) or 205 mm (horizontal case). Food height shortens the distance by 3 to 6 cm.
  - At 300 mm the plate fills 77% or 62% of the frame height (462 or 370 px at SVGA 800×600). At 350 mm it fills 66% or 53%.

**Recommendation.** Mount the lens 300 to 350 mm above the table. 250 mm is marginal. Refocus the lens by hand for that distance using a printed target, and shoot at SVGA or higher.

**Confidence.** Medium: the geometry is solid, but the FOV definition and factory focus are unconfirmed.

---

## 11. Wrong, redundant or missing in the BOM

**Finding**
- **Buttons.** ESP32 has internal pull-up and pull-down resistors of about 45 kΩ typical [P], so no external resistors are needed. Add a 100 nF cap per button or debounce in software. https://documentation.espressif.com/esp32_datasheet_en.pdf
- **Buzzer.** A passive piezo can be driven straight from a GPIO through 100 to 220 Ω, with no transistor and no flyback diode, because a piezo is capacitive. A magnetic "passive buzzer" is a coil and needs the transistor plus a flyback diode such as a 1N4148. The 1 kΩ base resistor from 3.3 V gives about 2.6 mA base drive [calc]. https://zbotic.in/piezoelectric-buzzer-active-vs-passive-and-how-to-drive-them/ (flyback reasoning is general knowledge, not in that source)
  - A GPIO can source at most about 40 mA [P].
- **Cell mounting and wiring.** TAL221 uses M3 and Ø3.2 holes, so use M3 screws and spacers; the cell body is only 6 mm thick. Its leads are 110 mm and thin (Ø0.6), so splice to a short shielded 4-core cable and keep the HX711 module close. SparkFun's guide shows an optional shield/EMI wire and warns of ±5% real-world error from temperature, creep and vibration. https://learn.sparkfun.com/tutorials/load-cell-amplifier-hx711-breakout-hookup-guide
- **USB cable.** The DevKit V1 uses micro-USB (Zephyr page above), and charge-only cables fail for flashing (Random Nerd Tutorials, Q6). I did not verify that some clones ship USB-C.
- **Supply.** Add a power switch, and keep USB and VIN from backfeeding each other (a Schottky diode in series with VIN). I did not verify whether the DevKit V1 already isolates them.
- **Other omissions.**
  - A 330 Ω series resistor on the ring data line, 74AHCT125 OE tied to GND, and a 0.1 µF at the 74AHCT125.
  - Check HX711 E− continuity to GND.
  - Header pins if the boards arrive unsoldered (not verified per vendor).
  - A 130 mm platform under a 180 mm plate is an overhang and tipping risk.

**Recommendation.** Treat the changes in the parts list below as the fix list.

**Confidence.** Medium; this section pulls from several threads and general electronics practice.

---

## A. Corrected parts list

| Part | Action | Reason |
|---|---|---|
| ESP32 DevKit V1 (WROOM-32, 30-pin) | Keep, verify marking | GPIO 16/17 free only on WROOM |
| Micro-USB data cable (DevKit) | Keep, require data type | Charge-only cables fail |
| HX711 module | Keep | Default 10 SPS, VCC from 3V3 |
| Buck converter for HX711 | Drop | AMS1117 3V3 is simpler and quieter |
| Divider on DOUT | Add only if HX711 runs at 5 V | ESP32 VIH max = VDD + 0.3 V |
| 10 µF + 100 nF at HX711 | Add | Local decoupling |
| TAL221 1 kg | Change to TAL221 1.5 kg or TAL220B 2 kg | Overload headroom for 300 to 450 g tare |
| Plate | Change to melamine/PP or ≤ 250 g porcelain | Keep tare ≤ 350 g |
| Cell mounting hardware | Change to M3 screws and spacers | TAL221 is M3 and Ø3.2, not M4/M5 |
| Shielded 4-core cable | Add | Cell leads are 110 mm, Ø0.6 |
| SSD1306 OLED | Keep | No change |
| Tare and capture buttons | Keep, no resistors | Internal 45 kΩ pull-ups; optional 100 nF |
| Passive buzzer + 2N2222/BC547 + 1 kΩ | Keep if magnetic; add 1N4148 | Coil kickback |
| Passive piezo disc | Change to direct drive via 100 to 220 Ω | No transistor or diode needed |
| WS2812B ring | Change to white LED panel or strips with MOSFET, or keep ring on Node A | Hotspot, no level shifter needed |
| SN74AHCT125 + 330 Ω | Keep only if ring kept; tie OE to GND; move to Node A | VIH min 2 V |
| 1000 µF/6.3 V+ on ring | Add | Adafruit guidance |
| Ring/LED control on Node B | Drop | Few free pins; strapping risks |
| AI-Thinker ESP32-CAM (OV2640) | Keep; refocus lens for 300 to 350 mm | Factory focus unverified |
| ESP32-CAM-MB (CH340) + data cable | Add | Easiest flashing |
| CP2102/FT232 at 3.3 V logic | Add as backup | MB boards can be flaky |
| microSD | Drop | Frees pins, removes write spikes |
| 5 V/2 A supply | Keep | Worst-case about 1.57 A [calc]; cap ring current |
| 470 to 1000 µF + 100 nF at ESP32-CAM | Keep | Matches guides |
| Power switch, Schottky if VIN + USB | Add | Safe supply handling |
| Short 22 AWG power leads, no breadboard in power path | Keep | Brownout guidance |

## B. Things I could not verify

- The TAL221 datasheet is a distributor copy; I did not open htc-sensor.com. Overload conflicts (150/200% versus 120/150%) are unresolved.
- Real AVDD of a green HX711 module at 3.3 V; no source measured it (my 3.0 to 3.2 V is an estimate).
- Any measured comparison of an HX711 on a buck versus an LDO.
- HX711 noise-free-bit conflict: datasheet-derived about 16.6 to 16.9 bits versus bench 14 to 15; a "17.3 bits" claim (Chinese copy, via search summary) was not opened.
- ESP32 5 V tolerance: the Espressif datasheet versus a tutorial commenter's claim.
- Per-plate weights for a specific 18 cm plate; several figures are package weights or 403-blocked search summaries.
- Flash LED current (about 130 mA is inferred) and its series resistor.
- Scope-level ESP32-CAM peaks (camera init, Wi-Fi TX) and the brownout threshold (a search summary suggested about 2.43 V; I could not confirm it).
- Factory focus distance, lens focal length and whether 65 to 68° is horizontal or diagonal.
- Whether any DevKit V1 clone ships with WROVER, and USB-C versus micro-USB variants.
- ESP-NOW v2 IDF version, Arduino-core call sequence for setting the channel, and how Android or iOS hotspots choose or change channels.
- Whether FTDI adapters' 3.3 V pins can only supply tens of mA (general knowledge only).
- One page, esp32.com viewtopic p=56003, returned a bot-check interstitial offering an "OVERRIDE" option. I did not act on it, and that thread's content is unread.
