#!/bin/bash

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    exit 1
fi

# Load environment variables from .env
source .env

# Array of secrets to create
declare -a secrets=(
    "FIREBASE_API_KEY"
    "FIREBASE_AUTH_DOMAIN"
    "FIREBASE_PROJECT_ID"
    "FIREBASE_STORAGE_BUCKET"
    "FIREBASE_MESSAGING_SENDER_ID"
    "FIREBASE_APP_ID"
    "FIREBASE_MEASUREMENT_ID"
)

# Create each secret
for secret in "${secrets[@]}"; do
    if [ -n "${!secret}" ]; then
        echo "Setting $secret..."
        eas secret:create --scope project --name "$secret" --value "${!secret}" || {
            echo "Failed to set $secret"
            exit 1
        }
    else
        echo "Warning: $secret is not set in .env file"
    fi
done

echo "All secrets have been set!" 