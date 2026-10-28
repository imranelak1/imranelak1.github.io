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

- `src/App.tsx`: biography, experience and contact links.
- `src/projects.ts`: project descriptions, technology stacks, public repository links and screenshot metadata.
- `src/ProjectSection.tsx` / `src/projects.css`: project disclosures, responsive screenshot galleries and accessible image viewer.
- `public/projects/`: authentic project screenshots, optimized WebP previews and their provenance.
- `src/places.ts`: map coordinates, sources and location precision.
- `src/Globe.tsx` / `src/MapExperience.tsx`: satellite map and exploration controls.
- `src/useMapWeather.ts`: Open-Meteo weather, daylight and offline fallback.
- `src/styles.css`, `src/layout.css`, `src/map.css`: layout and map styling.
- `src/starwars/`: Vader portrait, typography and interactive cursor.

`public/cv.pdf` contains the English CV and is available from the profile’s CV download link. Replace that file to publish a newer version, and keep the biography, experience, education and skills in `src/App.tsx` and projects in `src/projects.ts` in sync. Location buttons move the background map and its weather without hiding the portfolio. The selected button is underlined; Explore the map opens the full controls at the current location. Both EMSI campuses use sourced coordinates. Sensthings locations are labeled as approximate areas until exact office pins are available.

The cursor changes into a red targeting lock over links, buttons and project disclosures, then compresses on press. Keyboard, touch, editable fields and map exploration retain native behavior. Vader follows the pointer with eased, bounded head turns. Motion controls and reduced-motion preferences pause the portrait and map; hidden and offscreen rendering stops automatically.

On phones, the profile places Vader beside the contact links, text is larger, and primary touch controls have at least 44px tap targets. Map tools adapt to portrait and landscape, with a horizontally scrolling location list and scrollable details. Safe-area spacing accounts for notches and home indicators. Ambient motion starts on for desktop and touch devices, except when the visitor requests reduced motion. The Motion control can pause it.

The portrait renders at most 30fps on every device, with pixel density capped at 1.5 (1 on devices reporting four or fewer CPU threads or 4GB of memory). Cesium loads after the profile's first paint on all devices. Its shaded background uses a 0.75 resolution scale, increasing to 1 when exploring; lower-power devices use 0.55 and 0.8 respectively. Background orbit updates are limited to 15fps, or 10fps on lower-power devices. Map multisample antialiasing is disabled, and weather layers are bounded to their animation travel. Sustained low frame rates reduce map quality and pause ambient motion once per visit; the Motion control can resume it. Hidden tabs and paused motion stop the orbit loop.

## Project screenshots

The project section includes MonsterGarage, GitSomething, Forge and FunClipper screenshots. Switch views below each image, or open the full-size viewer; arrow keys change screenshots and Escape closes it and returns focus. Background animation pauses while a viewer is open.

Screenshots use empty or demonstration workspaces and controlled test footage. They are real application captures, not mockups or claims about production performance. Originals and 720px previews are served locally as WebP, with lazy loading and explicit dimensions. See [asset provenance](public/projects/CREDITS.md).

Run `npm run test:projects` against the local development server, or set `PORTFOLIO_TEST_URL` to a different URL. It checks desktop and mobile galleries, keyboard navigation, focus restoration, image loading, narrow layouts and recovery from a missing screenshot without WebGL.

## Deploy

Push to `main` to publish through [GitHub Actions](.github/workflows/deploy.yml). The workflow installs the locked dependencies, builds the application and deploys the entire `dist/` directory, including Cesium workers and assets, to GitHub Pages. The repository's Pages source must be set to **GitHub Actions**.

The site uses the root URL `/` for assets. No API keys or backend are required. Satellite tiles and weather need internet access; offline weather, imagery failure and unavailable WebGL have fallbacks.

## Check

With the dev server running and Microsoft Edge installed:

```sh
npm run test:browser
npm run test:projects
npm run test:3d
npm run test:mobile
npm run test:secret
npm run test:weather
npm run test:performance
```

Set `PORTFOLIO_TEST_URL` to check a production preview or the published site. Checks cover responsive layout, map destinations, keyboard navigation, project disclosures, cursor feedback, portrait tracking, motion preferences, rendering budgets and failure states. Screenshots are written to `.impeccable/review/`.

The Easter egg payload is encrypted; its code and message are absent from the current source and public tests. A short numeric code provides casual hiding only, not secure access control, and older commits may contain previous values. Checks generate independent test data. To change the payload, keep a JSON file with `code` and `message` in the ignored `.impeccable/` folder and run `node scripts/seal-secret.mjs <private-file>`. Never commit that input file. Set `PORTFOLIO_SECRET_FILE` to its local path when checking the real published payload.

## Credits

The Darth Vader helmet is by [JJTale](https://sketchfab.com/JJTale), licensed under CC BY 4.0. Star Jedi is by Boba Fonts / Davide Canavero; its original package and guide are retained. See [asset credits](public/models/CREDITS.txt) for sources and adaptation details.

Map data attribution is displayed in the interface. Weather comes from [Open-Meteo](https://open-meteo.com/). Map exploration was inspired by [God's Eye View](https://github.com/bilawalsidhu/gods-eye-view).
