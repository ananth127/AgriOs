from app.core.config import settings
from sqlalchemy import String

# Helper to support local SQLite (without SpatiaLite) and Production Postgres (with PostGIS)
def get_geo_column(shape_type: str, srid: int = 4326):
    """
    Returns a GeoAlchemy2 Geometry column if using Postgres,
    or a simple String column (for WKT) if using SQLite.
    """
    if "sqlite" in settings.DATABASE_URL:
        # SQLite fallback: Store geometry as WKT string
        # We ignore shape_type and srid args for the String column
        return String()
    else:
        # Postgres/PostGIS: Use real Spatial types
        from geoalchemy2 import Geometry
        return Geometry(shape_type, srid=srid)
