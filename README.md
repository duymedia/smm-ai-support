<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/80db6aae-4a52-4ff2-9351-33839f0b1115

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## MariaDB/XAMPP: `Column count of mysql.proc is wrong`

If `npm run dev` fails with an error such as:

```
Column count of mysql.proc is wrong. Expected 21, found 20
```

the MariaDB system tables were created by an older MariaDB version. Run the
upgrade utility that belongs to the XAMPP installation (not the Ubuntu/MySQL
client):

```bash
/opt/lampp/bin/mysql_upgrade -u root -h 127.0.0.1 -P 3306 --force --force
```

The second `--force` is needed when the XAMPP data directory is owned by the
`mysql` service account and the current user cannot create
`/opt/lampp/var/mysql/mysql_upgrade_info`. The command is safe to rerun; it
updates MariaDB's internal tables and does not delete application tables.

Then synchronize Prisma and start the application:

```bash
npx prisma db push --skip-generate --accept-data-loss
npm run dev
```

The `--accept-data-loss` flag is required here because the existing database
uses `ENUM` columns for `users.role` and `users.status`, while the Prisma
schema uses `VARCHAR`. Back up the database before running this command in
production.
