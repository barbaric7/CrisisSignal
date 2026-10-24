from .base import Connector
from .firms import FirmsConnector
from .openmeteo_flood import FloodConnector
from .openmeteo_weather import WeatherConnector
from .sachet import SachetConnector
from .usgs import UsgsConnector

CONNECTORS: list[Connector] = [
    UsgsConnector(),
    FirmsConnector(),
    SachetConnector(),
    WeatherConnector(),
    FloodConnector(),
]