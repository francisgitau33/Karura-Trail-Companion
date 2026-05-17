# Karura Forest Digital Trail Companion (Next.js version)

## Purpose

This project is a **free digital trail companion for Karura Forest visitors**, developed as a public resource by Kenya Children’s Home.  The application helps visitors explore Karura more confidently by showing trails, gates, landmarks, facilities and points of interest on an interactive, mobile‑first map.  It also includes an About section and a Donate section with M‑Pesa donation details.

## Current Status

This repository contains a Next.js implementation of the MVP described in the project brief.  It loads sample trail, point‑of‑interest and junction data from local GeoJSON files and displays them on a MapLibre map.  The data must be verified before public launch.  The MVP has no authentication, database or payment integration.

## Running Locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

   This command launches the Next.js development server on `http://localhost:3000` (or the next available port).  Visit that URL in your browser to view the map.

3. Build the application for production:

   ```bash
   npm run build
   ```

   After building, run `npm start` to serve the compiled app.

## Updating Map Data

All map data lives under the `public/data` directory:

* `trails.geojson` – sample trail line features.
* `points-of-interest.geojson` – sample point of interest features.
* `junctions.geojson` – sample junction features.

Edit these files to add or replace features.  Each feature should include a `status` property set to "Sample data - verify before public launch" unless verified.  You can generate GeoJSON with any GIS tool or by exporting GPS tracks.  Ensure that trails, gates and junctions follow official Karura Forest signage and route numbering.

## Updating Donation Details

Donation information is defined in `src/data/mapConfig.ts` under the `donation` field.  Update the `paybill`, `accountReference` and `websiteUrl` properties with the correct M‑Pesa PayBill number and the website of Kenya Children’s Home.  These values are displayed in the Donate modal.

## Data Verification

The MVP intentionally labels all trail, gate, facility and point‑of‑interest data as **sample**.  Before public launch, verify every location and description against official signage, approved sources or GPS field checks.  Do not remove the verification note until the data has been validated.  The prototype banner at the top of the map can be hidden by setting `showPrototypeBanner` to `false` in `mapConfig.ts`.

## Deployment

This application is built with Next.js and can be deployed as a static or server‑rendered site.  Typical deployment targets include Vercel, Netlify or any hosting provider that supports Node.js applications.  To prepare for deployment:

1. Build the project:

   ```bash
   npm run build
   ```

2. Copy the generated `.next` folder and `package.json` to your server and run `npm start`.

3. Alternatively, deploy directly through Vercel for zero‑configuration hosting.

For static hosting (e.g., GitHub Pages), you may need to use `next export` to generate a fully static build.  However, note that MapLibre and dynamic data loading may require server capability or proper asset configuration.  The supplied configuration is aimed at serverless environments like Vercel.

## Contact

Developed for Kenya Children’s Home as a public resource.  Contributions of verified trail data, facilities information and feedback are welcome.
