#!/bin/bash
# Script to run tests and capture output to out.txt

# Set the Django settings module
export DJANGO_SETTINGS_MODULE=mask_generator.settings

# Change to the backend directory
cd "$(dirname "$0")/backend"

# Run the tests using pytest with uv and capture output
uv run python -m pytest -v > ../out.txt 2>&1

# Print a message
echo "Tests completed. Output saved to out.txt"

# Exit with the pytest exit code
exit ${PIPESTATUS[0]}