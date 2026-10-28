# Feature intelligence system

This repository contains the work for the [technical AI assessment](https://docs.google.com/document/d/1KSEUaS6WcT2lA9rn8cMgbTWMxRJkMm2NzD8yfcUY-aE/edit?tab=t.0).

The system will help a product team turn feature requests into product decisions. The assessment requires users to submit a title and description, discover requests, express support, and understand how requests are grouped, evaluated, or prioritized. An AI capability must address a valuable part of that workflow.

AI processing will use Ollama running on the local machine. The model, AI workflow, and application architecture are awaiting decisions. See [ROADMAP.md](ROADMAP.md) for the implementation steps.

## Local setup

Use Node.js 24 and npm. Run `npm run setup` to install dependencies and create the local SQLite database if it does not exist. The command preserves an existing database. Run `npm run dev` and open http://localhost:3000.

The database is stored in `data.sqlite` and is excluded from Git. The project uses Node's built-in SQLite module. No tables or migrations have been defined yet.
