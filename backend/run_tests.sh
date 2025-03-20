#!/bin/bash
# Script to run tests for the mask generator backend

# Set the Django settings module
export DJANGO_SETTINGS_MODULE=mask_generator.settings

# Change to the backend directory if not already there
cd "$(dirname "$0")"

# Run the tests using pytest with uv
uv run python -m pytest "$@"

# Exit with the pytest exit code
exit $?