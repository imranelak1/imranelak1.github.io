# Imrane Lakniti - Portfolio

[imranelak1.github.io](https://imranelak1.github.io/)

Personal portfolio built with React, TypeScript, Three.js and CesiumJS. A weather-aware satellite map connects projects and education to their locations. Star Jedi lettering, a small 3D Vader portrait and a Death Star cursor add a little Star Wars character.

## Run

```sh
npm ci
npm run dev
```

Use Node.js 22 or newer. `npm run build` checks TypeScript and generates `dist/`; `npm run preview` serves the production build locally.

## Edit

- `src/App.tsx`: biography, projects, experience and contact links.
- `src/places.ts`: map coordinates, sources and location precision.
- `src/Globe.tsx` / `src/MapExperience.tsx`: satellite map and exploration controls.
- `src/useMapWeather.ts`: Open-Meteo weather, daylight and offline fallback.
- `src/styles.css`, `src/layout.css`, `src/map.css`: layout and map styling.
- `src/starwars/`: Vader portrait, typography and interactive cursor.

Add `public/cv.pdf` to enable the CV download. Location buttons move the background map and its weather without hiding the portfolio. The selected button is underlined; Explore the map opens the full controls at the current location. Both EMSI campuses use sourced coordinates. Sensthings locations are labeled as approximate areas until exact office pins are available.

The cursor changes into a red targeting lock over links, buttons and project disclosures, then compresses on press. Keyboard, touch, editable fields and map exploration retain native behavior. Vader follows the pointer with eased, bounded head turns. Motion controls and reduced-motion preferences pause the portrait and map; hidden and offscreen rendering stops automatically.

On phones, the profile places Vader beside the contact links, text is larger, and primary touch controls have at least 44px tap targets. Map tools adapt to portrait and landscape, with a horizontally scrolling location list and scrollable details. Safe-area spacing accounts for notches and home indicators. Ambient motion starts on for desktop and touch devices, except when the visitor requests reduced motion. The Motion control can pause it. The portrait renders at a lower pixel density and at most 30fps on touch devices. Cesium loads after the profile's first paint, uses sharper imagery while exploring, and stops the orbit loop while paused.

## Deploy

Push to `main` to publish through [GitHub Actions](.github/workflows/deploy.yml). The workflow installs the locked dependencies, builds the application and deploys the entire `dist/` directory, including Cesium workers and assets, to GitHub Pages. The repository's Pages source must be set to **GitHub Actions**.

The site uses the root URL `/` for assets. No API keys or backend are required. Satellite tiles and weather need internet access; offline weather, imagery failure and unavailable WebGL have fallbacks.

## Check

With the dev server running and Microsoft Edge installed:

```sh
npm run test:browser
npm run test:3d
npm run test:mobile
npm run test:secret
npm run test:weather
```

Set `PORTFOLIO_TEST_URL` to check a production preview or the published site. Checks cover responsive layout, map destinations, keyboard navigation, project disclosures, cursor feedback, portrait tracking, motion preferences and failure states. Screenshots are written to `.impeccable/review/`.

## Credits

The Darth Vader helmet is by [JJTale](https://sketchfab.com/JJTale), licensed under CC BY 4.0. Star Jedi is by Boba Fonts / Davide Canavero; its original package and guide are retained. See [asset credits](public/models/CREDITS.txt) for sources and adaptation details.

Map data attribution is displayed in the interface. Weather comes from [Open-Meteo](https://open-meteo.com/). Map exploration was inspired by [God's Eye View](https://github.com/bilawalsidhu/gods-eye-view).
