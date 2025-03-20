#!/usr/bin/env python
"""
Test runner script for the mask generator application.
This script ensures Django settings are properly configured before running tests.
"""
import os
import sys
import django
from django.conf import settings
from django.test.utils import get_runner

if __name__ == "__main__":
    # Set up Django settings
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "mask_generator.settings")
    django.setup()
    
    # Get the test runner
    TestRunner = get_runner(settings)
    test_runner = TestRunner()
    
    # Run tests
    failures = test_runner.run_tests(["api.tests"])
    sys.exit(bool(failures))