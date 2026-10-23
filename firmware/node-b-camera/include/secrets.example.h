// Optional defaults, compiled in. Copy to secrets.h (git ignores that name) and
// fill in, or leave it out entirely and set everything over the serial line:
//
//   ssid <the hotspot's name>
//   pass <its password>
//   backend http://192.168.43.10:8000
//
// What is set over the serial line is saved on the board and wins over these.

#pragma once

#define SFS_WIFI_SSID ""
#define SFS_WIFI_PASSWORD ""
#define SFS_BACKEND_URL ""

// Only for a backend on https. The PEM text of the root certificate that signs
// the host's certificate, so the board can check it is talking to the real
// host. Without it, Node B refuses https rather than send photos unchecked.
// #define SFS_BACKEND_ROOT_CA "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----\n"
