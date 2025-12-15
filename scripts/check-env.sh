#!/bin/bash

# Bash script to check if .env variables are loaded

echo "Checking environment variables..."
echo ""

# Check if .env file exists
if [ -f .env ]; then
  echo "✓ .env file found"
  echo ""
  
  # Count variables in .env file
  var_count=0
  var_names=()
  
  while IFS='=' read -r key value || [ -n "$key" ]; do
    # Skip empty lines and comments
    [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]] && continue
    
    key=$(echo "$key" | xargs)
    var_names+=("$key")
    ((var_count++))
  done < .env
  
  echo "Variables in .env file ($var_count found):"
  while IFS='=' read -r key value || [ -n "$key" ]; do
    # Skip empty lines and comments
    [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]] && continue
    
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs)
    
    # Hide sensitive values
    if [[ "$key" == *"KEY"* ]] || [[ "$key" == *"SECRET"* ]] || [[ "$key" == *"PASSWORD"* ]]; then
      echo "  $key = ***hidden***"
    else
      echo "  $key = $value"
    fi
  done < .env
  echo ""
  
  # Check which variables are actually loaded
  echo "Variables loaded in environment:"
  loaded_count=0
  for var_name in "${var_names[@]}"; do
    if [ -n "${!var_name}" ]; then
      # Hide sensitive values
      if [[ "$var_name" == *"KEY"* ]] || [[ "$var_name" == *"SECRET"* ]] || [[ "$var_name" == *"PASSWORD"* ]]; then
        echo "  ✓ $var_name = ***hidden***"
      else
        echo "  ✓ $var_name = ${!var_name}"
      fi
      ((loaded_count++))
    else
      echo "  ✗ $var_name = (not loaded)"
    fi
  done
  echo ""
  echo "Summary: $loaded_count of $var_count variables are loaded in environment"
else
  echo "✗ .env file not found"
  echo ""
  echo "Please create a .env file in the project root."
fi

