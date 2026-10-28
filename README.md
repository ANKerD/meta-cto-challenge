# Feature intelligence system

This repository contains the work for the [technical AI assessment](https://docs.google.com/document/d/1KSEUaS6WcT2lA9rn8cMgbTWMxRJkMm2NzD8yfcUY-aE/edit?tab=t.0).

The system will help a product team turn feature requests into product decisions. The assessment requires users to submit a title and description, discover requests, express support, and understand how requests are grouped, evaluated, or prioritized. An AI capability must address a valuable part of that workflow.

AI processing will use Ollama running on the local machine. The model, AI workflow, and application architecture are awaiting decisions. See [ROADMAP.md](ROADMAP.md) for the implementation steps.

## Local setup

Use Node.js 24 and npm. Run `npm run setup` to install dependencies and create the local SQLite database if it does not exist. The command preserves an existing database. Run `npm run dev` and open http://localhost:3000.

The database is stored in `data.sqlite` and is excluded from Git. The project uses Node's built-in SQLite module. The setup command creates the ticket, relationship, and update-history tables. It leaves existing data in place.

Tickets have an auto-incrementing number and a unique UUID. Use the UUID for ticket URLs. Running setup upgrades an existing database and preserves ticket numbers, relationships, and update history.

## Development data

The repository includes a SQLite dump with sample requests. `npm run setup` restores it when creating a database and preserves an existing database. To share changes to development data, run `npm run db:dump`, review `db/seed.sql`, and commit it. The dump command requires the `sqlite3` command-line tool.

The dump includes all data in `data.sqlite`. This repository is public, so remove private or sensitive data before committing a dump. To start with the shared data again, back up or move your existing `data.sqlite` and run `npm run setup`.

## Prototype login and voting

Open `http://localhost:3000/login?user=your_name` to vote as that name. Names are case-sensitive. Each name can add or remove one vote per request. The login does not verify identity, so anyone can use another person's name.
