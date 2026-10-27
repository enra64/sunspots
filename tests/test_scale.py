"""50 spots: startup cost, memory, tick cost and network behaviour."""

import os
import resource
from datetime import timedelta

from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import async_fire_time_changed

from .conftest import LAT, LON, make_entry, spot_data
from .test_setup import SHADED_NOON, setup

SPOTS = 50


def fifty_spots():
    return [
        spot_data(
            lat=LAT + (i % 10) * 0.00045 - 0.002,
            lon=LON + (i // 10) * 0.0007 - 0.0014,
            title=f"Spot {i}",
        )
        for i in range(SPOTS)
    ]


async def test_fifty_spots_start_fast_share_one_download_and_stay_small(
    hass: HomeAssistant, fake_fetcher, freezer, hass_storage
):
    freezer.move_to(SHADED_NOON)
    rss_before = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
    entry = make_entry(subentries=fifty_spots())
    t0 = os.times().elapsed
    await setup(hass, entry)
    cold = os.times().elapsed - t0
    # ru_maxrss is bytes on macOS and kilobytes on Linux
    divisor = 1e6 if os.uname().sysname == "Darwin" else 1e3
    peak_mb = (resource.getrusage(resource.RUSAGE_SELF).ru_maxrss - rss_before) / divisor

    states = hass.states.async_all("binary_sensor")
    assert len(states) == SPOTS and all(s.state in ("on", "off") for s in states)
    tiles = [r for r in fake_fetcher.requests if "pmtiles" in r[0] and (r[2] or 0) > 10_000]
    assert (
        len(tiles) == 1 and len(fake_fetcher.requests) <= 6
    )  # STAC + header + directory + one tile

    # warm start from stores: nothing is fetched and no horizon is recomputed
    await hass.config_entries.async_unload(entry.entry_id)
    fake_fetcher.requests.clear()
    t1 = os.times().elapsed
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done(wait_background_tasks=True)
    warm = os.times().elapsed - t1
    assert fake_fetcher.requests == []

    # one minute tick for all spots
    freezer.move_to(SHADED_NOON + timedelta(minutes=1))
    t2 = os.times().elapsed
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    tick = os.times().elapsed - t2

    store_kb = sum(len(str(v)) for k, v in hass_storage.items() if ".spot." in k) / 1e3
    print(
        f"\nSCALE spots={SPOTS} cold_setup={cold:.2f}s warm_setup={warm:.2f}s tick={tick:.3f}s "
        f"extra_peak_rss={peak_mb:.0f}MB spot_stores={store_kb:.0f}kB"
    )
    assert cold < 60 and warm < 30 and tick < 5 and peak_mb < 400
