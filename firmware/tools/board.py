"""Talk to a board on USB from the laptop: find it, flash it, read it, test it.

So the owner only plugs boards in and wires them; the rest runs from here.

    firmware/.venv/Scripts/python firmware/tools/board.py ports
    firmware/.venv/Scripts/python firmware/tools/board.py flash node-a-nodemcu-sim
    firmware/.venv/Scripts/python firmware/tools/board.py listen --seconds 8 --reset
    firmware/.venv/Scripts/python firmware/tools/board.py send "sim 150" --expect "E sim"
    firmware/.venv/Scripts/python firmware/tools/board.py meal-test --no-camera
    firmware/.venv/Scripts/python firmware/tools/board.py counts --grams 200

The port is found by itself when exactly one USB serial board is plugged in
(CH340 or CP210x); otherwise pass --port COM5. Only one program can hold a port:
close the bench page in the browser first.

The Wi-Fi password is never sent from here: the owner types it once on the bench
page, so it never passes through a log or a chat.
"""

from __future__ import annotations

import argparse
import subprocess
import sys
import time
from pathlib import Path

import serial
from serial.tools import list_ports

FIRMWARE = Path(__file__).resolve().parents[1]
BAUD = 115200

# USB chips on our boards: the NodeMCU's CH340, and the ESP32-CAM-MB's CH340 or a CP210x.
KNOWN = {(0x1A86, 0x7523): 'CH340', (0x1A86, 0x55D4): 'CH9102', (0x10C4, 0xEA60): 'CP210x'}

# PlatformIO environments, and the project folder each lives in.
ENVS = {
    'node-a-nodemcu': 'node-a-scale',
    'node-a-nodemcu-sim': 'node-a-scale',
    'node-a-scale': 'node-a-scale',
    'node-a-sim': 'node-a-scale',
    'node-b-camera': 'node-b-camera',
}


def usb_ports():
    return [port for port in list_ports.comports() if port.vid is not None]


def chip(port) -> str:
    return KNOWN.get((port.vid, port.pid), f'{port.vid:04X}:{port.pid:04X}')


def pick_port(asked: str | None) -> str:
    if asked:
        return asked
    ports = usb_ports()
    if len(ports) == 1:
        return ports[0].device
    if not ports:
        sys.exit('No USB board found. Plug it in with a data cable; if it still does not appear, the cable may only charge.')
    names = ', '.join(f'{p.device} ({chip(p)})' for p in ports)
    sys.exit(f'More than one USB board: {names}. Say which with --port.')


def open_port(device: str, reset: bool) -> serial.Serial:
    """Opened without pulsing the reset lines, unless asked: on the camera's base
    those lines also choose flashing mode."""
    link = serial.Serial()
    link.port = device
    link.baudrate = BAUD
    link.timeout = 0.2
    link.dtr = False
    link.rts = False
    try:
        link.open()
    except serial.SerialException as error:
        sys.exit(f'Cannot open {device}: {error}. Is the bench page (or a serial monitor) using it? Close it first.')
    if reset:
        # EN low, then high: the board restarts and prints its boot line.
        link.rts = True
        time.sleep(0.1)
        link.rts = False
    return link


def read_lines(link: serial.Serial, seconds: float, until: str | None = None):
    """Lines the board prints, until `seconds` pass or a line starts with `until`."""
    end = time.monotonic() + seconds
    buffer = b''
    while time.monotonic() < end:
        buffer += link.read(256)
        while b'\n' in buffer:
            raw, buffer = buffer.split(b'\n', 1)
            line = raw.decode('utf-8', 'replace').strip()
            if not line:
                continue
            yield line
            if until and line.startswith(until):
                return


def send(link: serial.Serial, command: str):
    if command.strip().lower().startswith('pass'):
        sys.exit('The Wi-Fi password is typed by you on the bench page, not sent from here.')
    link.write((command + '\n').encode())


def cmd_ports(_args):
    ports = usb_ports()
    if not ports:
        print('No USB board plugged in.')
    for port in ports:
        print(f'{port.device}\t{chip(port)}\t{port.description}')


def cmd_flash(args):
    if args.env not in ENVS:
        sys.exit(f'Unknown build {args.env!r}. One of: {", ".join(ENVS)}')
    port = pick_port(args.port)
    pio = Path(sys.executable).with_name('pio.exe' if sys.platform == 'win32' else 'pio')
    print(f'Flashing {args.env} to {port}…', flush=True)
    result = subprocess.run([str(pio), 'run', '-e', args.env, '-t', 'upload', '--upload-port', port], cwd=FIRMWARE / ENVS[args.env])
    if result.returncode:
        sys.exit('Flashing failed. On the NodeMCU: hold FLASH, press RST, let go of FLASH, then run this again.')
    print('Flashed.')


def cmd_listen(args):
    link = open_port(pick_port(args.port), args.reset)
    for line in read_lines(link, args.seconds):
        print(line, flush=True)


def cmd_send(args):
    link = open_port(pick_port(args.port), False)
    time.sleep(0.2)
    link.reset_input_buffer()
    send(link, args.command)
    seen = False
    for line in read_lines(link, args.timeout, args.expect):
        if line.startswith('R ') and not args.readings:
            continue
        print(line, flush=True)
        if args.expect and line.startswith(args.expect):
            seen = True
    if args.expect and not seen:
        sys.exit(f'No line starting with {args.expect!r} within {args.timeout} s.')


