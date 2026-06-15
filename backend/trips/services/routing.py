from dataclasses import dataclass

import requests

from .geocoding import GeoPoint


@dataclass
class RouteLeg:
    from_point: GeoPoint
    to_point: GeoPoint
    distance_miles: float
    duration_hours: float
    geometry: list[list[float]]


class RoutingError(Exception):
    pass


def _decode_polyline(encoded: str) -> list[list[float]]:
    """Decode OSRM/Google-style polyline to [lat, lng] pairs."""
    coordinates: list[list[float]] = []
    index = 0
    lat = 0
    lng = 0

    while index < len(encoded):
        shift = 0
        result = 0
        while True:
            byte = ord(encoded[index]) - 63
            index += 1
            result |= (byte & 0x1F) << shift
            shift += 5
            if byte < 0x20:
                break
        delta_lat = ~(result >> 1) if (result & 1) else (result >> 1)
        lat += delta_lat

        shift = 0
        result = 0
        while True:
            byte = ord(encoded[index]) - 63
            index += 1
            result |= (byte & 0x1F) << shift
            shift += 5
            if byte < 0x20:
                break
        delta_lng = ~(result >> 1) if (result & 1) else (result >> 1)
        lng += delta_lng

        coordinates.append([lat / 1e5, lng / 1e5])

    return coordinates


def get_route_leg(origin: GeoPoint, destination: GeoPoint, avg_speed_mph: float) -> RouteLeg:
    """Fetch driving route using the free OSRM public API."""
    url = (
        'https://router.project-osrm.org/route/v1/driving/'
        f'{origin.lng},{origin.lat};{destination.lng},{destination.lat}'
    )
    response = requests.get(
        url,
        params={'overview': 'full', 'geometries': 'polyline'},
        timeout=30,
    )
    response.raise_for_status()
    data = response.json()

    if data.get('code') != 'Ok' or not data.get('routes'):
        raise RoutingError(
            f'No route found between {origin.name} and {destination.name}'
        )

    route = data['routes'][0]
    distance_miles = route['distance'] / 1609.34
    duration_hours = distance_miles / avg_speed_mph
    geometry = _decode_polyline(route['geometry'])

    return RouteLeg(
        from_point=origin,
        to_point=destination,
        distance_miles=round(distance_miles, 1),
        duration_hours=round(duration_hours, 2),
        geometry=geometry,
    )
