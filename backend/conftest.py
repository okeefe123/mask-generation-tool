"""
Pytest configuration file for Django tests.

This file is automatically loaded by pytest before running tests.
It ensures Django is properly configured for testing.
"""
import os
import pytest
import django
from django.conf import settings
from django.core.management import call_command
from django.db import connection

# Set up Django before any tests are run
def pytest_configure(config):
    """Configure Django settings for pytest."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mask_generator.settings')
    django.setup()

# Add a django_db fixture to be used in tests that need database access
# Use class scope to match the TestCase classes in the tests
@pytest.fixture(scope='class')
def django_db_setup(django_db_blocker):
    """Configure the database for the test and apply migrations."""
    with django_db_blocker.unblock():
        # Instead of using migrate command which has conflicts,
        # we'll create the test database and apply migrations manually
        
        # Create tables for all apps
        call_command('migrate', 'contenttypes', interactive=False)
        call_command('migrate', 'auth', interactive=False)
        call_command('migrate', 'admin', interactive=False)
        call_command('migrate', 'sessions', interactive=False)
        
        # For our api app, we'll use a specific migration
        # This avoids the conflict between the two 0002 migrations
        call_command('migrate', 'api', '0001_initial', interactive=False)
        call_command('migrate', 'api', '0002_image_metadata_json', interactive=False)
        call_command('migrate', 'api', '0003_alter_image_file_alter_mask_file', interactive=False)