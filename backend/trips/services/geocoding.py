import time
from dataclasses import dataclass

import requests


@dataclass
class GeoPoint:
    name: str
    lat: float
    lng: float
    display_name: str


class GeocodingError(Exception):
    pass


def geocode_location(query: str) -> GeoPoint:
    """Resolve a location string using OpenStreetMap Nominatim (free, no API key)."""
    response = requests.get(
        'https://nominatim.openstreetmap.org/search',
        params={
            'q': query,
            'format': 'json',
            'limit': 1,
            'countrycodes': 'us',
        },
        headers={'User-Agent': 'eld-trip-planner/1.0'},
        timeout=30,
    )
    response.raise_for_status()
    results = response.json()
    if not results:
        raise GeocodingError(f'Could not find location: {query}')

    result = results[0]
    time.sleep(1)  # Nominatim usage policy: max 1 request/second
    return GeoPoint(
        name=query,
        lat=float(result['lat']),
        lng=float(result['lon']),
        display_name=result.get('display_name', query),
    )
