# weather_api.py: provides functions to interact with the OpenWeatherMap API
# to fetch current weather data and weather forecasts for a given city.

import requests
from dotenv import load_dotenv
import os
from typing import Dict, Any, Optional
from datetime import datetime

load_dotenv()

# NOTE: when using docker compose, OPENWEATHER_API_KEY is set in root/.env, NOT root/backend/.env
# This means a .env file with the key is also required in the root directory (same directory as docker-compose.yml)
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")
BASE_URL = "http://api.openweathermap.org/data/2.5"

# WeatherAPIException: Custom exception class for handling errors related to the weather API
class WeatherAPIException(Exception):
    pass

# kelvin_to_celsius: Converts temperature from Kelvin to Celsius
def kelvin_to_celsius(kelvin: float) -> float:
    return kelvin - 273.15

# get_current_weather: Fetches real-time weather data for coordinates
async def get_current_weather(city: str, lat: float = None, lon: float = None) -> Dict[str, Any]:
    """Fetch current weather data for given coordinates or city name."""
    try:
        params = {"appid": OPENWEATHER_API_KEY}
        
        # Use coordinates if provided, otherwise use city name
        if lat is not None and lon is not None:
            params.update({
                "lat": lat,
                "lon": lon
            })
        else:
            params["q"] = city

        response = requests.get(
            f"{BASE_URL}/weather",
            params=params
        )

        # Error handling: Checks if the HTTP response indicates an error (e.g., 404, 500).
        # If so, raises an exception
        response.raise_for_status()

        # Converts the JSON response into a Python dictionary
        data = response.json()
        
        # Extracts and transforms relevant weather data
        return {
            "temperature": kelvin_to_celsius(data["main"]["temp"]),
            "humidity": data["main"]["humidity"],
            "pressure": data["main"]["pressure"],
            "description": data["weather"][0]["description"],
            "icon": data["weather"][0]["icon"],
            "latitude": data["coord"]["lat"],
            "longitude": data["coord"]["lon"],
            "country": data["sys"]["country"]
        }
    except requests.RequestException as e:
        raise WeatherAPIException(f"Failed to fetch weather data: {str(e)}")

# get_weather_forecast: Fetches weather forecast for coordinates
async def get_weather_forecast(city: str, lat: float = None, lon: float = None, days: int = 5) -> list:
    """Fetch weather forecast for given coordinates or city name."""
    try:
        params = {"appid": OPENWEATHER_API_KEY}
        
        # Use coordinates if provided, otherwise use city name
        if lat is not None and lon is not None:
            params.update({
                "lat": lat,
                "lon": lon
            })
        else:
            params["q"] = city

        response = requests.get(
            f"{BASE_URL}/forecast",
            params=params
        )

        # Error handling: Checks if the HTTP response indicates an error (e.g., 404, 500).  
        # If so, raises an exception
        response.raise_for_status()

        # Converts the JSON response into a Python dictionary
        data = response.json()
        
        forecasts = []
        # Iterates through forecast data (data["list"]) for the specified number of days
        for item in data["list"][:days * 8]:  # 8 measurements per day
            # Extracts and converts key weather attributes
            forecasts.append({
                "temperature": kelvin_to_celsius(item["main"]["temp"]),
                "humidity": item["main"]["humidity"],
                "pressure": item["main"]["pressure"],
                "description": item["weather"][0]["description"],
                "icon": item["weather"][0]["icon"],
                "timestamp": datetime.fromtimestamp(item["dt"])
            })
        return forecasts
    except requests.RequestException as e:
        raise WeatherAPIException(f"Failed to fetch forecast data: {str(e)}")

# get_historical_weather: Fetches historical weather data for coordinates
async def get_historical_weather(city: str, timestamp: int, lat: float = None, lon: float = None) -> Dict[str, Any]:
    """Fetch historical weather data for given coordinates and timestamp."""
    try:
        if not OPENWEATHER_API_KEY:
            raise WeatherAPIException("OpenWeather API key not found")

        params = {
            "appid": OPENWEATHER_API_KEY,
            "dt": timestamp,
            "units": "metric"  # Use metric units directly instead of converting
        }
        
        # Use coordinates if provided, otherwise get coordinates from city name
        if lat is None or lon is None:
            # First get coordinates from city name using current weather endpoint
            city_data = await get_current_weather(city)
            lat = city_data["latitude"]
            lon = city_data["longitude"]
        
        params.update({
            "lat": lat,
            "lon": lon
        })

        response = requests.get(
            "https://api.openweathermap.org/data/3.0/onecall/timemachine",
            params=params
        )

        response.raise_for_status()
        data = response.json()
        
        if not data.get("data"):
            raise WeatherAPIException("No historical data available for the specified time")
            
        weather_data = data["data"][0]
        
        return {
            "temperature": weather_data["temp"],  # Already in Celsius due to units=metric
            "humidity": weather_data["humidity"],
            "pressure": weather_data["pressure"],
            "description": weather_data["weather"][0]["description"],
            "timestamp": datetime.fromtimestamp(weather_data["dt"]),
            "latitude": data["lat"],
            "longitude": data["lon"]
        }
    except requests.RequestException as e:
        raise WeatherAPIException(f"Failed to fetch historical weather data: {str(e)}") 