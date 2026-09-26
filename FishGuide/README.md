# Fintastic Fish and Where to Find Them

A guide to finding fish around the Isles of Shoals, by Marshall Mumford and Mike Sigler (Shoals Marine Laboratory, 2025), converted from the original slide deck into a static website.

## Publish on GitHub Pages

1. Create a new repository on GitHub (for example `isles-of-shoals-fish`).
2. Upload everything in this folder to the root of the repository (keep the `images/` folder and the `.nojekyll` file).
3. In the repository, go to **Settings → Pages**, set **Source** to "Deploy from a branch", pick `main` and `/ (root)`, and save.
4. After a minute the site is live at `https://<your-username>.github.io/<repository-name>/`.

## Files

- `index.html` – home page with the species index and map key
- one `.html` page per species or topic, linked in order with Previous / Next
- `style.css` – all styling
- `map.html` – the combined sightings map (filters by area, species and method)
- `script.js` – photo viewer and the clickable markers on species-page maps
- `points.json` – every map point (edit with `editor.html`)
- `editor.html` – the point editor
- `bigmap.js` – the sightings map; `map-data.js` – survey sites and tide pools shown for reference
- `vendor/leaflet/` – the Leaflet map library (bundled, so nothing loads from outside)
- `images/` – photos, illustrations and maps taken from the original deck

## Editing

Each page is plain HTML. To add an observation, open the species page and add a `<p>` inside the `Field observations` block; to add a map or photo, drop the image in `images/` and copy an existing `<figure>`.

## Updating the map points

Every marker on the site (the species-page maps and the sightings map) comes from one file: **`points.json`**.

1. Open **`editor.html`** (linked in the site footer).
2. Drag points to move them, press **Add point** and click the map to create one, and pick the type and species in the right-hand panel. Coordinates are recorded automatically. Your edits are saved in your browser as you go, and **Undo** (Ctrl+Z) steps back.
3. Press **Export → points.json**, then replace `points.json` in the repository with the new file (upload it on GitHub, or commit it). Every map on the site updates.

Also useful:
- **Survey sites** (white squares in the editor) have exact GPS coordinates. Click one and choose "Create a point here" to add a sighting exactly on it.
- Points with surveyed GPS positions are **locked** so they can't be moved by accident; use "Unlock to move" if you really mean to.
- A **new species** can be added from the editor. It will show on the sightings map; it only gets its own page if one is added to the site.
- **Export → sightings.csv** gives a spreadsheet version, and **Import** accepts either file.

Previewing the site from your own computer: the maps read `points.json`, which browsers only allow over a web server. Run `python3 -m http.server` in the site folder and open http://localhost:8000. On GitHub Pages this just works.

## Where the map coordinates come from

- **RUVS video sites** use the surveyed GPS coordinates (sites 1A–7B, plus Malaga and Star read off the labeled site map).
- **Trap/seine, rod and reel, and bait-fishing spots** were positioned by georeferencing the guide's maps: the Appledore map against the GPS-referenced site map (checked two independent ways, within ~8 m), the Smuttynose/Star map by matching it to the Appledore map, the New Castle map from Portsmouth Harbor Light, Whaleback Light and Fort Stark (all within ~9 m), and the offshore maps (tilted satellite screenshots) by matching the island outlines around Appledore, Smuttynose, Cedar and Star and pinning Duck Island (GNIS) and White Island Light at the far ends. Expect roughly ±50 m, mostly from where markers were hand-placed on the slides.
- The **sculpin** spot uses the coordinates written in the guide.
- `sightings.csv` lists every site, coordinate and species record.

## Map markers

Every marker's position, species and meaning lives in `map-data.js`. Each site has a `lat`/`lng` and a list of species records. To add a sighting, add a record to an existing site, or add a new site with its coordinates. The species pages use `records.json`-derived pins on the guide's own maps; the full map uses the coordinates.
