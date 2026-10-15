# Storm-Maps

Interactive storm lead map for Armour Roof Co., published with GitHub Pages.

The live map is [https://armourroofco.github.io/Storm-Maps/](https://armourroofco.github.io/Storm-Maps/). `index.html` is a self-contained Folium map (Leaflet and tiles load from CDNs) centered on the Omaha area. Green pins have contact info, orange pins don't. It has street and satellite views, clustering, search by owner or address, storm-type layers, MRMS MESH 2in+ hail swaths, and SPC report-based wind outlines.

`storm_leads_map.kml` is the same lead set for Google Earth and other KML clients. `.nojekyll` keeps GitHub Pages from processing the site with Jekyll.

## Marking a lead as called

1. Open a pin and click **Mark as called**. Enter your name and optional notes.
2. A prefilled GitHub issue opens (title `CALLED: <lead_id>`). Click **Submit new issue**. You must be signed in to GitHub with access to this repo.
3. The pin turns gray right away in your own browser (pending). The `call-status` GitHub Action records the call in `called.json`, comments on the issue, and closes it. After about 1-2 minutes (Actions plus Pages deploy), the pin turns gray for everyone, and its popup shows "Called by X on date". The counter at the top shows "N called".
4. To undo, open the pin and click **Undo called**. This opens an `UNCALLED: <lead_id>` issue.

How it works:
- `lead_id` is `"L"` plus the first 10 hex characters of the SHA-1 of `"<lat rounded to 5 dp>,<lon rounded to 5 dp>|<SITE ADDRESS uppercased>"`.
- `callstatus.js` loads `called.json`, with a cache-buster, on page open and every 60 seconds after that.
- `scripts/update_called.py` applies each issue to `called.json`.

Limits:
- Only issues from the repo owner, org members, or collaborators are applied. Anyone else's issues are ignored.
- Expect about 1-2 minutes before everyone sees an update.
- Pending status is stored only in the clicker's own browser. If the issue isn't submitted, that browser keeps showing the pending status, but `called.json` never changes.
- A `lead_id` changes only if a building's coordinates or address change.
- `called.json` is separate from the map. Daily rebuilds replace `index.html` and the KML but must not overwrite `called.json`, so called status persists across rebuilds.
- No tokens or secrets are stored in the page.
