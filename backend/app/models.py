# models.py defines the database structure and relationships
# to enable the application to handle locations and their weather data efficiently

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

# Location Model: represents unique geographic locations
# with fields like city, country, latitude, and longitude.
class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    city = Column(String, index=True)
    country = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)

    # Location.weather_records: Allows you to access all weather records for a given location
    weather_records = relationship("WeatherRecord", back_populates="location", cascade="all, delete-orphan")
    # Location.historical_records: Allows you to access all historical weather records
    historical_records = relationship("HistoricalWeatherRecord", back_populates="location", cascade="all, delete-orphan")
    # Cascade behavior: When a Location is deleted, all associated WeatherRecord rows are automatically deleted 
    # to maintain data integrity and avoid orphaned records.


# WeatherRecord Model: Stores weather data
# linked to specific locations via the location_id foreign key.
# A location can have multiple weather records (one-to-many relationship)
class WeatherRecord(Base):
    __tablename__ = "weather_records"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"))
    temperature = Column(Float)
    humidity = Column(Float)
    pressure = Column(Float)
    description = Column(String)
    icon = Column(String, default="01d")  # Default to clear sky day icon
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # WeatherRecord.location: Allows you to access the location details for a given weather record
    location = relationship("Location", back_populates="weather_records") 


# HistoricalWeatherRecord Model: Stores historical weather data
# linked to specific locations via the location_id foreign key.
class HistoricalWeatherRecord(Base):
    __tablename__ = "historical_weather_records"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"))
    temperature = Column(Float)
    humidity = Column(Float)
    pressure = Column(Float)
    description = Column(String)
    icon = Column(String, default="01d")  # Default to clear sky day icon
    timestamp = Column(DateTime, default=datetime.utcnow)
    query_timestamp = Column(DateTime)  # When the historical data was queried for
    
    # HistoricalWeatherRecord.location: Allows you to access the location details
    location = relationship("Location", back_populates="historical_records") 