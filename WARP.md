# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Common commands

All commands are intended to be run from the project root (`FlaskFootprintAnalyzer/FlaskFootprintAnalyzer`). The project uses Python 3.11+ and `pyproject.toml` for dependency management.

### Install dependencies

```bash
pip install -e .
```

If editable installs are not needed, a plain install also works:

```bash
pip install .
```

When `pip install` is not desired, you can instead install directly from `pyproject.toml` using:

```bash
pip install flask flask-cors mysql-connector-python python-dotenv pyjwt
```

### Initialize the database

The application uses MySQL (`campus_carbon` DB by default) with schema and seed data managed via a script.

```bash
# Ensure .env contains DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT
python database/init_db.py
```

This will:
- Create/update schema from `database/schema.sql`
- Ensure an `admin` user (`admin` / `admin123`) exists
- Seed sample `activity_data` for dashboard visualizations

### Run the Flask application

The main entrypoint is `app.py`.

```bash
# Make sure DB_PASSWORD and other DB_* env vars are set (e.g. via .env)
python app.py
```

Relevant environment variables (read via `python-dotenv` in `app.py` and `database/init_db.py`):
- `DB_HOST` (default `localhost`)
- `DB_USER` (default `root`)
- `DB_PASSWORD` (required; app will fail fast if missing)
- `DB_NAME` (default `campus_carbon`)
- `DB_PORT` (default `3306`)
- `SESSION_SECRET` (Flask session/JWT signing secret; defaults to a placeholder value)
- `FLASK_DEBUG` (enables development-only routes and debug mode; truthy by default)
- `PORT` (Flask port, default `5000`)

The app will be available at `http://localhost:5000/`.

### Development-only helpers

There is a debug endpoint to reset the admin user, only enabled when `FLASK_DEBUG` is truthy:

```bash
curl -X POST http://localhost:5000/debug/reset_admin
```

This will (re)create `admin` with password `admin123`.

### API testing examples

#### Obtain a JWT for API calls

```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Use the returned `token` in subsequent calls as `Authorization: Bearer <token>`.

#### Insert a single activity record

```bash
curl -X POST http://localhost:5000/api/data \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "date": "2025-07-01",
    "source_type": "electricity",
    "raw_value": 120000,
    "unit": "kWh"
  }'
```

#### Bulk insert via CSV-like JSON

```bash
curl -X POST http://localhost:5000/api/upload_csv \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "records": [
      {"date": "2025-07-01", "source_type": "electricity", "raw_value": 120000, "unit": "kWh"},
      {"date": "2025-07-01", "source_type": "bus_diesel", "raw_value": 5000, "unit": "Liters"}
    ]
  }'
