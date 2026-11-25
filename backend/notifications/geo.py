from math import asin, cos, radians, sin, sqrt

EARTH_RADIUS_M = 6_371_000


def distance_m(latitude1, longitude1, latitude2, longitude2):
    """Расстояние по поверхности Земли в метрах (формула гаверсинусов)."""
    lat1, lat2 = radians(latitude1), radians(latitude2)
    dlat = lat2 - lat1
    dlon = radians(longitude2 - longitude1)
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return 2 * EARTH_RADIUS_M * asin(sqrt(min(1, max(0, a))))


def select_nearby(subscriptions, latitude, longitude, radius_m=1000):
    result = []
    for subscription in subscriptions:
        lat = subscription.get("latitude")
        lon = subscription.get("longitude")
        if lat is None or lon is None:
            continue
        # Микрометр допуска нужен только для округления чисел на границе.
        if distance_m(latitude, longitude, lat, lon) <= radius_m + 0.000001:
            result.append(subscription)
    return result
