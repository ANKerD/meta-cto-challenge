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

Closed and done requests are archived seven days after entering that status. The running server checks for eligible requests once a minute and on startup. It also checks when the list is loaded. If the server is stopped, overdue requests are archived when it next starts. Automatic changes appear in history as System. Unarchiving restores the previous status and starts a new seven-day period.

## Semantic indexing

Install and start Ollama, then download the embedding model with `ollama pull qwen3-embedding:0.6b`. Run `npm run setup` to initialize the indexing queue and backfill existing requests. The running server processes the queue and retries failed items. Creating a request or changing its title or description queues it for indexing. Queued requests are excluded from semantic results until indexing succeeds. The queue persists across restarts; no indexing runs while the server is stopped.

Changing the embedding model requires regenerating existing embeddings. `npm run db:dump` includes embeddings and queued work along with the rest of the database.

## Duplicate checks

Requests scoring at least 90% against an existing request require an explanation. Ollama reviews it using `qwen3:14b` before creation. Install that model with `ollama pull qwen3:14b`. A failed or invalid review does not create the request.

Before submission, a local prompt-injection classifier checks the title and description; it also checks the explanation and existing candidates before duplicate review, and titles before report generation. The first check downloads the pinned `Horizon-Labs/prompt-injection-guard-small` model (about 290 MB); subsequent checks run locally. Flagged text is blocked and creates a security alert in the notification menu. If the classifier is unavailable, these checks fail closed even when the deduplication outage override is enabled. Classification is imperfect; legacy requests may not have a recorded author.

By default, a request cannot be created if Ollama is unavailable. To allow creation during an Ollama outage, set `DEDUP_ALLOW_OLLAMA_UNAVAILABLE=true` in the server environment and restart the server. When Ollama is unavailable, users must confirm a warning that duplicate checking is disabled before creating a request. When Ollama is available, duplicate checking remains enabled. Requests waiting for indexing still block creation until their embeddings are ready.

## Executive reports

The running server generates a report at 09:00 America/Sao_Paulo using Ollama's `qwen3:14b`. It captures the current active votes and counts those cast in the preceding 24 hours. Removed votes are excluded; legacy votes without a timestamp count only toward all-time totals. Reports are available at `/reports`.

The scheduler runs inside the server: it cannot run while the server is stopped. If the server starts after 09:00, it generates that day's report using the actual time it starts and its preceding 24 hours, rather than reconstructing past votes. Failed reports retry every five minutes while the server runs; a stopped or crashed run can resume after its lease expires. Earlier missed days are not reconstructed. Ollama must be running for report generation.

Completed reports appear under the notification bell. A report includes only requests with active votes cast since the previous processed window, within the last 24 hours. When there are no such votes, the day is skipped without calling Ollama or creating a notification. All-time counts in a new report apply to those requests only.
