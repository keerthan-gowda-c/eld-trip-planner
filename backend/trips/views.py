from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import TripPlanRequestSerializer
from .services.eld_generator import generate_daily_logs
from .services.geocoding import GeocodingError, geocode_location
from .services.hos_planner import HOSPlanner
from .services.routing import RoutingError, get_route_leg


class TripPlanView(APIView):
    def post(self, request):
        serializer = TripPlanRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            current = geocode_location(data['current_location'])
            pickup = geocode_location(data['pickup_location'])
            dropoff = geocode_location(data['dropoff_location'])

            leg1 = get_route_leg(current, pickup, settings.AVG_SPEED_MPH)
            leg2 = get_route_leg(pickup, dropoff, settings.AVG_SPEED_MPH)

            planner = HOSPlanner(cycle_used_hours=data['current_cycle_used_hours'])
            plan = planner.plan_trip(leg1, leg2, data['current_cycle_used_hours'])

            daily_logs = generate_daily_logs(plan.events, data.get('driver_name', 'Driver'))

            route_geometry = leg1.geometry + leg2.geometry[1:]

            return Response({
                'summary': {
                    'total_miles': plan.total_miles,
                    'total_driving_hours': plan.total_driving_hours,
                    'estimated_cycle_used_hours': plan.cycle_used_hours,
                    'cycle_limit_hours': 70,
                    'legs': [
                        {
                            'from': current.display_name,
                            'to': pickup.display_name,
                            'distance_miles': leg1.distance_miles,
                            'duration_hours': leg1.duration_hours,
                        },
                        {
                            'from': pickup.display_name,
                            'to': dropoff.display_name,
                            'distance_miles': leg2.distance_miles,
                            'duration_hours': leg2.duration_hours,
                        },
                    ],
                },
                'locations': {
                    'current': {
                        'name': current.display_name,
                        'lat': current.lat,
                        'lng': current.lng,
                    },
                    'pickup': {
                        'name': pickup.display_name,
                        'lat': pickup.lat,
                        'lng': pickup.lng,
                    },
                    'dropoff': {
                        'name': dropoff.display_name,
                        'lat': dropoff.lat,
                        'lng': dropoff.lng,
                    },
                },
                'route': {
                    'geometry': route_geometry,
                    'stops': [
                        {
                            'name': stop.name,
                            'lat': stop.lat,
                            'lng': stop.lng,
                            'type': stop.event_type,
                            'time': stop.time.isoformat(),
                            'notes': stop.notes,
                        }
                        for stop in plan.stops
                    ],
                },
                'events': [
                    {
                        'status': event.status.value,
                        'start': event.start.isoformat(),
                        'end': event.end.isoformat(),
                        'location': event.location,
                        'notes': event.notes,
                        'miles': event.miles,
                    }
                    for event in plan.events
                ],
                'daily_logs': daily_logs,
            })

        except GeocodingError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except RoutingError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response(
                {'error': f'Trip planning failed: {exc}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class HealthView(APIView):
    def get(self, request):
        return Response({'status': 'ok'})
