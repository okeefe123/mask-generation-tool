"""
Initialize Django settings for test discovery.
This ensures that Django settings are properly configured when tests
are discovered and run using both pytest and Python's standard unittest.
"""
import os
import sys
import django

# Only set up Django if it hasn't been set up already
# This prevents issues when tests are run with pytest (which uses pyproject.toml settings)
if 'DJANGO_SETTINGS_MODULE' not in os.environ:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mask_generator.settings')
    django.setup()