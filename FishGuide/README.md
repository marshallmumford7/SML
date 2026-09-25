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
- `script.js` – click any photo or map to view it larger
- `images/` – photos, illustrations and maps taken from the original deck

## Editing

Each page is plain HTML. To add an observation, open the species page and add a `<p>` inside the `Field observations` block; to add a map or photo, drop the image in `images/` and copy an existing `<figure>`.
