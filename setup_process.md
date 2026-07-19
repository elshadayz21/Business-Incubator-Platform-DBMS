# Database Setup Process

This document outlines the steps taken to initialize the database for the Business Incubator Platform DBMS.

## Initial Problem
The project relies on a PostgreSQL database (`incubator_db`), but the command-line tool `psql` was not available in the system's PATH.

## Solution Steps

### 1. Database Creation (via pgAdmin)
Since `psql` was unavailable, we used pgAdmin to manually create the database and user:
- Created a Login/Group Role named `incubator_user` with the password `strongpassword`.
- Created a Database named `incubator_db` owned by `incubator_user`.
*(Alternatively, you can use the default `postgres` user by updating the `Website/.env` file with `DB_USER=postgres` and `DB_PASS=your_password`).*

### 2. Environment Variables & Database Connection Fix

When attempting to run the migrations, an error occurred because the Desktop app's database config was modified to use `process.env` but wasn't actually loading the `.env` file, resulting in an undefined password (`client password must be a string`).

- **Fix:** Installed `dotenv` in the Desktop directory (`npm install dotenv`).
- **Fix:** Added `require("dotenv").config();` to the top of `Business-Incubator-DB-System/Desktop/src/electron/backend/config/database.cjs` to properly load the `.env` variables.

### 3. Fixing the "Role not permitted to log in" Error

During migration, we encountered an authentication error because the created role did not have login privileges.

- **Fix:** In pgAdmin, modified the role's properties by going to the **Privileges** tab and toggling **Can login?** to **Yes**. Ensured the password matched what was stored in `.env`.

### 4. Running the Initial Schema

The migration script failed with `relation "users" does not exist` because `npm run migrate` only runs the files located in `database/migrations` (which contained `ALTER TABLE` statements) but failed to run the initial schema (`database/db.sql`) where the tables are actually created.

- **Fix:** Created a temporary script (`run_init_schema.cjs`) inside the Desktop directory to read and execute `db.sql` directly using the database connection pool.
- Executed it using `node run_init_schema.cjs`, which successfully created all base tables.

### 5. Running Migrations and Seeders

Once the initial schema was executed, the standard migration script ran perfectly.

- Navigated to the Desktop app directory: `cd "Business-Incubator-DB-System\Desktop"`
- Executed the migration script: `npm run migrate`

This successfully applied all migration updates and populated the database with initial seed data.

### 6. Website App: ES Module dotenv Hoisting Fix

When running the Website app (`npm run dev`), the exact same database connection error (`client password must be a string`) appeared, even though `.env` variables were correctly defined.

This happened because `server.js` was using ES Modules (`import`). ES Module imports are hoisted and executed *before* any inline code in the file. Thus, `import pool from "./config/db.js"` was running before `config({ debug: false })` could load the environment variables.

- **Fix:** In `Website/server.js`, replaced `import { config } from "dotenv";` and the subsequent `config()` call with a single import at the very top: `import "dotenv/config";`. This ensures `dotenv` executes immediately during the import phase, properly injecting variables before the database connection pool is created.

### 7. Conclusion

With the database initialized, tables created, migrations applied, data seeded, and the environment variable loading mechanism fixed across both codebases, running `npm run dev` in the `Website` directory and the Desktop directory will now successfully connect to a fully populated local database.

