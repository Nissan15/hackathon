# Campus Carbon Footprint Analyzer

A full-stack web application for tracking and analyzing carbon emissions at KIT - Kalaignar Karunanidhi Institute of Technology. Built in support of UN Sustainable Development Goal 13: Climate Action.

## Features

### Public Dashboard (No Login Required)
- **Interactive KPI Cards**: View total emissions, percentage change, biggest emission source, and total energy consumed
- **Emissions Trend Chart**: Line chart showing monthly emissions over time
- **Source Breakdown**: Donut chart displaying emissions by source (Electricity, Transport, Canteen, Waste)
- **Year-over-Year Comparison**: Grouped bar chart comparing current vs previous year
- **Smart Recommendations**: AI-driven suggestions based on emission patterns

### Admin Portal (Login Required)
- **Secure Authentication**: Password-protected admin access
- **Data Input Form**: Easy-to-use interface for entering daily consumption data
- **Emission Factors Reference**: Built-in table showing conversion factors

## Technology Stack

- **Backend**: Python Flask
- **Database**: SQLite
- **Frontend**: Flask Templates (Jinja2), HTML, CSS, JavaScript
- **Visualization**: Chart.js
- **Authentication**: Flask Sessions with Werkzeug password hashing

## Installation & Setup

### Prerequisites
- Python 3.11+

### Step 1: Install Dependencies
```bash
pip install flask flask-cors PyJWT
```

### Step 2: Initialize Database
```bash
python database/init_db.py
```

This will:
- Create the SQLite database (`campus_carbon.db`)
- Set up tables: `users`, `activity_data`, `emission_factors`
- Insert emission factors
- Create default admin user
- Populate sample data

### Step 3: Run the Application
```bash
python app.py
```

The application will be available at: `http://localhost:5000`

## Default Credentials

- **Username**: admin
- **Password**: admin123

**Important**: Change these credentials in production!

## Database Schema

### users
- `id`: Primary key
- `username`: Unique username
- `password_hash`: Hashed password

### activity_data
- `id`: Primary key
- `date`: Date of data entry (YYYY-MM-DD)
- `source_type`: Type of emission source (electricity, bus_diesel, canteen_lpg, waste_landfill)
- `raw_value`: Consumption amount
- `unit`: Unit of measurement (kWh, Liters, kg)

### emission_factors
- `id`: Primary key
- `source_type`: Type of emission source
- `factor`: CO₂e conversion factor
- `factor_unit`: Unit of the factor

## Emission Factors (Pre-populated)

| Source Type | Factor | Unit |
|-------------|--------|------|
| Electricity | 0.708 | kg CO₂e/kWh |
| Bus Diesel | 2.68 | kg CO₂e/Liter |
| Canteen LPG | 2.93 | kg CO₂e/kg |
| Waste (Landfill) | 1.25 | kg CO₂e/kg |

## API Endpoints

### Public Endpoints
- `GET /`: Dashboard page
- `GET /api/dashboard?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`: Get dashboard data
- `GET /api/recommendations`: Get emission reduction recommendations

### Protected Endpoints (Require Login)
- `POST /login`: Admin login
- `GET /data-input`: Data input page
- `POST /api/data`: Add new activity data
- `GET /logout`: Logout

## Calculation Logic

Total Emissions (Tonnes CO₂e) = (raw_value × emission_factor) / 1000

## Project Structure

```
.
├── app.py                      # Main Flask application
├── database/
│   ├── schema.sql             # Database schema
│   └── init_db.py             # Database initialization script
├── templates/
│   ├── base.html              # Base template with navigation
│   ├── dashboard.html         # Public dashboard
│   ├── login.html             # Admin login page
│   └── data_input.html        # Admin data input page
├── static/
│   ├── css/
│   │   └── style.css          # Dark-themed styling
│   └── js/
│       ├── dashboard.js       # Dashboard charts and API calls
│       └── data_input.js      # Data input form handling
├── campus_carbon.db           # SQLite database (created after init)
└── README.md
```

## Usage Guide

### For Public Users (Students/Guests)
1. Visit the homepage to view the dashboard
2. Use the time period selector to filter data
3. View KPIs, charts, and recommendations
4. No login required

### For Admins (Campus Staff)
1. Click "Admin Login" in the navigation
2. Enter credentials (admin/admin123)
3. Navigate to "Data Input"
4. Fill in the form:
   - Select date
   - Choose source type
   - Enter raw value
   - Unit auto-selects based on source type
5. Click "Add Data"
6. Data will appear in dashboard after submission

## Future Enhancements (Phase 2)

- CSV bulk upload functionality
- AI/ML predictive forecasting using SARIMA model
- OCR-based bill scanning for automated data entry
- Data export functionality
- Enhanced filtering and date range options
- Mobile responsive improvements

## Support for UN SDG 13

This application directly supports **UN Sustainable Development Goal 13: Climate Action** by:
- Providing transparency in campus carbon emissions
- Enabling data-driven decision making
- Identifying key areas for improvement
- Tracking progress over time
- Promoting awareness and education

## Security Notes

- Passwords are hashed using Werkzeug's secure password hashing
- Session management with Flask sessions
- Input validation on all forms
- SQL injection protection with parameterized queries

## License

Built for KIT - Kalaignar Karunanidhi Institute of Technology

## Contact

For issues or questions, contact the campus administration.
