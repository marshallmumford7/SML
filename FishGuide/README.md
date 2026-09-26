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
- `bigmap.js`, `map-data.js` – the sightings map and the marker data behind every map
- `vendor/leaflet/` – the Leaflet map library (bundled, so nothing loads from outside)
- `images/` – photos, illustrations and maps taken from the original deck

## Editing

Each page is plain HTML. To add an observation, open the species page and add a `<p>` inside the `Field observations` block; to add a map or photo, drop the image in `images/` and copy an existing `<figure>`.

## Map markers

Every marker's position, species and meaning lives in `map-data.js`. Positions are stored as fractions of each base map's width and height, taken from the original slides. To add a sighting, add a record to an existing site or add a new site with its `x`/`y` fraction.
