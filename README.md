# Weather App

A comprehensive full-stack weather application that provides real-time weather data, historical weather information, and data management capabilities. The application offers an intuitive interface for accessing current weather conditions, 5-day forecasts, and historical weather data from 1979 onwards, with features for data persistence and export functionality.

## Prerequisites

- Docker and Docker Compose
- OpenWeather API key (sign up at https://openweathermap.org/api)
   - Free (1000 requests/day), but subscription requires a credit card. Can limit daily usage via settings to stay free.
   - Quick setup: Here is my temporary API key: 202bbd9f2de0e13ca11e88a02ef9dcba

## Quick Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd weather_app
```

2. Set up environment variables:

Create `weather_app/backend/.env`:
```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=weather_db
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
OPENWEATHER_API_KEY=your_api_key_here
```

Create `weather_app/frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_api_key_here
```

Create `weather_app/.env` (root directory):
```
OPENWEATHER_API_KEY=your_api_key_here
```

3. Start the application:
```bash
pwd # should be weather_app
sudo docker compose up -d
```

Shut down the application:
```bash
sudo docker compose down
```

Shut down the application and remove the database container:
```bash
sudo docker compose down -v
```

Rebuild the images:
```bash
sudo docker compose up --build -d
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Project Structure
```
weather-app/
│
├── backend/                # FastAPI Backend
│   ├── app/
│   │   ├── main.py         # Application entry point
│   │   ├── models.py       # Database models
│   │   ├── schemas.py      # Data validation schemas
│   │   ├── crud.py         # Database operations
│   │   ├── database.py     # Database configuration
│   │   └── weather_api.py  # OpenWeather API integration
│   ├── requirements.txt    # Python dependencies
│   ├── Dockerfile
│   ├── .env                # Backend environment variables
│   └── README.md           # Backend documentation
│
├── frontend/               # Next.js Frontend
│   ├── src/
│   │   └── pages/          # Next.js pages
│   │       ├── index.js    # Home page
│   │       ├── weather.js  # Weather display
│   │       └── database.js # Database management
│   ├── next.config.js      # API routes
│   ├── tailwind.config.js  # Tailwind CSS configuration
│   ├── package.json        # Node.js dependencies
│   ├── Dockerfile
│   ├── .env.local          # Frontend environment variables
│   └── README.md           # Frontend documentation
│
├── db/                     # PostgreSQL Docker container
│   └── docker-compose.yml  # Database configuration
│
├── docker-compose.yml      # Docker services configuration
├── .env                    # Root environment variables
└── README.md               # Project documentation
```

## Components

### Backend
A FastAPI-based REST API service built with Python 3.11, featuring PostgreSQL for data persistence and SQLAlchemy for ORM. Integrates with OpenWeather API for weather data retrieval and provides comprehensive CRUD operations for weather records.

[View Backend Documentation](backend/README.md)

### Frontend
A modern React application built with Next.js 14, featuring a responsive UI designed with Tailwind CSS. Provides an intuitive interface for weather data visualization, search functionality with autocomplete, and database management capabilities.

[View Frontend Documentation](frontend/README.md)

### Database

A PostgreSQL database containerized with Docker, configured with a user and password for secure access.<BR>
Accessible (post-deployment) via:
```bash
sudo docker ps -a # identify postgres container id
sudo docker exec -it <container-id> psql -U postgres -d weather_db
```

## Development Setup

For local development without Docker:

1. Start the PostgreSQL database:
```bash
pwd # should be weather_app
sudo docker compose up -d db
```

2. Run the backend (in a new terminal):
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

3. Run the frontend (in a new terminal):
```bash
cd frontend
npm install
npm run dev
```
