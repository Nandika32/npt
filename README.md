# nandika-site

My personal website: a dark floral theme with a 3D lily, flying butterflies, a pinned sideways work reel and a playable quantum Bloch sphere.

## Files
- `index.html`: page structure and all the text (About, Work, Projects, Contact)
- `style.css`: colours, fonts and layout. Change the palette in the `:root` block at the top
- `script.js`: all the motion: the 3D lily (Three.js), butterflies, falling petals, scroll effects (GSAP + Lenis) and the Bloch sphere
- `assets/photo.jpg`: the About photo

## Run it locally
Open `index.html` in a browser, or run `python3 -m http.server` in this folder and visit http://localhost:8000.

## Put it online (GitHub Pages)
1. Create a public repo named `Nandika32.github.io`.
2. Upload everything in this folder, keeping `assets/`.
3. Settings → Pages → deploy from the `main` branch.
4. Live at https://nandika32.github.io

Libraries load from CDNs: Three.js r128, GSAP 3.12.5 (+ ScrollTrigger), Lenis 1.1.13, and Google Fonts (Bricolage Grotesque, Instrument Serif, JetBrains Mono).
