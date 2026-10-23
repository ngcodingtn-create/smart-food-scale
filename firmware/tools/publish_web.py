"""Build both nodes and put flashable copies on the site, for the "Flash it" page.

    firmware/.venv/Scripts/python firmware/tools/publish_web.py     (Windows)
    firmware/.venv/bin/python firmware/tools/publish_web.py         (elsewhere)

Runs PlatformIO for each build and writes one image per chip, starting at
address 0, which is what the browser installer (ESP Web Tools) writes.

- ESP32: the four pieces PlatformIO would write (bootloader, partition table,
  boot selector, the app) joined into one, at the addresses its own upload uses
  for these boards: 0x1000, 0x8000, 0xe000 and 0x10000, DIO at 40 MHz, 4 MB.
- ESP8266: PlatformIO's firmware.bin as it is. The Arduino core puts its
  bootloader inside it, and its own upload writes it at 0.

Each manifest lists every chip it has an image for; the installer asks the board
which chip it is and writes the matching one. Node A has two: the ESP8266
NodeMCU in hand, and the ESP32 DevKit on the original request.

Writes, under web/public/workbench/firmware/:
    node-a/scale.json, scale-esp8266.bin, scale-esp32.bin   Node A, the real build
    node-a/sim.json,   sim-esp8266.bin,   sim-esp32.bin     Node A with a pretend load cell (`sim <grams>`)
    node-b/camera.json, camera-esp32.bin                    Node B. Wi-Fi and backend are set afterwards,
                                                            over the serial line, so one image fits everyone.

The images are committed, because the site is deployed from web/ alone.
"""

from __future__ import annotations

import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
FIRMWARE = REPO / "firmware"
OUT = REPO / "web" / "public" / "workbench" / "firmware"
PACKAGES = Path.home() / ".platformio" / "packages"
ESPTOOL = PACKAGES / "tool-esptoolpy" / "esptool.py"
BOOT_APP0 = PACKAGES / "framework-arduinoespressif32" / "tools" / "partitions" / "boot_app0.bin"

# (project folder, site folder, file name, title, [(PlatformIO environment, chip)])
BUILDS = [
    ("node-a-scale", "node-a", "scale", "Node A, the scale", [("node-a-nodemcu", "ESP8266"), ("node-a-scale", "ESP32")]),
    ("node-a-scale", "node-a", "sim", "Node A, with a pretend load cell", [("node-a-nodemcu-sim", "ESP8266"), ("node-a-sim", "ESP32")]),
    ("node-b-camera", "node-b", "camera", "Node B, the camera", [("node-b-camera", "ESP32")]),
]


def version(project: Path) -> str:
    config = (project / "include" / "config.h").read_text(encoding="utf-8")
    match = re.search(r'#define SFS_FIRMWARE_VERSION "([^"]+)"', config)
    if not match:
        sys.exit(f"No SFS_FIRMWARE_VERSION in {project.name}/include/config.h")
    return match.group(1)


def image(build: Path, chip: str, target: Path) -> None:
    if chip == "ESP8266":
        shutil.copyfile(build / "firmware.bin", target)
        return
    subprocess.run(
        [
            sys.executable, str(ESPTOOL), "--chip", "esp32", "merge_bin",
            "-o", str(target),
            "--flash_mode", "dio", "--flash_freq", "40m", "--flash_size", "4MB",
            "0x1000", str(build / "bootloader.bin"),
            "0x8000", str(build / "partitions.bin"),
            "0xe000", str(BOOT_APP0),
            "0x10000", str(build / "firmware.bin"),
        ],
        check=True,
    )


def main() -> None:
    pio = Path(sys.executable).with_name("pio.exe" if sys.platform == "win32" else "pio")

    for folder, site, name, title, chips in BUILDS:
        project = FIRMWARE / folder
        if folder == "node-b-camera" and (project / "include" / "secrets.h").exists():
            # Whatever is in secrets.h would be published inside the image.
            sys.exit("firmware/node-b-camera/include/secrets.h exists: move it aside before publishing.")
        out = OUT / site
        out.mkdir(parents=True, exist_ok=True)
        builds = []
        for env, chip in chips:
            subprocess.run([str(pio), "run", "-e", env], cwd=project, check=True)
            target = out / f"{name}-{chip.lower()}.bin"
            image(project / ".pio" / "build" / env, chip, target)
            builds.append({"chipFamily": chip, "parts": [{"path": target.name, "offset": 0}]})
            print(f"{target.relative_to(REPO)}: {target.stat().st_size} bytes")
        release = version(project)
        manifest = {
            "name": f"Smart Food Scale: {title}",
            "version": release,
            "new_install_prompt_erase": True,
            "builds": builds,
        }
        (out / f"{name}.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
        print(f"{site}/{name}.json: version {release}, {', '.join(chip for _, chip in chips)}")


if __name__ == "__main__":
    main()
