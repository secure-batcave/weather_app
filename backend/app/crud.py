# crud.py: provides the CRUD (Create, Read, Update, Delete) operations and query logic
# for interacting with the database.

# Utilizes SQLAlchemy to query, create, update, and delete records
# from the database tables (Location and WeatherRecord).

from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime
from typing import List, Optional
from . import models, schemas

# get_location: Fetches a location by its unique ID
def get_location(db: Session, location_id: int):
    return db.query(models.Location).filter(models.Location.id == location_id).first()

# get_location_by_city: Fetches a location by its city name and country
def get_location_by_city(db: Session, city: str, country: str = None):
    query = db.query(models.Location).filter(
        models.Location.city.ilike(city)  # Case-insensitive comparison
    )
    if country:
        query = query.filter(models.Location.country == country)
    return query.first()

# get_locations: Fetches all locations with optional pagination
def get_locations(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Location).offset(skip).limit(limit).all()

# create_location: Creates a new location record in the database
def create_location(db: Session, location: schemas.LocationCreate):

    # Converts the Pydantic schema (location) to a SQLAlchemy model using model_dump()
    db_location = models.Location(**location.model_dump())

    # Adds the new Location to the session, commits the transaction,
    # and refreshes the object to update its attributes (like id)
    db.add(db_location)
    db.commit()
    db.refresh(db_location)
    return db_location

# get_weather_records: Fetches weather records with optional filtering by city, date range, and pagination
def get_weather_records(
    db: Session,
    city: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 100
):
    # Initializes a query for WeatherRecord objects
    query = db.query(models.WeatherRecord)
    
    # Filters the query based on the provided city, start date, and end date
    if city:
        query = query.join(models.Location).filter(models.Location.city == city)
    if start_date:
        query = query.filter(models.WeatherRecord.timestamp >= start_date)
    if end_date:
        query = query.filter(models.WeatherRecord.timestamp <= end_date)
    
    return query.offset(skip).limit(limit).all()

# create_weather_record: Creates a new weather record in the database
def create_weather_record(db: Session, weather: schemas.WeatherRecordCreate):

    # Converts the Pydantic schema (weather) to a SQLAlchemy model using model_dump()
    db_weather = models.WeatherRecord(**weather.model_dump())

    # Adds the new WeatherRecord to the session, commits the transaction,
    # and refreshes the object
    db.add(db_weather)
    db.commit()
    db.refresh(db_weather)
    return db_weather

# update_weather_record: Updates an existing weather record in the database
def update_weather_record(db: Session, record_id: int, weather: schemas.WeatherRecordCreate):
    db_weather = db.query(models.WeatherRecord).filter(models.WeatherRecord.id == record_id).first()
    if db_weather:
        for key, value in weather.model_dump().items():
            setattr(db_weather, key, value)
        db.commit()
        db.refresh(db_weather)
    return db_weather

# delete_weather_record: Deletes an existing weather record from the database
def delete_weather_record(db: Session, record_id: int):
    db_weather = db.query(models.WeatherRecord).filter(models.WeatherRecord.id == record_id).first()
    if db_weather:
        db.delete(db_weather)
        db.commit()
    return db_weather

# export_weather_data: Exports weather data as a list of dictionaries
def export_weather_data(db: Session, city: Optional[str] = None) -> List[dict]:

    # Joins the WeatherRecord and Location tables
    query = db.query(models.WeatherRecord).join(models.Location)

    # Filters by city if specified
    if city:
        query = query.filter(models.Location.city == city)
    
    # Converts the records into a dictionary format suitable for JSON serialization
    records = query.all()
    return [
        {
            "id": record.id,
            "city": record.location.city,
            "country": record.location.country,
            "temperature": record.temperature,
            "humidity": record.humidity,
            "pressure": record.pressure,
            "description": record.description,
            "timestamp": record.timestamp.isoformat()
        }
        for record in records
    ]

# get_historical_weather_records: Fetches historical weather records with optional filtering
def get_historical_weather_records(
    db: Session,
    city: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 100
):
    query = db.query(models.HistoricalWeatherRecord)
    
    if city:
        query = query.join(models.Location).filter(models.Location.city == city)
    if start_date:
        query = query.filter(models.HistoricalWeatherRecord.query_timestamp >= start_date)
    if end_date:
        query = query.filter(models.HistoricalWeatherRecord.query_timestamp <= end_date)
    
    return query.offset(skip).limit(limit).all()

# create_historical_weather_record: Creates a new historical weather record
def create_historical_weather_record(db: Session, weather: schemas.HistoricalWeatherRecordCreate):
    # Check for existing record with the same location_id and query_timestamp
    existing_record = db.query(models.HistoricalWeatherRecord).filter(
        models.HistoricalWeatherRecord.location_id == weather.location_id,
        models.HistoricalWeatherRecord.query_timestamp == weather.query_timestamp
    ).first()
    
    if existing_record:
        # If record exists, return it without creating a duplicate
        return existing_record
    
    # If no existing record, create a new one
    db_weather = models.HistoricalWeatherRecord(**weather.model_dump())
    db.add(db_weather)
    db.commit()
    db.refresh(db_weather)
    return db_weather

# update_historical_weather_record: Updates an existing historical weather record
def update_historical_weather_record(db: Session, record_id: int, weather: schemas.HistoricalWeatherRecordCreate):
    db_weather = db.query(models.HistoricalWeatherRecord).filter(models.HistoricalWeatherRecord.id == record_id).first()
    if db_weather:
        for key, value in weather.model_dump().items():
            setattr(db_weather, key, value)
        db.commit()
        db.refresh(db_weather)
    return db_weather

# delete_historical_weather_record: Deletes an existing historical weather record
def delete_historical_weather_record(db: Session, record_id: int):
    db_weather = db.query(models.HistoricalWeatherRecord).filter(models.HistoricalWeatherRecord.id == record_id).first()
    if db_weather:
        db.delete(db_weather)
        db.commit()
    return db_weather

# delete_location: Deletes a location and all associated weather records (cascade)
def delete_location(db: Session, location_id: int):
    db_location = db.query(models.Location).filter(models.Location.id == location_id).first()
    if db_location:
        db.delete(db_location)
        db.commit()
    return db_location 