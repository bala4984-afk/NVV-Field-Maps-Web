# NVV Field Maps web — version 1.0.68

This publication matches the web interface bundled in Android APK 1.0.68. The app runs independently on GitHub Pages; it does not load the previous chatgpt.site.

Run `python3 build-web.py` to validate and unpack the complete application into `public/`. The small package segments contain the original logo, map libraries and all reference data. `web-bundle.json` lists their SHA-256 hashes. The GitHub Pages workflow builds and publishes `public/`.

The readable JavaScript, HTML and CSS in the repository match the packaged application. Changes to those files must also be included in a rebuilt package before publication.

Includes ArcGIS imagery with labels, Google Hybrid/Satellite alternatives, map rotation, project/folder visibility, KML/KMZ import, drawing edits and Undo, line-aligned distances, DMS LT/RT turn angles, and keyboard-aware point Save forms. Each visitor's projects stay in that visitor's browser.
