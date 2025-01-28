# schemas.py defines Pydantic models used for input validation and serialization

# In main.py, the schemas are used to validate input data (e.g., schemas.LocationCreate for creating locations)
# and to define the structure of data returned to the client (e.g., schemas.Location for returning location data)

from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional

# LocationBase: Defines the structure of location data
class LocationBase(BaseModel):
    city: str
    country: str
    latitude: float = Field(..., ge=-90, le=90) # Validation: Must be between -90 and 90 degrees
    longitude: float = Field(..., ge=-180, le=180) # Validation: Must be between -180 and 180 degrees

# LocationCreate: Used for creating new location records
class LocationCreate(LocationBase):
    pass

# Represents a location object returned to the client (response model)
class Location(LocationBase):
    id: int
    
    class Config:
        from_attributes = True

# WeatherRecordBase: Defines the structure of weather data
class WeatherRecordBase(BaseModel):
    temperature: float
    humidity: float = Field(..., ge=0, le=100) # Validation: Must be between 0 and 100
    pressure: float
    description: str
    icon: str = Field(default="01d")  # Default to clear sky day icon

# WeatherRecordCreate: Used for creating new weather records
class WeatherRecordCreate(WeatherRecordBase):
    location_id: int

# WeatherRecord: Represents a weather record returned to the client (response model)
class WeatherRecord(WeatherRecordBase):
    id: int
    location_id: int
    timestamp: datetime
    
    class Config:
        from_attributes = True

# WeatherRecordWithLocation: Combines weather record data with location details
class WeatherRecordWithLocation(WeatherRecord):
    location: Location
    
    class Config:
        from_attributes = True

# WeatherQuery: Defines the structure of query parameters for weather data
class WeatherQuery(BaseModel):
    city: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

# HistoricalWeatherRecord: Represents a historical weather record returned to the client
class HistoricalWeatherRecord(WeatherRecordBase):
    id: int
    location_id: int
    timestamp: datetime
    query_timestamp: datetime
    
    class Config:
        from_attributes = True

# HistoricalWeatherRecordCreate: Used for creating new historical weather records
class HistoricalWeatherRecordCreate(WeatherRecordBase):
    location_id: int
    query_timestamp: datetime
    timestamp: datetime

# HistoricalWeatherRecordWithLocation: Combines historical weather record data with location details
class HistoricalWeatherRecordWithLocation(HistoricalWeatherRecord):
    location: Location
    
    class Config:
        from_attributes = True

class WeatherRecordUpdate(BaseModel):
    temperature: float
    description: str

# ... rest of the existing code ... 