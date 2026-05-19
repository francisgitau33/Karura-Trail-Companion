# Karura Forest Digital Trail Companion (Next.js version)

## Purpose

This project is a **free digital trail companion for Karura Forest visitors**, developed as a public resource by Kenya Children's Home.  The application helps visitors explore Karura more confidently by showing trails, gates, landmarks, facilities and points of interest on an interactive, mobile-first map.  It also includes an About section and a Donate section with M-Pesa donation details.

## Current Status

This repository contains a Next.js implementation of the MVP described in the project brief.  It loads sample trail, point-of-interest, gate and junction data from local GeoJSON files and displays them on a MapLibre map.  The data must be verified before public launch.

The app now includes a production CMS foundation for platform-owner management of public text content.  Map geometry is not CMS-editable yet: trails, gates, POIs, junctions and boundary files remain code/data-review assets under `public/data`.

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

## CMS Foundation

The CMS is available at `/admin/login` and `/admin`.  It is intentionally hidden from public navigation and is limited to active users with the `PLATFORM_OWNER` role.

The CMS currently manages public-facing text/settings only:

* app name, tagline, prototype banner text and banner visibility;
* About modal title, body and call-to-action text;
* Donate modal title, body, M-Pesa fields, donation note and website button;
* Safety and visitor guidance copy;
* contact/footer fields for email, LinkedIn and Medium.

It does not manage public registration, visitor accounts, payments, analytics, trails, gates, POIs, boundary geometry or GeoJSON editing.

### Database Setup

Use Vercel-managed Neon Postgres / Vercel Postgres.  Do not use Supabase for this project.

Run the SQL migration in:

```bash
migrations/001_cms_foundation.sql
```

This creates:

* `admin_users`
* `site_settings`
* `audit_log`

### Required Environment Variables

Set these in Vercel and in any local environment used for admin/CMS work:

```bash
DATABASE_URL=
ADMIN_SESSION_SECRET=
INITIAL_ADMIN_EMAIL=
INITIAL_ADMIN_PASSWORD=
```

Optional:

```bash
APP_URL=
```

Do not expose these values to browser code.  Do not prefix them with `NEXT_PUBLIC_`.

`ADMIN_SESSION_SECRET` should be a long random string of at least 32 characters.  `INITIAL_ADMIN_PASSWORD` should be at least 12 characters.

### First Admin Setup

After the database migration has run and the environment variables are configured, seed the first platform owner:

```bash
npm run cms:setup-admin
```

This creates or updates the `INITIAL_ADMIN_EMAIL` user as an active `PLATFORM_OWNER` with a hashed password.

### Audit Logging

The app logs:

* `ADMIN_LOGIN_SUCCESS`
* `ADMIN_LOGIN_FAILED`
* `ADMIN_LOGOUT`
* `SITE_SETTINGS_UPDATED`

Recent audit events are shown on the admin dashboard when the database is available.

### Fallback Behavior

If the database is unavailable or no `site_settings` row exists, the public app falls back to the current in-code wording so the map can still render.  The admin dashboard also starts from those fallback values and creates the first settings row on save.

## Updating Map Data

All map data lives under the `public/data` directory:

* `trails.geojson` - sample trail line features.
* `points-of-interest.geojson` - sample point of interest features.
* `junctions.geojson` - sample junction features.

Edit these files to add or replace features.  Each feature should include a `status` property set to "Sample data - verify before public launch" unless verified.  You can generate GeoJSON with any GIS tool or by exporting GPS tracks.  Ensure that trails, gates and junctions follow official Karura Forest signage and route numbering.

## Updating Donation Details

Donation wording and public donation fields should be updated through `/admin` once the CMS database is configured.  The older `src/data/mapConfig.ts` donation values are retained only as fallback/reference values while the CMS is unavailable.

## Data Verification

The MVP intentionally labels all trail, gate, facility and point-of-interest data as **sample**.  Before public launch, verify every location and description against official signage, approved sources or GPS field checks.  Do not remove the verification note until the data has been validated.  The prototype banner at the top of the map can be hidden by setting `showPrototypeBanner` to `false` in `mapConfig.ts`.

## Deployment

This application is built with Next.js and can be deployed as a static or server-rendered site.  Typical deployment targets include Vercel, Netlify or any hosting provider that supports Node.js applications.  To prepare for deployment:

1. Build the project:

   ```bash
   npm run build
   ```

2. Copy the generated `.next` folder and `package.json` to your server and run `npm start`.

3. Alternatively, deploy directly through Vercel for zero-configuration hosting.

For static hosting (e.g., GitHub Pages), you may need to use `next export` to generate a fully static build.  However, note that MapLibre and dynamic data loading may require server capability or proper asset configuration.  The supplied configuration is aimed at serverless environments like Vercel.

## Vercel / Neon Notes

1. Create or connect a Vercel-managed Neon Postgres database.
2. Add `DATABASE_URL`, `ADMIN_SESSION_SECRET`, `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD` to the Vercel project environment.
3. Run `migrations/001_cms_foundation.sql` against the Vercel/Neon database.
4. Run `npm run cms:setup-admin` in an environment with the same database variables.
5. Deploy normally through Vercel.

The public map should continue to render even if CMS content cannot be fetched, but admin routes require a working database and session secret.

## Contact

Developed for Kenya Children's Home as a public resource.  Contributions of verified trail data, facilities information and feedback are welcome.
