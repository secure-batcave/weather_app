# Weather App Backend

This is the backend for the Weather App, built with **FastAPI** and **SQLAlchemy**. It provides a robust API for fetching, storing, and managing weather data from OpenWeather API, with support for both current and historical weather information.

## Features

- Real-time weather data fetching from OpenWeather API
- Historical weather data retrieval (from 1979 onwards)
- 5-day weather forecasts
- PostgreSQL database integration for data persistence
- CRUD operations for locations and weather records
- Data export functionality
- Input validation using Pydantic models
- Cross-Origin Resource Sharing (CORS) support

## Project Structure

### Core Components

#### 1. `main.py`
The application's entry point, defining all API endpoints and route handlers.

**Key Endpoints:**
| Method | Endpoint                       | Description                                  |
|--------|--------------------------------|----------------------------------------------|
| POST   | `/locations/`                  | Create a new location                       |
| GET    | `/locations/`                  | List all locations                          |
| GET    | `/weather/current/{city}`      | Get current weather for a city              |
| GET    | `/weather/forecast/{city}`     | Get 5-day weather forecast                  |
| GET    | `/weather/historical/{city}`   | Get historical weather data                 |
| GET    | `/weather/past_searches/{city}`| Get past weather searches for a city        |
| PUT    | `/weather/{record_id}`         | Update a weather record                     |
| DELETE | `/weather/{record_id}`         | Delete a weather record                     |
| GET    | `/export/{city}`              | Export weather data for a city              |
| DELETE | `/locations/{location_id}`     | Delete location and associated records      |

#### 2. `models.py`
Defines the database schema using SQLAlchemy ORM.

**Key Models:**
- `Location`: Geographic locations with city, country, coordinates
- `WeatherRecord`: Current weather data linked to locations
- `HistoricalWeatherRecord`: Historical weather data with query timestamps

#### 3. `schemas.py`
Pydantic models for request/response validation and serialization.

**Key Schemas:**
- Location schemas (Base, Create, Response)
- Weather record schemas (Base, Create, Response)
- Historical weather record schemas
- Weather query parameters validation

#### 4. `crud.py`
Database operations implementation.

**Key Functions:**
- Location management (create, read, delete)
- Weather record operations (create, read, update, delete)
- Historical weather record management
- Data export functionality
- Query filtering and pagination support

#### 5. `weather_api.py`
OpenWeather API integration.

**Key Features:**
- Current weather data retrieval
- Weather forecast fetching
- Historical weather data access
- Temperature unit conversion
- Error handling and retry logic

#### 6. `database.py`
Database configuration and session management.

**Features:**
- PostgreSQL connection setup
- Session management
- Environment variable configuration
- Database URL construction

## Environment Variables

Required environment variables:
- `POSTGRES_USER`: Database username
- `POSTGRES_PASSWORD`: Database password
- `POSTGRES_DB`: Database name
- `POSTGRES_HOST`: Database host
- `POSTGRES_PORT`: Database port
- `OPENWEATHER_API_KEY`: OpenWeather API key

## Database Schema

### Locations Table
- `id`: Primary key
- `city`: City name (indexed)
- `country`: Country code
- `latitude`: Geographic latitude
- `longitude`: Geographic longitude

### Weather Records Table
- `id`: Primary key
- `location_id`: Foreign key to locations
- `temperature`: Temperature in Celsius
- `humidity`: Humidity percentage
- `pressure`: Atmospheric pressure
- `description`: Weather description
- `timestamp`: Record timestamp

### Historical Weather Records Table
- Similar to Weather Records
- Additional `query_timestamp` field for historical reference

## Error Handling

- Custom exception handling for weather API errors
- Database transaction management
- Input validation errors
- HTTP error responses with descriptive messages

## Security Features

- CORS configuration for frontend integration
- Environment variable protection
- Input validation and sanitization
- Rate limiting support (via FastAPI)

## Docker Integration

The backend is containerized using Docker with the following configuration:

### Base Image
- Python 3.11 slim image for minimal container size
- Optimized for production use

### Container Configuration
- Working directory: `/app`
- Exposed port: 8000
- Uvicorn server with host binding to 0.0.0.0

### Build Process
1. Installs Python dependencies from requirements.txt
2. Copies application code into container
3. Sets up entry point using Uvicorn server

### Usage
```bash
# Build the image
docker build -t weather-app-backend .

# Run the container
docker run -p 8000:8000 \
  -e POSTGRES_USER=your_user \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=weather_db \
  -e POSTGRES_HOST=your_host \
  -e POSTGRES_PORT=5432 \
  -e OPENWEATHER_API_KEY=your_key \
  weather-app-backend
```

### Docker Compose Integration
The backend container is designed to work with Docker Compose, allowing:
- Automatic environment variable injection
- Network connectivity with the frontend and database containers
- Volume mounting for development
- Container orchestration and service dependency management

## Dependencies

Key dependencies (from requirements.txt):
- FastAPI 0.109.0
- SQLAlchemy 2.0.25
- Pydantic 2.5.3
- Uvicorn 0.27.0
- Python-dotenv 1.0.0
- Requests 2.31.0
- Psycopg2-binary 2.9.9
- Alembic 1.13.1

---
