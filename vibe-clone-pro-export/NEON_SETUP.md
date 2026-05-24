Neon Quick Setup
----------------

1) Install Neon CLI (optional, locally or globally):

   npm install -g neon-cli

2) Create a new Neon project and a branch from the Neon Console or using the CLI.

3) Copy the project's Postgres connection string into `.env.local` as `DATABASE_URL`.

4) Install dependencies and run the app:

   npm install
   npm run dev

Notes
- This project uses the native Postgres driver (`pg`) and a pooled client at `utils/db.ts`.
- Keep the `DATABASE_URL` secret (do not commit `.env.local`).
