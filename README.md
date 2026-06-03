<<<<<<< HEAD
# Samriddho-Computer-Education
Website for Samriddho Computer Education made by SCE LLC by Samriddho Karmakar.
=======
# Samriddho Computer Education

Cloudflare Pages website with a D1 database backend.

## What’s included
- Static public pages in `public/`
- Teacher admin panel at `/teacher-login`
- Pages Functions API in `functions/api/[[path]].js`
- D1 schema and seed data in `migrations/0001_init.sql`

## Local test first
1. Install Wrangler once:
   - `npm install -g wrangler`
2. Create the D1 database if you have not already:
   - `npx wrangler d1 create sce-db`
3. Put the new database ID into `wrangler.toml`
4. Apply the migration:
   - `npx wrangler d1 migrations apply sce-db --remote`
5. Start local Pages dev:
   - `npx wrangler pages dev public --d1 DB=<YOUR_D1_DATABASE_ID>`
6. Open the local URL Wrangler shows in the terminal.

## What to test locally
- Home page loads from `public/index.html`
- Course and project cards render
- Contact form submits
- Student portal searches by enrollment ID
- Teacher login opens `/teacher?secret=sce102`
- Teacher panel loads students, courses, and certificates

## Before publishing
1. Push the repo to GitHub.
2. In Cloudflare Pages, connect that GitHub repo.
3. Set build output directory to `public`.
4. Add the D1 binding named `DB`.
5. Deploy and test the live site.

## Useful files
- `wrangler.toml`
- `functions/api/[[path]].js`
- `migrations/0001_init.sql`
- `public/js/script.js`
- `public/js/teacher.js`

>>>>>>> 41cb52d (Prepare Cloudflare Pages Git deployment)
