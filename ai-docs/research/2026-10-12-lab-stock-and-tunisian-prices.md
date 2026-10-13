<!-- Recovered verbatim from a research subagent's final report (Claude Sonnet), run on 2026-10-12.
     A snapshot: prices, stock and links were true on that date only. Decisions D12 and D13 in
     docs/decisions.md were made from it. What it marks as unverified is still unverified. -->

# Smart Food Scale: faculty-lab parts, Tunisian prices and substitutes

All prices were read on 2026-10-12. Tunisian shops write dinars with three decimals and a comma, so "7,000 TND" means 7.000 TND (seven dinars). I could not open any Tunisian faculty or ISET inventory, TP handout or course kit list. Section 1 is therefore inferred from starter-kit contents, vendor claims about their university customers, and FabLab directory entries.

Verification codes used in the price table:
- **P**: I opened the product page and read the price.
- **L**: I saw the price only on a search or category listing.
- **S**: I saw the price only in a search-engine snippet; the page was not opened.

## 1. Classification of lab stock

| Item | Class | Why | Source |
|---|---|---|---|
| ESP32 DevKit (WROOM-32) | Often available | Appears in current ESP32 teaching kits. Didactico sells TP packs of 20–30 boards to ENIT, INSAT, ENSI, Sup'Com, ISET and FST (vendor claim). Costs 28.5 TND. | [Elektor kit](https://elektor.com/elektor-esp32-smart-kit), [Didactico partners](https://didactico.tn/partenaires-education/) |
| ESP8266 NodeMCU | Often available | The older IoT TP board, bundled in some kits. Useless for this project. | [SunFounder kit list](https://docs.sunfounder.com/projects/umsk/en/latest/01_components_basic/00-component_list.html), [Didactico](https://didactico.tn/produit/carte-developpement-esp8266-cp2102/) |
| Arduino Uno / Mega | Lab staple | In the official Starter Kit. CH340 clones cost 21–30 TND. | [Arduino kit](https://store.arduino.cc/products/arduino-starter-kit-multi-language), [Didactico Uno](https://didactico.tn/produit/carte-arduino-uno-r3-3/) |
| ESP32-CAM | Project-specific | Only camera-specific kits ship one. The Arduino, Elegoo and Elektor kits do not. Costs 33.5 TND. | [SunFounder ESP32 kit](https://sunfounder.com/collections/more-popular-products/products/sunfounder-esp32-ultimate-starter-kit-with-esp32-camera-extension-board-battery) |
| USB-TTL adapters (FT232RL, CP2102, CH340) | Often available | The chips sit on most dev boards, but standalone adapters are not in kits. They cost 10–12 TND. | [Didactico FT232RL](https://didactico.tn/produit/convertisseur-usb-uart-ft232rl/) |
| ESP32-CAM-MB base | Project-specific | Ships only with camera boards or kits. Costs 9.5 TND. | [Didactico](https://didactico.tn/produit/module-shield-esp32-cam-mb/) |
| Breadboards and jumpers | Lab staple | Every kit includes them (Arduino kit: 400-point board and 70 jumpers). | [Arduino kit](https://store.arduino.cc/products/arduino-starter-kit-multi-language) |
| Resistor/capacitor assortments | Lab staple | The Arduino kit has 65 resistors and 3×100 µF. | [Arduino kit](https://store.arduino.cc/products/arduino-starter-kit-multi-language) |
| Electrolytics 470–1000 µF | Often available | Kits stop at about 100 µF. A 1000 µF cap costs 0.9 TND, so buy it. | [Tuni Smart](https://tuni-smart-innovation.com/search?q=condensateur+1000uf&type=product) |
| 2N2222 / BC547 | Lab staple | Standard in analog-electronics TP. The Elegoo kit lists PN2222 (third-party list, partial). The Arduino kit has only IRF520 MOSFETs. | [Elegoo manual](https://manuals.plus/asin/B01CZTLHGE) |
| Tactile push buttons | Lab staple | The Arduino kit has 10. | [Arduino kit](https://store.arduino.cc/products/arduino-starter-kit-multi-language) |
| Passive and active buzzers | Lab staple | Every kit I checked has one. | [SunFounder list](https://docs.sunfounder.com/projects/umsk/en/latest/01_components_basic/00-component_list.html), [Elektor](https://elektor.com/elektor-esp32-smart-kit) |
| 5 mm LEDs incl. white | Lab staple | The Arduino kit has 27 coloured LEDs plus 1 bright white. | [Arduino kit](https://store.arduino.cc/products/arduino-starter-kit-multi-language) |
| LCD 16x2 with I2C (PCF8574) | Often available | The 16x2 is a staple. The Arduino kit's LCD is parallel, not I2C. SunFounder's I2C LCD1602 is included. The backpack alone costs 5 TND. | [Arduino kit](https://store.arduino.cc/products/arduino-starter-kit-multi-language), [SunFounder](https://docs.sunfounder.com/projects/umsk/en/latest/01_components_basic/00-component_list.html), [Didactico backpack](https://didactico.tn/produit/carte-i2c-pcf8574/) |
| SSD1306 0.96" OLED | Often available | Included in SunFounder kits, absent from the Arduino and Elegoo Uno kits. Costs 18 TND. | [SunFounder](https://docs.sunfounder.com/projects/umsk/en/latest/01_components_basic/00-component_list.html) |
| HX711 + bar load cell | Project-specific | No starter kit includes either. Sold separately in Tunisia (7 TND and 8–10 TND). | [Tuni Smart](https://tuni-smart-innovation.com/search?q=hx711&type=product) |
| 50 kg half-bridge sensors | Project-specific (and wrong range) | Didactico lists a "50 kg" sensor at 7.5 TND with no bridge type stated. | [Didactico](https://didactico.tn/produit/capteur-de-pesage-de-50kg/) |
| WS2812B | Strips: often available. Rings: project-specific | The SunFounder ESP32 kit has a strip. Rings are sold by shops only. | [SunFounder kit](https://esp32-ultimate-starter-kit.readthedocs.io/en/latest/genindex.html), [CoThings](https://cothings.net/search?q=ws2812&type=product) |
| 74AHCT125 | Project-specific | 0 results at Didactico, Tuni Smart and CoThings. | See section 2 |
| 74HCT245 | Project-specific (not found) | 0 results at the same three shops. | [Didactico](https://didactico.tn/?s=74HC245&post_type=product) |
| BSS138 level-shifter modules | Often available | 6 TND at Didactico. They are too slow for WS2812 (section 3). | [Didactico](https://didactico.tn/produit/module-convertisseur-de-niveau-logique-2-canaux-33-v-5-v-ttl/) |
| AMS1117-3.3 modules | Often available | 2.5 TND. You do not need one (section 5). | [Didactico](https://didactico.tn/produit/module-ams1117-3-3/) |
| LM2596 / MP1584 buck modules | Often available | 4.5–5 TND. You do not need one (section 5). | [Didactico](https://didactico.tn/produit/module-lm2596s/) |
| MB102 breadboard power module | Often available | Elegoo and SunFounder kits include a breadboard power module. | [Elegoo](https://manuals.plus/asin/B01CZTLHGE) |
| microSD cards and SD modules | Often available | Cheap and widespread. An SD module costs 5 TND. | [Didactico](https://didactico.tn/produit/module-micro-sd-6-pin/) |
| 5 V 2 A chargers / power banks | Lab staple (chargers); power banks are student-owned | Chargers cost 7.6–14 TND. My inference; no lab source. | See section 2 |
| Bench DC supply, multimeter, oscilloscope | Lab staple | Core instruments of electronics TP. Secondary source only (PDF unreadable to my tool). | [HELHa](https://www.helha.be/ects/TE/L8/122_8_TELE1B07EAP.pdf), [Didactico measuring page](https://didactico.tn/categorie-produit/appareils-de-mesures/) |
| Soldering station | Often available | Shared and often queued. | [Didactico](https://didactico.tn/categorie-produit/fer-a-souder-outillage/materiel-de-soudage-fer-a-souder-outillage/stations-a-souder/) |
| Calibration masses | Often available (physics/chemistry labs), grade unknown | Mettler-Toledo's Tunisian page lists "Poids de mesure". No retailer or price found. | [mt.com/tn](https://www.mt.com/tn/fr/home.html) |
| Digital kitchen scale | Often available (household, not a lab item) | A 5 kg, 1 g-step scale was 19.9 TND but out of stock. | [Spacenet](https://spacenet.tn/balance-cuisine/100978-balance-de-cuisine-digital-5kg-blanc.html) |
| 3D printer / laser cutter | Often available | FabLab ENIT lists 3D printing, CNC, circuit production and laser. ISET Sidi Bouzid lists printers and laser cutters. | [ENIT](https://fablabs.io/labs/fablabenit), [ISET Sidi Bouzid](https://fablabs.io/labs/fablabisetsidibouzid) |

## 2. Tunisian prices (seen 2026-10-12)

| Part | Shop | Listed name | Price TND | URL | Verified |
|---|---|---|---|---|---|
| ESP32-CAM, bare | Didactico | Module Camera ESPCAM OV2640 | 33.500 | [link](https://didactico.tn/produit/camera-espcam-ov2640/) | P, in stock. Spec table says AI-Thinker; USB-TTL not included. The page contradicts itself on 3.3 V vs 5 V power. |
| ESP32-CAM, bare | Tuni Smart | ESP32-CAM Carte de développement Wifi + Bluetooth avec Module caméra OV2640 | 33.500 (was 51.900) | [link](https://tuni-smart-innovation.com/products/esp32-cam-carte-de-developpement-wifi-bluetooth-avec-module-camera-ov2) | P, in stock |
| ESP32-CAM, bare | CoThings | ESP32-CAM Avec Module Camera OV2640 (sans port micro usb) | 33.500 | [link](https://cothings.net/products/esp32-cam-cp2102-carte-developpement-avec-module-camera-ov2640) | L |
| ESP32-CAM + base | Didactico | Module ESP32-CAM-CH340 … caméra OV2640 | 45.000 | [link](https://didactico.tn/produit/module-esp32-cam-340/) | P. CH340 serial port listed; the base is not explicitly confirmed. |
| ESP32-CAM + base | CoThings | ESP32-CAM-CH340 … et port micro USB | 45.000 | [link](https://cothings.net/products/esp32-cam-ch340-cp2102-carte-developpement-avec-module-camera-ov2640) | L, sold out |
| ESP32-CAM + base | 2btrading | ESP32-CAM Micro USB vers Port série … OV2640 2M | 43.000 TTC | [link](https://2btrading.tn/accueil/7018-esp32-cam-micro-usb-vers-port-serie-avec-module-de-camera-ov2640-2m.html) | S. Site returned HTTP 403 to my fetcher. |
| ESP32-CAM | Jumia TN | Module ESPCAM avec OV2640 | 40.00 (struck 66.00) | [link](https://www.jumia.com.tn/arduino-module-espcam-avec-ov2640-camera-377539.html) | S. The URL redirected to jumia.com. |
| MB programmer base | Didactico | Module shield de programmation ESP32-CAM-MB | 9.500 | [link](https://didactico.tn/produit/module-shield-esp32-cam-mb/) | P, in stock. CH340, micro-USB, BOOT and RST buttons. Camera not included. |
| MB programmer base | 2btrading | Module shield de programmation ESP32-CAM-MB | 8.500 TTC | [link](https://2btrading.tn/accueil/7944-module-shield-de-programmation-esp32-cam-mb.html) | S |
| MB-type base | CoThings | Module de téléversement MICRO USB pour ESP32 CAM | 8.000 | [link](https://cothings.net/products/module-de-televersement-micro-usb-pour-esp32-cam) | P, but the description text is for an 18650 battery holder. Ask the seller before ordering. |
| ESP32 DevKit 30-pin | Didactico | Carte de développement ESP-WROOM-32 CH340 Type-C 30PIN | 28.500 | [link](https://didactico.tn/produit/carte-developpement-esp-wroom-32/) | P, in stock |
| ESP32 DevKit 30-pin | Didactico | ESP32S-WROOM-32 CP2102 30Pin | 28.000 (regular 34.000) | [link](https://didactico.tn/produit/carte-esp32s-wroom-32/) | L |
| ESP32 DevKit 30-pin | Tuni Smart | Carte ESP32 CP2102 WiFi + Bluetooth USB Type C 30pin | 28.600 | [link](https://tuni-smart-innovation.com/products/carte-esp32-cp2102-wifi-bluetooth-usb-type-c-30pin) | L |
| ESP32 DevKit 30-pin | Souilah Électronique | Carte de Développement ESP32 WROOM-32 CP2102 … 30 broches | 30.000 | [link](https://souilah-electronique.tn/modules-et-capteurs/55-module-nodemcu-esp32.html) | P. Stock not shown. |
| HX711 | Didactico | Module de capteur de pesage à deux canaux – HX711 | 7.000 | [link](https://didactico.tn/produit/capteur-pesage-hx711/) | P, in stock |
| HX711 | Tuni Smart | HX711 Module Amplificateur Pour Capteur de poids et pression | 7.100 | [link](https://tuni-smart-innovation.com/products/hx711-module-amplificateur-pour-capteur-de-poids-et-pression) | P, in stock |
| HX711 | CoThings | Module capteur de pression de pesée HX711, grand format avec soudure | 6.500 | [link](https://cothings.net/products/module-capteur-de-pression-de-pesee-hx711-grand-format-avec-soudure) | L, sold out |
| 1 kg bar cell | Tuni Smart | Capteur de Poids 1KG | 8.000 | [link](https://tuni-smart-innovation.com/products/capteur-de-poids-1kg) | P, in stock. 4-wire aluminium bar. Page has leftover placeholder text. |
| 5 kg bar cell | Tuni Smart | Capteur De Poids 5kg | 10.000 | [link](https://tuni-smart-innovation.com/products/capteur-de-poids-5kg) | P, in stock. 4-wire, 1.0 ± 0.1 mV/V. |
| 1–10 kg cell | Didactico | Capteur de pesage YZC (1 à 10 kg) | 9.400–15.000 by variant | [link](https://didactico.tn/produit/capteur-de-pesage-3kg-yzc-131/) | P. Per-variant price not shown. 4-wire parallel beam. |
| 10 kg / 20 kg cell | CoThings | … 10 kg / 20 kg pour balance de cuisine électronique YZC-133 | 10.000 / 16.000 | [10 kg](https://cothings.net/products/capteur-de-cellule-de-charge-de-pesee-10-kg-pour-balance-de-cuisine-electronique-yzc-133-avec-fils) | L |
| Load cell + HX711 kit | None found | Searched Didactico, Tuni Smart, and CoThings page 1 of 2 | n/a | [Tuni Smart](https://tuni-smart-innovation.com/search?q=kit+balance+hx711&type=product) | Not found |
| 50 kg sensor | Didactico | Capteur de pesage de 50kg | 7.500 | [link](https://didactico.tn/produit/capteur-de-pesage-de-50kg/) | P. Bridge type and wire count not stated. |
| SSD1306 0.96" I2C | Didactico | Ecran OLED Blanche 0,96″+ I2C SSD1306 4pin | 18.000 | [link](https://didactico.tn/produit/ecran-oled-0-96-i2c/) | P, in stock. 3.3–5 V. |
| SSD1306 | Tuni Smart | 0.91" 128×32 at 17.500; 1.3" at 24.500; the 128×64 listing is sold out | n/a | [search](https://tuni-smart-innovation.com/search?q=ssd1306+0.96&type=product) | L. No 0.96" in stock. |
| LCD 16x2 I2C | Didactico | Ecran LCD 1602 avec carte I2C | 13.399 | [link](https://didactico.tn/produit/ecran-lcd-1602-i2c/) | P, in stock. PCF8574, needs 5 V. |
| WS2812 ring 16 LED | CoThings | WS2812 5050 Anneau RGB 16 LED avec pilote | 11.000 | [link](https://cothings.net/products/ws2812-5050-anneau-rgb-16-led-avec-pilote) | P, in stock. 68/54 mm. Pinout not described. |
| WS2812 ring 24 LED | CoThings | WS2812 5050 ANNEAU RGB 24 LED | 14.000 | [link](https://cothings.net/products/ws2812-5050-anneau-rgb-24-led-avec-pilote) | L |
| WS2812 ring 8/12/16/24 | Didactico | Carte ronde LED SMD RVB WS2812 | 8.500–21.000 by variant | [link](https://didactico.tn/produit/carte-rond-12-x-led-smd-rvb-5050/) | P. Per-variant price not shown. |
| FT232RL | Didactico | Module convertisseur USB to UART TTL 5V 3.3V FT232RL | 10.500 | [link](https://didactico.tn/produit/convertisseur-usb-uart-ft232rl/) | P, in stock. 3.3/5 V jumper, DTR. |
| FT232RL | Tuni Smart | Module Adaptateur FT232RL FTDI USB Vers TTL | 11.500 (was 13.500) | [link](https://tuni-smart-innovation.com/products/module-adaptateur-ft232rl-ftdi-usb-vers-ttl-compatible-avec-arduino) | L |
| CP2102 | Didactico | Module convertisseur série CP2102 (6 broches) | 11.900 | [link](https://didactico.tn/produit/convertisseur-cp2102/) | L |
| AMS1117-3.3 | Didactico | Module AMS1117 3,3 LDO 800mA DC5V-3,3V | 2.500 | [link](https://didactico.tn/produit/module-ams1117-3-3/) | P, in stock |
| LM2596 | Didactico | Module d'alimentation abaisseur LM2596S avec Led | 5.000 | [link](https://didactico.tn/produit/module-lm2596s/) | P. Adjustable 1.25–37 V. |
| MP1584EN | Didactico | Module réglable abaisseur MP1584EN | 4.500 | [link](https://didactico.tn/produit/module-abaisseur-mp1584en/) | L |
| 5 V 2 A adapter | Tuni Smart | Alimentation 5V/2A | 14.000 | [link](https://tuni-smart-innovation.com/products/alimentation-5v-2a) | P, in stock. Jack connector, 220 V input. |
| 5 V 2.4 A charger | Tunisianet | Chargeur secteur Modemcat MTC-005 2x USB avec câble Micro USB / 2.4A | 7.600 | [link](https://www.tunisianet.com.tn/chargeurs-et-cables-pour-telephones/57264-chargeur-secteur-modemcat-mtc-005-2x-usb-avec-cable-micro-usb-24a-blanc.html) | P, in stock |
| 5 V 2 A charger | Spacenet | Chargeur Secteur Adaptable 5V 2A Noir | 10.000 | [link](https://spacenet.tn/chargeur-pc-portable/87023-chargeur-secteur-adaptable-5v-2a-noir.html) | P. "En Arrivage", not in stock. |
| microSD 16 / 32 GB | Tuni Smart | carte mémoire sandisk 16GB / 32GB classe 10 | 19.500 / 23.500 | [32 GB](https://tuni-smart-innovation.com/products/carte-memoire-sandisk-32gb-classe-10) | L |
| microSD 32 GB | Tunisianet | Carte mémoire TeamGroup Micro SDHC 32 Go Class10 | 25.000 | [link](https://www.tunisianet.com.tn/carte-memoire-tunisie/39876-carte-memoire-teamgroup-micro-sdhc-32-go-class10.html) | L, in stock |
| microSD 32 GB | Didactico | Carte Memoire 32 GB Micro SD C10 Exceria | 30.000 | [link](https://didactico.tn/produit/carte-memoire-32-gb-micro-sd-c10-exceria/) | P, in stock |
| microSD 8 GB | None found | | n/a | n/a | Not found |
| 1000 µF capacitor | Tuni Smart | Condensateur Chimique 1000uF/25v (also 16 V) | 0.900 | [link](https://tuni-smart-innovation.com/search?q=condensateur+1000uf&type=product) | L |
| 1000 µF capacitor | Tuni Smart | Condensateur Chimique 1000uF/50V | 1.200 | [link](https://tuni-smart-innovation.com/products/condensateur-chimique-1000uf-50v) | L |
| 470/1000 µF capacitor | Didactico | Capacité chimique uF (variants include 470 and 1000) | 0.150–35.000 range | [link](https://didactico.tn/produit/capacite-chimique-uf/) | P. No per-variant price. |
| 74AHCT125 | None found | 0 results at Didactico, Tuni Smart and CoThings | n/a | [Didactico](https://didactico.tn/?s=ahct&post_type=product) | Not found |
| Level-shifter module | Didactico | Module Convertisseur de Niveau Logique 2 Canaux 3,3V – 5V TTL | 6.000 | [link](https://didactico.tn/produit/module-convertisseur-de-niveau-logique-2-canaux-33-v-5-v-ttl/) | P. Chip not stated. |
| TXS0108E module | CoThings | TXS0108E CONVERTISSEUR DE NIVEAU BIDIRECTIONNEL | 7.000 | [link](https://cothings.net/products/txs0108e-convertisseur-de-niveau-bidirectionnel-3-3v-5v) | L |
| Calibration masses | None found | | n/a | n/a | Not found at any Tunisian shop |
| 5 kg kitchen scale | Spacenet | Balance de Cuisine Digital 5Kg Blanc | 19.900 (was 69.000) | [link](https://spacenet.tn/balance-cuisine/100978-balance-de-cuisine-digital-5kg-blanc.html) | P. Out of stock at every store. 1 g step, battery. |

Shops that exist and answered: Didactico (Sfax), Tuni Smart Innovation, CoThings (Tunis), Souilah Électronique, Tunisianet, Spacenet. Shops that exist but blocked my fetcher: 2btrading (403) and Mytek (403). `tunisie-electronique.com` did not resolve. I did not find a Makerlab or SOS Composants site.

A mixed-shop core buy at verified prices comes to about 130 TND before delivery. That is DevKit 28.5, ESP32-CAM 33.5, MB base 9.5, HX711 7, 1 kg cell 8, OLED 18, 16-LED ring 11, 5 V adapter 14, capacitor 0.9 and two buttons about 1. A 32 GB microSD would add 23–30. This is my arithmetic, not a quoted total.

## 3. Substitutes and trade-offs

**Arduino Uno as USB-serial bridge for the ESP32-CAM**
- **Principle.** It works in principle. Tying RESET to GND holds the ATmega328P in reset, so the Uno's USB chip passes data through. Wiring is straight (Uno RX to target RX, TX to TX), the opposite of an FTDI adapter. The source is an ESP-01 guide, not an ESP32-CAM one. [Source](https://www.best-microcontroller-projects.com/esp-01-programming.html)
- **Level problem.** The Uno's line toward the target is 5 V. The ESP32-CAM's RX pin is not 5 V tolerant (a datasheet copy gives about -0.3 to 3.6 V). The same guide adds an external 2 kΩ to GND so the Uno's on-board 1 kΩ series resistor forms a divider. Your 5 V TX into 3.3 V RX concern is valid. Divide that one line only; the ESP32's 3.3 V TX into the Uno is usually read as high. [Datasheet copy](https://qoibkmtvaikabpjamxzs.supabase.co/storage/v1/object/public/datasheets/esp32-datasheet.pdf)
- **Power.** Feed the ESP32-CAM 5 V from the Uno's 5 V pin, not the 3.3 V pin. The module draws 180 mA with flash off and 310 mA with flash at maximum at 5 V. Weak power gives "Timed out waiting for packet header". [Components101](https://components101.com/modules/esp32-cam-camera-module)
- **Manual boot steps.** There is no auto-reset. You jumper GPIO0 to GND and press RST by hand, then remove the jumper and reset again. [Random Nerd Tutorials](https://randomnerdtutorials.com/esp32-cam-ai-thinker-pinout/)
- **Reliability.** The one forum thread I found failed with a timeout and was unresolved. A later poster there switched to the MB adapter after the Uno approach failed. [Arduino forum](https://forum.arduino.cc/t/problem-with-uploading-the-sketch-to-the-esp32-cam-using-arduino-uno/1012775)
- **Net.** The Uno route saves 9.5 TND (MB base) or 10.5 TND (FT232RL). Use it only as a fallback.

**Flash LED or white LEDs instead of the WS2812B ring and level shifter**
- **On-board LED.** The LED is wired to GPIO4 and costs nothing. [Random Nerd Tutorials](https://randomnerdtutorials.com/esp32-cam-ai-thinker-pinout/)
- **Shared pin with SD.** GPIO4 is also SD DATA1, so the LED lights during SD access in 4-bit mode. Initialising with `SD_MMC.begin("/sdcard", true)` (1-bit mode) stops that, though readers report a dim residual glow. Same source.
- **Light quality.** A single point source gives glare and no colour control. That is my judgement, not a sourced claim.
- **Plain white LEDs.** They need only the 2N2222 already in the BOM. My arithmetic for 6 LEDs: about 100 Ω each from 5 V (roughly 20 mA each), and a 1 kΩ base resistor from a 3.3 V GPIO.
- **Why the ring is awkward.** WS2812 data must reach 0.7 × VDD, about 3.5 V at 5 V, which a 3.3 V GPIO does not guarantee. [Adafruit](https://learn.adafruit.com/adafruit-neopixel-uberguide/powering-neopixels)
- **Shifter options.** Adafruit names the 74AHCT125 or 74HCT245, which no shop I searched stocks. [Adafruit](https://learn.adafruit.com/adafruit-neopixel-uberguide/best-practices)
- **Local shifter modules.** BSS138-type modules are reported too slow for the roughly 800 kHz data. [WLED thread](https://wled.discourse.group/t/do-not-use-bss138-for-logic-level-shifting-too-slow/6054)
- **Unverified workaround.** On a short wire, feeding the first pixel through a diode lowers its threshold. It often works but is not guaranteed. Same WLED thread and [macmyths](https://macmyths.com/cheating-at-5v-ws2812-control-to-use-3-3v-data/).
- **Recommended fixes.** Add 500–1000 µF and a 300–500 Ω data resistor in any case. [Adafruit](https://learn.adafruit.com/adafruit-neopixel-uberguide/best-practices)

**16x2 I2C LCD instead of the SSD1306 OLED**
- **Cost.** It is only 4.6 TND cheaper (13.4 vs 18.0 TND).
- **Supply.** The LCD needs 5 V. [Didactico](https://didactico.tn/produit/ecran-lcd-1602-i2c/)
- **Logic level.** The PCF8574 backpack's high threshold is 0.7 × VDD, so 3.5 V at 5 V. A 3.3 V ESP32 is out of spec, though often works.
- **Pull-ups.** Backpack pull-ups tied to 5 V must be removed. Otherwise add an I2C level shifter (4.5 TND at Didactico). [Arduino forum](https://forum.arduino.cc/t/3-3v-arduino-i2c-backpack-to-5v-lcd/411866), [Didactico](https://didactico.tn/produit/convertisseur-logique-iic-5v-3-3v/)
- **What you lose.** Graphics and icons, and you gain a 5 V rail dependency. The OLED runs at 3.3 V natively. [Didactico](https://didactico.tn/produit/ecran-oled-0-96-i2c/)
- **Verdict.** Not worth substituting.

**Phone charger or power bank as the 5 V supply**
- **Wall charger.** Preferred: Modemcat 5 V/2.4 A at 7.6 TND, or a 5 V/2 A jack adapter at 14 TND. SunFounder recommends at least 5 V/2 A for the ESP32-CAM, or you may get image artifacts. [SunFounder](https://docs.sunfounder.com/projects/zeus-car-dev/en/latest/hardware/cpn_esp_32_cam.html)
- **Power-bank cut-off.** Banks cut off at low draw. Three tested banks needed 100, 30 and 10 mA, with shutdown after 10–18 s. A 2 s pulse every 15 s kept one alive. [Zak Kemble](https://blog.zakkemble.net/smart-power-bank-keep-alive/)
- **Node A risk.** Node A may idle near these thresholds. That is my estimate, unmeasured.

**Calibration masses**
- **Lab sets.** Even the loosest OIML class is far better than needed. Limits at 100 / 200 / 500 g: F1 ±0.5 / 1.0 / 2.5 mg; M1 ±5 / 10 / 25 mg; M2 ±16 / 30 / 80 mg. [OIML R111 table, HK ITC](https://www.itc.gov.hk/en/quality/scl/met_user/mass/m1.html)
- **School slotted masses.** These can be ±1 %, which is ±5 g at 500 g, about your error budget. Weigh them on a lab balance first. [Eisco](https://www.eiscolabs.com/products/ph0037fss)
- **Supplier.** The only Tunisian supplier lead is TechnoLab (Mettler-Toledo distributor, Tunis), with no price. [mt.com/tn](https://www.mt.com/tn/fr/home.html)

Official coin masses (BCT figures via press; no tolerance published that I could find):

| Coin | Mass | Source |
|---|---|---|
| 1 dinar (2020) | 9.5 g | [Managers](https://managers.tn/2020/08/26/la-banque-centrale-met-en-circulation-deux-nouvelles-pieces-de-1-dt-et-de-200-millimes/) |
| 5 dinars (2021) | 9.2 g | [Managers](https://managers.tn/2022/04/07/la-banque-centrale-injecte-de-nouvelles-pieces-de-monnaie-sur-le-marche/) |
| 1/2 dinar (2021) | 7.5 g | [Managers](https://managers.tn/2022/04/07/la-banque-centrale-injecte-de-nouvelles-pieces-de-monnaie-sur-le-marche/) |
| 2 dinars (2023, issued July 2024) | 7.3 g | [ilBoursa](https://www.ilboursa.com/marches/la-bct-met-en-circulation-trois-nouvelles-pieces-de-monnaie_47129) |
| 100 millimes (2023, issued July 2024) | 9.7 g | [ilBoursa](https://www.ilboursa.com/marches/la-bct-met-en-circulation-trois-nouvelles-pieces-de-monnaie_47129) |
| 2 dinars (2013) | 11.2 g | [Babnet](https://www.babnet.net/cadredetail-77001.asp) |
| 200 millimes (2013) | 9.4 g | [Babnet](https://www.babnet.net/cadredetail-77001.asp) |

- **Reliability.** Poor as a standard, acceptable only as a transfer reference. The 2 dinar coin weighs 11.2 g (2013) or 7.3 g (2024), and the BCT says old and new coins circulate together. Réalités instead says the old one was 8 g, so sources conflict. [Réalités](https://realites.com.tn/fr/bct-decouvrez-les-nouvelles-pieces-de-monnaie/)
- **Wear and mixed issues.** Wear and mixed issue years add more error. A catalogue lists the 1996–2013 1 dinar at 10 g against 9.5 g for 2020, which is 5 %. [uCoin](https://en.ucoin.net/catalog/?country=tunisia)
- **How to use coins.** Weigh the stack on a lab balance first and use that value.

**Kitchen-scale teardown as a load-cell source**
- **Likely cell type.** Shops sell YZC-133 and YZC-131 cells as the 4-wire full-bridge type "for kitchen scales". [CoThings](https://cothings.net/products/capteur-de-cellule-de-charge-de-pesee-10-kg-pour-balance-de-cuisine-electronique-yzc-133-avec-fils), [Didactico](https://didactico.tn/produit/capteur-de-pesage-3kg-yzc-131/)
- **Capacity.** A 5 kg scale probably holds a cell rated 5 kg or more. By my arithmetic, sensitivity per gram is at least 5 times lower than a 1 kg cell. That is unverified for any specific scale.
- **3-wire cells.** A 3-wire cell is a half-bridge. The manual's fix is two 1 kΩ resistors across E+ and E-, with 0.1 % tolerance preferred. [shillehtek](https://shillehtek.com/blogs/shillehtek-product-manuals/load-cell-50kg-half-bridge-strain-sensor-manual)
- **Supply for HX711.** Power the HX711 from 3.3 V on an ESP32, because at 5 V its DT pin outputs 5 V. Same source.
- **50 kg sensor.** A 1 kg load is 2 % of its range, about 50 times less signal per gram than a 1 kg cell (my arithmetic, assuming similar mV/V).
- **Verdict.** A teardown saves 8 TND and adds risk. Buy the 1 kg bar cell.

## 4. Things I could not verify

- **Faculty inventories.** No Tunisian faculty, ISET, ENIT, INSAT, ENSI, FST or Sup'Com lab inventory, TP handout or kit list was found. "Lab staple" is inferred from kits and from vendor marketing, which lists customers but is not an inventory. [Didactico partners](https://didactico.tn/partenaires-education/)
- **Blocked or dead shops.** 2btrading and Mytek returned 403 to my fetcher, so 2btrading prices are snippet-only. Jumia's product link redirected to the homepage. `tunisie-electronique.com` failed DNS. The Electronic Shop domain also failed. I found no Makerlab or SOS Composants site.
- **Missing parts.** 74AHCT125, 74HCT245, a load cell + HX711 kit, 8 GB microSD, calibration masses and a 470 µF cap price were not found. Search coverage is Didactico, Tuni Smart and CoThings (page 1 only for the kit).
- **Variant prices.** Didactico's per-variant prices for the YZC cell (9.4–15), the WS2812 ring (8.5–21) and electrolytic caps are not visible on the pages. The Didactico ESP32-CAM-CH340 combo does not confirm an MB base.
- **Page inconsistencies.** Several product pages contradict themselves. These include the ESPCAM power text, the "12 bits" ring text and the placeholder text on the Tuni Smart 1 kg page.
- **Coins.** I read press reports of BCT communiqués, not the communiqués or Numista pages (403). BCT tolerances were not found. The old 2 dinar weight conflicts (11.2 g vs 8 g), and 100 millimes conflicts (7.5 g in one catalogue summary vs 9.7 g BCT-reported).
- **Uno bridge.** I found no confirmed successful ESP32-CAM flash via an Uno, and the wiring evidence comes from an ESP-01 guide. The Uno's 3.3 V pin current limit is from my own knowledge. Whether a CH340-based Uno clone behaves the same is unverified.
- **Starter-kit lists.** The Elegoo list comes from third-party sources, partly truncated.
- **SD size.** Components101 says the ESP32-CAM supports cards up to 4 GB; 16–32 GB cards are commonly used, and I did not test either.
- **Regulators.** I did not source that the DevKit V1 and ESP32-CAM have onboard 3.3 V regulators; the ESP32-CAM 5 V-pin guidance is from Random Nerd Tutorials.
- **Not checked.** Power-bank behaviour with your actual load, stock after 2026-10-12, and whether prices include VAT (only some shops say TTC).

## 5. Findings most likely to change the request

1. **Everything project-specific is cheap and in stock locally.** The core buy is about 130 TND, so the request can be small and specific. Didactico and Tuni Smart together cover almost every line.
2. **Drop the buck converter (item 16) and probably the microSD (item 17).** The ESP32-CAM takes 5 V on its 5 V pin and the DevKit takes 5 V via USB or VIN, so a 3.3 V buck is redundant (board design knowledge; regulators not sourced). Use the DevKit's 3.3 V pin for the HX711 and OLED. The ESP32-CAM uploads over Wi-Fi, so the SD is optional.
3. **Replace the FTDI line (item 3) with the 9.5 TND ESP32-CAM-MB base.** It is cheaper than the FT232RL (10.5 TND) and has a BOOT button. The Uno bridge is a fallback with real gotchas.
4. **The 74AHCT125 is the one truly unobtainable part locally.** Pick one: import it; use the 3.3 V-data plus diode and resistor workaround; or replace the ring with white LEDs on the 2N2222 already in the BOM. BSS138 modules (6 TND) are the wrong fix.
5. **Ring availability.** A 16-LED ring is 11 TND at CoThings, but its pinout is undocumented on the page. Confirm before ordering.
6. **Calibration masses cannot be bought locally.** Request access to a physics or chemistry lab balance and masses instead. Treat coins as a transfer reference only, after weighing them.
7. **Load cell.** Buy the 1 kg bar at 8 TND and an HX711 at 7 TND; no kit exists locally. The 5 kg cell (10 TND) is a lower-sensitivity fallback. Skip the teardown and the 50 kg sensor.
8. **Ask the faculty first.** Likely on hand: Uno, breadboards, buttons, LEDs, buzzers, resistors, 2N2222, bench PSU, multimeter, soldering station, calibration weights, FabLab printers. Buy: ESP32-CAM, MB base, HX711 + bar cell, ring or LEDs, OLED, adapter.
