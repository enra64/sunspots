# Privacy

Sunspots has no server and no telemetry. Everything is computed and stored inside your Home Assistant.

| What | Who sees what |
|---|---|
| Overture Maps tiles (default) | Requests go to Overture's public storage (`overturemaps-extras-us-west-2.s3.us-west-2.amazonaws.com`) and to `stac.overturemaps.org` (to find the newest release). The storage host sees **tile coordinates at zoom level 14** (roughly a 1.5 km square) and your IP address, not your exact spot. |
| Overpass (only if you enable *Allow Overpass*) | `overpass-api.de` receives the **exact coordinates** of the spot and the search radius, and your IP address. Off by default; it is used only as the chosen source or as a fallback when Overture tiles fail. |
| Weather entity | Read locally from your Home Assistant. Nothing is sent. |
| Diagnostics | Contain counters, versions, release id and timings. Coordinates, names and building geometry are left out. |

Requests are rate-limited (at most one per second per host, with an hourly cap) and carry the
user agent `Sunspots/<version> (+https://github.com/enra64/sunspots)`.

Data © OpenStreetMap contributors, Overture Maps Foundation (ODbL).
