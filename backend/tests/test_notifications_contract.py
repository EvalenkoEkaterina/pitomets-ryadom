import os
import unittest
from unittest.mock import patch

from fastapi import HTTPException
from pydantic import ValidationError

from notifications.router import LocationRequest, Subscription, require_test_access


class ContractTests(unittest.TestCase):
    def test_location_validation(self):
        for latitude in (91, -91, float('nan')):
            with self.assertRaises(ValidationError):
                LocationRequest(endpoint='test', latitude=latitude, longitude=37)

    def test_test_sending_disabled_without_token(self):
        with patch.dict(os.environ, {"PUSH_TEST_TOKEN": ""}):
            with self.assertRaises(HTTPException) as error:
                require_test_access(None)
        self.assertEqual(error.exception.status_code, 404)

    def test_test_sending_requires_correct_token(self):
        with patch.dict(os.environ, {"PUSH_TEST_TOKEN": "test"}):
            with self.assertRaises(HTTPException) as error:
                require_test_access('wrong')
            self.assertEqual(error.exception.status_code, 403)
            require_test_access('test')

    def test_subscription_needs_pair_of_coordinates(self):
        with self.assertRaises(ValidationError):
            Subscription(endpoint='https://fcm.googleapis.com/test',
                         keys={'p256dh': 'test', 'auth': 'test'}, latitude=55)

    def test_cannot_use_local_server_as_push_endpoint(self):
        with self.assertRaises(ValidationError):
            Subscription(endpoint='https://127.0.0.1/test', keys={'p256dh': 'test', 'auth': 'test'})