def expect(link, command, prefix, seconds):
    send(link, command)
    for line in read_lines(link, seconds, prefix):
        if line.startswith(prefix):
            return line
    return None


def field(line: str, key: str) -> str | None:
    for word in line.split():
        if word.startswith(key + '='):
            return word.split('=', 1)[1]
    return None


def cmd_meal_test(args):
    """The bench page's whole-meal test, from the laptop: plate, tare, food, photo."""
    link = open_port(pick_port(args.port), False)
    time.sleep(0.3)
    link.reset_input_buffer()
    steps = []

    def report(name, ok, note=''):
        steps.append(ok)
        print(f'{"PASS" if ok else "FAIL"}  {name}{"  · " + note if note else ""}', flush=True)
        return ok

    info = expect(link, 'info', 'E info node=a', 3)
    if not report('the scale answers', bool(info), info or 'no answer to info: is the pretend scale flashed?'):
        sys.exit(1)
    if not report('it is calibrated', field(info, 'calibrated') == '1', f'cpg={field(info, "cpg")}'):
        sys.exit(1)
    send(link, f'sim {args.plate}')
    time.sleep(2.5)  # the pretend plate wobbles for about 1.5 s, like a real one
    tare = expect(link, 'tare', 'E tare', 6)
    if not report(f'plate {args.plate} g, tare', bool(tare), tare or ''):
        sys.exit(1)
    send(link, f'sim {args.plate + args.food}')
    settled = None
    for line in read_lines(link, 8):
        if line.startswith('R ') and field(line, 'stable') == '1':
            grams = float(field(line, 'g') or 'nan')
            if abs(grams - args.food) <= 1:
                settled = grams
                break
    if not report(f'food on, reads {args.food} g', settled is not None, f'{settled} g' if settled is not None else 'never settled'):
        sys.exit(1)
    send(link, 'capture')
    captured = sent = result = None
    for line in read_lines(link, 60):
        if line.startswith('E capture') or line.startswith('E error'):
            captured = line
        if line.startswith('E sent'):
            sent = line
            if field(line, 'ok') != '1':
                break
        if line.startswith('E result'):
            result = line
            break
    report('photo: twelve readings, one weight', bool(captured) and captured.startswith('E capture'), captured or 'no answer')
    if args.no_camera:
        # Before the camera is built, the right answer is NO CAMERA: ok=0.
        report('no camera yet, so NO CAMERA', bool(sent) and field(sent, 'ok') == '0', sent or 'no answer')
        sys.exit(0 if all(steps) else 1)
    report('the camera confirms', bool(sent) and field(sent, 'ok') == '1', sent or 'no answer')
    report('the backend saves it', bool(result) and field(result, 'outcome') in ('saved', 'unknown'), result or 'no result')
    sys.exit(0 if all(steps) else 1)


def cmd_counts(args):
    """Calibration, one mass at a time: the median net count over the last half of the window.
    With --grams, also the counts per gram it implies; `send "cal <that>"` saves it."""
    link = open_port(pick_port(args.port), False)
    # The board only marks readings steady once calibrated, so judge steadiness
    # here: the second half of the window, and how far it spreads.
    nets = []
    for line in read_lines(link, args.seconds):
        if line.startswith('R '):
            nets.append(int(field(line, 'net') or 0))
    if not nets:
        sys.exit('No readings. Is the scale image running?')
    nets = sorted(nets[len(nets) // 2:])
    net = nets[len(nets) // 2]
    print(f'net={net} spread={nets[-1] - nets[0]} from {len(nets)} readings')
    if args.grams:
        print(f'cpg={net / args.grams:.6f} for {args.grams} g')


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest='what', required=True)
    sub.add_parser('ports').set_defaults(run=cmd_ports)
    flash = sub.add_parser('flash')
    flash.add_argument('env')
    flash.add_argument('--port')
    flash.set_defaults(run=cmd_flash)
    listen = sub.add_parser('listen')
    listen.add_argument('--port')
    listen.add_argument('--seconds', type=float, default=8)
    listen.add_argument('--reset', action='store_true', help='restart the board first, to see its boot line')
    listen.set_defaults(run=cmd_listen)
    send_ = sub.add_parser('send')
    send_.add_argument('command')
    send_.add_argument('--port')
    send_.add_argument('--expect', help='stop at the first line starting with this')
    send_.add_argument('--timeout', type=float, default=5)
    send_.add_argument('--readings', action='store_true', help='also print the R lines')
    send_.set_defaults(run=cmd_send)
    meal = sub.add_parser('meal-test')
    meal.add_argument('--port')
    meal.add_argument('--plate', type=float, default=420)
    meal.add_argument('--food', type=float, default=150)
    meal.add_argument('--no-camera', action='store_true', help='before the camera is built: expect NO CAMERA')
    meal.set_defaults(run=cmd_meal_test)
    counts = sub.add_parser('counts')
    counts.add_argument('--port')
    counts.add_argument('--seconds', type=float, default=4)
    counts.add_argument('--grams', type=float, help='the known mass on the plate')
    counts.set_defaults(run=cmd_counts)
    args = parser.parse_args()
    args.run(args)


if __name__ == '__main__':
    main()
