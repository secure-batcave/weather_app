from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from . import crud, models, schemas, weather_api
from .database import engine, get_db
import json

# This line creates all the tables in the database
models.Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(title="Weather App API")

# Configure CORS (Cross-Origin Resource Sharing)
# CORS is a security feature that allows or restricts resources on a web page to be requested from another domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Endpoint to create a new location
@app.post("/locations/", response_model=schemas.Location)
async def create_location(location: schemas.LocationCreate, db: Session = Depends(get_db)):
    db_location = crud.get_location_by_city(db, city=location.city)
    if db_location:
        raise HTTPException(status_code=400, detail="City already registered")
    return crud.create_location(db=db, location=location)

# Endpoint to get all locations
@app.get("/locations/", response_model=List[schemas.Location])
def read_locations(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    locations = crud.get_locations(db, skip=skip, limit=limit)
    return locations

# Endpoint to get current weather for a city
@app.get("/weather/current/{city}")
async def get_current_weather(
    city: str,
    lat: Optional[float] = Query(None, description="Latitude of the location"),
    lon: Optional[float] = Query(None, description="Longitude of the location"),
    db: Session = Depends(get_db)
):
    try:
        weather_data = await weather_api.get_current_weather(city, lat, lon)
        
        # Create or update location
        location = crud.get_location_by_city(db, city, weather_data["country"])
        if not location:
            location = crud.create_location(db, schemas.LocationCreate(
                city=city,
                country=weather_data["country"],
                latitude=weather_data["latitude"],
                longitude=weather_data["longitude"]
            ))
        
        # Check for existing weather record in the last minute to prevent duplicates
        existing_record = db.query(models.WeatherRecord).filter(
            models.WeatherRecord.location_id == location.id,
            models.WeatherRecord.timestamp >= datetime.utcnow() - timedelta(minutes=1)
        ).first()
        
        if not existing_record:
            # Create weather record only if no recent record exists
            weather_record = crud.create_weather_record(db, schemas.WeatherRecordCreate(
                location_id=location.id,
                temperature=weather_data["temperature"],
                humidity=weather_data["humidity"],
                pressure=weather_data["pressure"],
                description=weather_data["description"],
                icon=weather_data["icon"]
            ))
        
        return weather_data
    except weather_api.WeatherAPIException as e:
        raise HTTPException(status_code=503, detail=str(e))

# Endpoint to get weather forecast for a city
@app.get("/weather/forecast/{city}")
async def get_weather_forecast(
    city: str,
    lat: Optional[float] = Query(None, description="Latitude of the location"),
    lon: Optional[float] = Query(None, description="Longitude of the location"),
    days: int = Query(5, ge=1, le=5)
):
    try:
        return await weather_api.get_weather_forecast(city, lat, lon, days)
    except weather_api.WeatherAPIException as e:
        raise HTTPException(status_code=503, detail=str(e))

# Endpoint to get weather history for a city
@app.get("/weather/past_searches/{city}", response_model=List[schemas.WeatherRecord])
def read_weather_records(
    city: str,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    records = crud.get_weather_records(
        db,
        city=city,
        start_date=start_date,
        end_date=end_date,
        skip=skip,
        limit=limit
    )
    return records

# Endpoint to update weather record
@app.put("/weather/{record_id}", response_model=schemas.WeatherRecord)
def update_weather(record_id: int, weather: schemas.WeatherRecordUpdate, db: Session = Depends(get_db)):
    # Get existing record
    db_weather = db.query(models.WeatherRecord).filter(models.WeatherRecord.id == record_id).first()
    if db_weather is None:
        raise HTTPException(status_code=404, detail="Weather record not found")
    
    # Update only temperature and description
    db_weather.temperature = weather.temperature
    db_weather.description = weather.description
    db.commit()
    db.refresh(db_weather)
    return db_weather

# Endpoint to delete weather record
@app.delete("/weather/{record_id}")
def delete_weather(record_id: int, db: Session = Depends(get_db)):
    db_weather = crud.delete_weather_record(db, record_id)
    if db_weather is None:
        raise HTTPException(status_code=404, detail="Weather record not found")
    return {"message": "Weather record deleted successfully"}

# Endpoint to export weather data for a city
@app.get("/export/{city}")
def export_data(city: str, db: Session = Depends(get_db)):
    data = crud.export_weather_data(db, city)
    return data

# Endpoint to get historical weather for a city and timestamp
@app.get("/weather/historical/{city}", response_model=schemas.HistoricalWeatherRecord)
async def get_historical_weather(
    city: str,
    timestamp: int = Query(..., description="Unix timestamp for the historical data"),
    lat: Optional[float] = Query(None, description="Latitude of the location"),
    lon: Optional[float] = Query(None, description="Longitude of the location"),
    db: Session = Depends(get_db)
):
    try:
        # First get city data to ensure we have country info
        city_data = await weather_api.get_current_weather(city, lat, lon)
        
        # Then get the historical weather data
        weather_data = await weather_api.get_historical_weather(city, timestamp, city_data["latitude"], city_data["longitude"])
        
        # Create or update location with proper country data
        location = crud.get_location_by_city(db, city, city_data["country"])
        if not location:
            location = crud.create_location(db, schemas.LocationCreate(
                city=city,
                country=city_data["country"],
                latitude=city_data["latitude"],
                longitude=city_data["longitude"]
            ))
        
        # Store the historical record
        historical_record = crud.create_historical_weather_record(db, schemas.HistoricalWeatherRecordCreate(
            location_id=location.id,
            temperature=weather_data["temperature"],
            humidity=weather_data["humidity"],
            pressure=weather_data["pressure"],
            description=weather_data["description"],
            icon=weather_data["icon"],
            query_timestamp=datetime.fromtimestamp(timestamp),
            timestamp=datetime.utcnow()
        ))
        
        return historical_record
    except weather_api.WeatherAPIException as e:
        raise HTTPException(status_code=503, detail=str(e))

# Endpoint to delete location and all associated records
@app.delete("/locations/{location_id}")
def delete_location(location_id: int, db: Session = Depends(get_db)):
    db_location = crud.delete_location(db, location_id)
    if db_location is None:
        raise HTTPException(status_code=404, detail="Location not found")
    return {"message": "Location and associated records deleted successfully"}

# Endpoint to get all historical weather records for a city
@app.get("/historical-weather/{city}", response_model=List[schemas.HistoricalWeatherRecord])
def read_historical_weather_records(
    city: str,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    records = crud.get_historical_weather_records(
        db,
        city=city,
        start_date=start_date,
        end_date=end_date,
        skip=skip,
        limit=limit
    )
    return records

# Endpoint to update historical weather record
@app.put("/historical-weather/{record_id}", response_model=schemas.HistoricalWeatherRecord)
def update_historical_weather(record_id: int, weather: schemas.WeatherRecordUpdate, db: Session = Depends(get_db)):
    # Get existing record
    db_weather = db.query(models.HistoricalWeatherRecord).filter(models.HistoricalWeatherRecord.id == record_id).first()
    if db_weather is None:
        raise HTTPException(status_code=404, detail="Historical weather record not found")
    
    # Update only temperature and description
    db_weather.temperature = weather.temperature
    db_weather.description = weather.description
    db.commit()
    db.refresh(db_weather)
    return db_weather