```

### Tests and linting

There are no explicit test or lint configurations in the repo. If you introduce tests, follow standard Python practices (e.g. `pytest`) and document any new commands here.

## High-level architecture

### Overview

This is a small Flask application that exposes:
- A **public dashboard** (`/`) that visualizes carbon emissions for a campus using data aggregated from a MySQL database.
- An **admin portal** (`/login`, `/data-input`) for authenticated data entry.
- A set of **JSON APIs** to power the dashboard and support programmatic data ingestion.

The main components are:
- `app.py`: Flask app factory, route definitions, authentication helpers, and all HTTP/API logic.
- `database/init_db.py`: one-time/occasional database initialization and seeding script.
- `database/schema.sql` (described in `README.md`): defines the `users`, `activity_data`, and `emission_factors` tables.
- `templates/` and `static/`: Jinja2 templates and frontend assets for the dashboard and admin UI (structure detailed in `README.md`).

### Request flow and auth model

1. **Public dashboard**
   - `GET /` renders `templates/dashboard.html`.
   - Frontend JS (in `static/js/dashboard.js`) calls `GET /api/dashboard` and `GET /api/recommendations` to populate charts and KPI cards.
   - These endpoints are **public** and only read from the database.

2. **Admin web login (session-based)**
   - `GET /login` renders `templates/login.html`.
   - `POST /login` checks credentials against the `users` table and, on success, sets `session['user_id']` and `session['username']`.
   - `@login_required` protects `/data-input`, which renders `templates/data_input.html` for manual data entry.

3. **API login (JWT-based)**
   - `POST /api/login` validates credentials and, on success, returns a JWT signed with `SESSION_SECRET`, expiring in 24 hours.
   - The token is used for machine-to-machine or SPA-style access to protected APIs.

4. **Protected APIs**
   - `@api_token_required` decorator accepts either:
     - A valid Flask session (`session['user_id']` set), or
     - A valid JWT in the `Authorization: Bearer <token>` header.
   - Protected endpoints:
     - `POST /api/data` – insert a single `activity_data` row.
     - `POST /api/upload_csv` – bulk insert multiple `activity_data` rows from a JSON array.

### Data model and computation

Core tables (from `README.md` and schema):
- `users(id, username, password)` – simple credential store used by both web and API login.
- `activity_data(id, date, source_type, raw_value, unit)` – raw consumption measurements.
- `emission_factors(id, source_type, factor, factor_unit)` – CO₂e conversion factors per source type.

Emission calculation (used in `/api/dashboard`):
- Emissions per record in tonnes CO₂e: `(raw_value * factor) / 1000`.
- Aggregations:
  - **Total emissions**: sum over filtered records.
  - **Source breakdown**: per-`source_type` sum of emissions.
  - **Monthly trend**: emissions bucketed by `YYYY-MM` from the `date` field.
  - **Year-over-year percentage change**: compares the selected date range with the previous window of the same length.

Recommendations (`/api/recommendations`) are derived server-side by:
- Aggregating emissions per `source_type`.
- Identifying the top-emitting source.
- Returning a small set of pre-defined recommendation objects tailored to that dominant source (e.g. electricity vs transport vs canteen vs waste), plus some generic monitoring and awareness suggestions.

### Environment and runtime behavior

- Environment variables are loaded from `.env` using `python-dotenv` in both `app.py` and `database/init_db.py`.
- `app.py` will raise a `ValueError` during startup if `DB_PASSWORD` is not set, to avoid silent misconfiguration.
- A MySQL connection pool (`mysql.connector.pooling.MySQLConnectionPool`) is used when possible. If pool creation fails, the code falls back to one-off connections; all DB operations go through `get_db_connection()`.
- Debug behavior:
  - `DEBUG_MODE` and Flask `debug` flag are derived from `FLASK_DEBUG`.
  - The `/debug/reset_admin` route only responds when `DEBUG_MODE` is truthy; otherwise it returns a 404-like error.
  - When running under a debugger like `debugpy`, the Flask reloader is disabled to avoid double-starting the process.

### Frontend structure (from README)

The README describes the primary UI files:
- `templates/base.html` – global layout, navigation, and shared includes.
- `templates/dashboard.html` – public-facing dashboard page.
- `templates/login.html` – admin login page.
- `templates/data_input.html` – admin data entry form.
- `static/css/style.css` – dark-themed styling for the entire app.
- `static/js/dashboard.js` – Chart.js setup and API calls for KPIs and charts.
- `static/js/data_input.js` – form submission logic for inserting data via APIs.

When editing or adding routes in `app.py`, ensure corresponding templates and JS hooks are updated consistently.

### Notes for future changes

- If you introduce automated tests, consider structuring them around:
  - API-level tests for `/api/login`, `/api/data`, `/api/upload_csv`, `/api/dashboard`, and `/api/recommendations`.
  - Database integration tests that use a temporary schema or test database separate from production.
- Any changes to the DB schema should be reflected in:
  - `database/schema.sql`
  - `database/init_db.py` seed logic
  - The derived metrics in `/api/dashboard` and `/api/recommendations`.
