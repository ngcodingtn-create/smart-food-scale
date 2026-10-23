"""Build both nodes and put flashable copies on the site, for the "Flash it" page.

    firmware/.venv/Scripts/python firmware/tools/publish_web.py     (Windows)
    firmware/.venv/bin/python firmware/tools/publish_web.py         (elsewhere)

Runs PlatformIO for each build, then joins the four pieces it would write to
the board (bootloader, partition table, boot selector, the app) into one image
starting at address 0, which is what the browser installer (ESP Web Tools)
writes. The addresses are the ones PlatformIO's own upload uses for these
boards: 0x1000, 0x8000, 0xe000 and 0x10000, DIO at 40 MHz, 4 MB of flash.

Writes, under web/public/workbench/firmware/:
    node-a/scale.bin, scale.json    Node A, the real build
    node-a/sim.bin,   sim.json      Node A with a pretend load cell (`sim <grams>`)
    node-b/camera.bin, camera.json  Node B. Wi-Fi and backend are set afterwards,
                                    over the serial line, so one image fits everyone.

The images are committed, because the site is deployed from web/ alone.
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
FIRMWARE = REPO / "firmware"
OUT = REPO / "web" / "public" / "workbench" / "firmware"
PACKAGES = Path.home() / ".platformio" / "packages"
ESPTOOL = PACKAGES / "tool-esptoolpy" / "esptool.py"
BOOT_APP0 = PACKAGES / "framework-arduinoespressif32" / "tools" / "partitions" / "boot_app0.bin"

# (project folder, PlatformIO environment, site folder, file name, title)
BUILDS = [
    ("node-a-scale", "node-a-scale", "node-a", "scale", "Node A, the scale"),
    ("node-a-scale", "node-a-sim", "node-a", "sim", "Node A, with a pretend load cell"),
    ("node-b-camera", "node-b-camera", "node-b", "camera", "Node B, the camera"),
]


def version(project: Path) -> str:
    config = (project / "include" / "config.h").read_text(encoding="utf-8")
    match = re.search(r'#define SFS_FIRMWARE_VERSION "([^"]+)"', config)
    if not match:
        sys.exit(f"No SFS_FIRMWARE_VERSION in {project.name}/include/config.h")
    return match.group(1)


def main() -> None:
    pio = Path(sys.executable).with_name("pio.exe" if sys.platform == "win32" else "pio")

    for folder, env, site, name, title in BUILDS:
        project = FIRMWARE / folder
        if folder == "node-b-camera" and (project / "include" / "secrets.h").exists():
            # Whatever is in secrets.h would be published inside the image.
            sys.exit("firmware/node-b-camera/include/secrets.h exists: move it aside before publishing.")
        subprocess.run([str(pio), "run", "-e", env], cwd=project, check=True)
        build = project / ".pio" / "build" / env
        out = OUT / site
        out.mkdir(parents=True, exist_ok=True)
        image = out / f"{name}.bin"
        subprocess.run(
            [
                sys.executable, str(ESPTOOL), "--chip", "esp32", "merge_bin",
                "-o", str(image),
                "--flash_mode", "dio", "--flash_freq", "40m", "--flash_size", "4MB",
                "0x1000", str(build / "bootloader.bin"),
                "0x8000", str(build / "partitions.bin"),
                "0xe000", str(BOOT_APP0),
                "0x10000", str(build / "firmware.bin"),
            ],
            check=True,
        )
        release = version(project)
        manifest = {
            "name": f"Smart Food Scale: {title}",
            "version": release,
            "new_install_prompt_erase": True,
            "builds": [{"chipFamily": "ESP32", "parts": [{"path": f"{name}.bin", "offset": 0}]}],
        }
        (out / f"{name}.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
        print(f"{image.relative_to(REPO)}: {image.stat().st_size} bytes, version {release}")


if __name__ == "__main__":
    main()
