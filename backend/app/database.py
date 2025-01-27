# database.py: configures the database connection,
# sets up an ORM (Object-Relational Mapping) base,
# and provides a function for managing database sessions

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "postgres")
POSTGRES_DB = os.getenv("POSTGRES_DB", "weather_db")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")

# Constructs the connection string for PostgreSQL using the variables defined
# Format: postgresql://username:password@host:port/database
SQLALCHEMY_DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"

# Creates a SQLAlchemy engine for connecting to the PostgreSQL database.
# Used by SQLAlchemy to execute SQL commands and manage database interactions
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Used to create session objects, enabling interaction with the database
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine) 

# Base class for declarative models
# All models (e.g., Location, WeatherRecord) inherit from this Base class
# This links the ORM models to the database tables
Base = declarative_base()

# Provides a scoped database session for use in FastAPI endpoints
def get_db():
    # Create: Initializes a new database session using SessionLocal
    db = SessionLocal()
    try:
        # Yield: Yields the session for use by the calling function
        yield db
    finally:
        # Close: Ensures the session is closed after the function completes (even if an exception occurs)
        db.close() 