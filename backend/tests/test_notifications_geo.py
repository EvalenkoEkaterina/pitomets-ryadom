import unittest
from math import degrees

from notifications.geo import EARTH_RADIUS_M, distance_m, select_nearby


class RadiusTests(unittest.TestCase):
    def test_inside_outside_and_boundary(self):
        # На экваторе сдвиг по широте позволяет задать точное расстояние.
        rows = [
            {"endpoint": "inside", "latitude": degrees(999 / EARTH_RADIUS_M), "longitude": 0},
            {"endpoint": "boundary", "latitude": degrees(1000 / EARTH_RADIUS_M), "longitude": 0},
            {"endpoint": "outside", "latitude": degrees(1001 / EARTH_RADIUS_M), "longitude": 0},
            {"endpoint": "no-point", "latitude": None, "longitude": None},
        ]
        self.assertEqual([s["endpoint"] for s in select_nearby(rows, 0, 0)], ["inside", "boundary"])
        self.assertAlmostEqual(distance_m(0, 0, rows[1]["latitude"], 0), 1000)

    def test_across_date_line(self):
        self.assertLess(distance_m(0, 179.999, 0, -179.999), 1000)
