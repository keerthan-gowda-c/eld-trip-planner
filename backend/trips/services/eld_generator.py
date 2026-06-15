from datetime import datetime, time, timedelta

from .hos_planner import DutyStatus, TripEvent


STATUS_ROWS = {
    DutyStatus.OFF_DUTY: 0,
    DutyStatus.SLEEPER: 1,
    DutyStatus.DRIVING: 2,
    DutyStatus.ON_DUTY: 3,
}

STATUS_LABELS = ['Off Duty', 'Sleeper Berth', 'Driving', 'On Duty (Not Driving)']


def _event_to_day_portions(event: TripEvent) -> list[tuple[datetime, datetime, DutyStatus, str, str]]:
    """Split a multi-day event into per-calendar-day segments."""
    portions = []
    current = event.start
    while current < event.end:
        day_end = datetime.combine(current.date() + timedelta(days=1), time.min, tzinfo=current.tzinfo)
        if current.tzinfo is None:
            day_end = datetime.combine(current.date() + timedelta(days=1), time.min)
        segment_end = min(event.end, day_end)
        portions.append((current, segment_end, event.status, event.location, event.notes))
        current = segment_end
    return portions


def _minutes_since_midnight(dt: datetime) -> int:
    return dt.hour * 60 + dt.minute


def generate_daily_logs(events: list[TripEvent], driver_name: str = 'Driver') -> list[dict]:
    """Build FMCSA-style daily log sheet data from trip events."""
    day_segments: dict[str, list] = {}
    day_miles: dict[str, float] = {}

    for event in events:
        event_portions = _event_to_day_portions(event)
        for start, end, status, location, notes in _event_to_day_portions(event):
            day_key = start.date().isoformat()
            # Add miles for driving events
            if status == DutyStatus.DRIVING:
                portion_minutes = (end - start).total_seconds() / 60

                total_event_minutes = (
                    event.end - event.start
                ).total_seconds() / 60

                portion_miles = (
                    event.miles * portion_minutes / total_event_minutes
                    if total_event_minutes > 0
                    else 0
                )

                day_miles[day_key] = day_miles.get(day_key, 0) + portion_miles
            day_segments.setdefault(day_key, []).append({
                'status': status.value,
                'row': STATUS_ROWS[status],
                'start_minute': _minutes_since_midnight(start),
                'end_minute': _minutes_since_midnight(end) if end.date() == start.date() else 1440,
                'location': location,
                'notes': notes,
            })

    logs = []
    cumulative_miles = 0
    for day_key in sorted(day_segments.keys()):
        segments = sorted(day_segments[day_key], key=lambda s: s['start_minute'])
        remarks = []
        for seg in segments:
            if seg['notes']:
                remarks.append(f"{seg['notes']} @ {seg['location']}")

        # Calculate daily mileage from driving hours
        driving_hours = _sum_status_hours(
            segments,
            DutyStatus.DRIVING.value
        )

        today_miles = round(driving_hours * 50)  # 50 = average mph
        cumulative_miles += today_miles

        today_miles = round(day_miles.get(day_key, 0))
        cumulative_miles += today_miles
        logs.append({
            'date': day_key,
            'driver_name': driver_name,
            'miles_total': today_miles,
            'miles_driving': cumulative_miles,
            'status_labels': STATUS_LABELS,
            'segments': segments,
            'remarks': '; '.join(dict.fromkeys(remarks)),
            'total_hours': {
                'off_duty': _sum_status_hours(segments, DutyStatus.OFF_DUTY.value),
                'sleeper': _sum_status_hours(segments, DutyStatus.SLEEPER.value),
                'driving': _sum_status_hours(segments, DutyStatus.DRIVING.value),
                'on_duty': _sum_status_hours(segments, DutyStatus.ON_DUTY.value),
            },
            
        })

    return logs


def _sum_status_hours(segments: list[dict], status: str) -> float:
    total_minutes = 0
    for seg in segments:
        if seg['status'] == status:
            total_minutes += seg['end_minute'] - seg['start_minute']
    return round(total_minutes / 60, 2)
