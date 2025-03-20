# How to Run Tests for the Mask Generator Backend

This document explains different ways to run tests for the mask generator backend application.

## Using pytest (Recommended)

We're using pytest as our test runner with Django configuration defined in `pyproject.toml`.

To run all tests:
```
cd backend
uv run python -m pytest
```

To run a specific test file:
```
cd backend
uv run python -m pytest api/tests/models/test_image.py
```

To run tests with verbose output:
```
cd backend
uv run python -m pytest -v
```

## Using Django's test runner

You can also use Django's built-in test runner:

```
cd backend
uv run python manage.py test api
```

## Using the custom test runner script

For cases where there are issues with the Django settings configuration:

```
cd backend
uv run python run_tests.py
```

## Troubleshooting

If you encounter the error "ImproperlyConfigured: Requested settings, but settings are not configured", make sure you're:

1. Running the tests from the correct directory (usually from the backend directory)
2. Using one of the methods above that properly configures the Django settings
3. Have activated the correct virtual environment if you're not using uv

The `DJANGO_SETTINGS_MODULE` needs to be set to `mask_generator.settings` before running tests, which all of the above methods should handle automatically.