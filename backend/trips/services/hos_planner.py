from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

from django.conf import settings

from .routing import RouteLeg


class DutyStatus(str, Enum):
    OFF_DUTY = 'off_duty'
    SLEEPER = 'sleeper'
    DRIVING = 'driving'
    ON_DUTY = 'on_duty'


@dataclass
class TripEvent:
    status: DutyStatus
    start: datetime
    end: datetime
    location: str
    notes: str = ''
    miles: float = 0.0


@dataclass
class PlannedStop:
    name: str
    lat: float
    lng: float
    event_type: str
    time: datetime
    notes: str = ''


@dataclass
class TripPlan:
    events: list[TripEvent] = field(default_factory=list)
    stops: list[PlannedStop] = field(default_factory=list)
    total_miles: float = 0.0
    total_driving_hours: float = 0.0
    cycle_used_hours: float = 0.0


class HOSPlanner:
    """
    Property-carrying driver HOS planner.
    Rules: 11hr drive / 14hr window / 30min break after 8hr drive / 10hr off / 70hr/8-day.
    """

    MAX_DRIVE = 11.0
    MAX_WINDOW = 14.0
    BREAK_AFTER_DRIVE = 8.0
    BREAK_DURATION = 0.5
    REST_DURATION = 10.0
    MAX_CYCLE = 70.0
    CYCLE_DAYS = 8

    def __init__(self, cycle_used_hours: float, start_time: datetime | None = None):
        self.cycle_used = cycle_used_hours
        self.current_time = start_time or datetime.now().replace(minute=0, second=0, microsecond=0)
        self.events: list[TripEvent] = []
        self.stops: list[PlannedStop] = []
        self.shift_drive = 0.0
        self.shift_on_duty = 0.0
        self.drive_since_break = 0.0
        self.miles_since_fuel = 0.0
        self.total_miles = 0.0
        self.total_drive = 0.0

    def _add_event(
        self,
        status: DutyStatus,
        hours: float,
        location: str,
        notes: str = '',
        miles: float = 0.0,
    ) -> None:
        if hours <= 0:
            return
        start = self.current_time
        end = start + timedelta(hours=hours)
        self.events.append(
            TripEvent(
                status=status,
                start=start,
                end=end,
                location=location,
                notes=notes,
                miles=round(miles, 1),
            )
        )
        self.current_time = end

        if status == DutyStatus.DRIVING:
            self.shift_drive += hours
            self.shift_on_duty += hours
            self.drive_since_break += hours
            self.total_drive += hours
            self.total_miles += miles
            self.miles_since_fuel += miles
            self.cycle_used += hours
        elif status == DutyStatus.ON_DUTY:
            self.shift_on_duty += hours
            self.cycle_used += hours

    def _record_stop(self, lat: float, lng: float, location: str, event_type: str, notes: str) -> None:
        self.stops.append(
            PlannedStop(
                name=location,
                lat=lat,
                lng=lng,
                event_type=event_type,
                time=self.current_time,
                notes=notes,
            )
        )

    def _needs_rest(self) -> bool:
        return self.shift_drive >= self.MAX_DRIVE or self.shift_on_duty >= self.MAX_WINDOW

    def _take_rest(self, location: str, lat: float, lng: float) -> None:
        self._record_stop(lat, lng, location, 'rest', f'{self.REST_DURATION}hr sleeper berth')
        self._add_event(DutyStatus.SLEEPER, self.REST_DURATION, location, '10-hour off-duty rest')
        self.shift_drive = 0.0
        self.shift_on_duty = 0.0
        self.drive_since_break = 0.0

    def _take_break(self, location: str, lat: float, lng: float) -> None:
        self._record_stop(lat, lng, location, 'break', '30-minute break (8hr driving rule)')
        self._add_event(DutyStatus.OFF_DUTY, self.BREAK_DURATION, location, '30-minute break')
        self.drive_since_break = 0.0

    def _maybe_fuel(self, location: str, lat: float, lng: float) -> None:
        interval = settings.FUEL_INTERVAL_MILES
        if self.miles_since_fuel >= interval:
            self._record_stop(lat, lng, location, 'fuel', f'Fuel stop (~every {interval} mi)')
            self._add_event(
                DutyStatus.ON_DUTY,
                settings.FUEL_STOP_DURATION_HOURS,
                location,
                'Fueling',
            )
            self.miles_since_fuel = 0.0

    def _drive_segment(
        self,
        hours_needed: float,
        miles_needed: float,
        location: str,
        lat: float,
        lng: float,
        label: str,
    ) -> None:
        remaining_hours = hours_needed
        remaining_miles = miles_needed

        while remaining_hours > 0.01:
            if self._needs_rest():
                self._take_rest(location, lat, lng)

            if self.drive_since_break >= self.BREAK_AFTER_DRIVE:
                self._take_break(location, lat, lng)

            drive_left_in_shift = self.MAX_DRIVE - self.shift_drive
            window_left = self.MAX_WINDOW - self.shift_on_duty
            chunk = min(remaining_hours, drive_left_in_shift, window_left)

            if chunk <= 0.01:
                self._take_rest(location, lat, lng)
                continue

            ratio = chunk / hours_needed if hours_needed else 1
            chunk_miles = remaining_miles * ratio

            self._add_event(
                DutyStatus.DRIVING,
                chunk,
                location,
                label,
                miles=chunk_miles,
            )
            self._maybe_fuel(location, lat, lng)

            remaining_hours -= chunk
            remaining_miles -= chunk_miles

    def _on_duty_activity(
        self,
        hours: float,
        location: str,
        lat: float,
        lng: float,
        activity: str,
        stop_type: str,
    ) -> None:
        if self._needs_rest():
            self._take_rest(location, lat, lng)

        self._record_stop(lat, lng, location, stop_type, activity)
        self._add_event(DutyStatus.ON_DUTY, hours, location, activity)

    def plan_trip(
        self,
        leg1: RouteLeg,
        leg2: RouteLeg,
        cycle_used_hours: float,
    ) -> TripPlan:
        self._drive_segment(
            leg1.duration_hours,
            leg1.distance_miles,
            leg1.to_point.display_name,
            leg1.to_point.lat,
            leg1.to_point.lng,
            f'Drive to pickup: {leg1.from_point.name} → {leg1.to_point.name}',
        )

        self._on_duty_activity(
            settings.PICKUP_DURATION_HOURS,
            leg1.to_point.display_name,
            leg1.to_point.lat,
            leg1.to_point.lng,
            'Pickup loading (1 hour)',
            'pickup',
        )

        self._drive_segment(
            leg2.duration_hours,
            leg2.distance_miles,
            leg2.to_point.display_name,
            leg2.to_point.lat,
            leg2.to_point.lng,
            f'Drive to dropoff: {leg2.from_point.name} → {leg2.to_point.name}',
        )

        self._on_duty_activity(
            settings.DROPOFF_DURATION_HOURS,
            leg2.to_point.display_name,
            leg2.to_point.lat,
            leg2.to_point.lng,
            'Dropoff unloading (1 hour)',
            'dropoff',
        )

        return TripPlan(
            events=self.events,
            stops=self.stops,
            total_miles=round(leg1.distance_miles + leg2.distance_miles, 1),
            total_driving_hours=round(self.total_drive, 2),
            cycle_used_hours=round(cycle_used_hours + self.total_drive, 2),
        )
