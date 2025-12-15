#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
  # Count variables before loading
  var_count=0
  var_names=()
  
  # Load variables and track them
  while IFS='=' read -r key value || [ -n "$key" ]; do
    # Skip empty lines and comments
    [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]] && continue
    
    # Remove leading/trailing whitespace
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs)
    
    # Export the variable
    export "$key=$value"
    
    # Track variable name
    var_names+=("$key")
    ((var_count++))
  done < .env
  
  echo "✓ Loaded $var_count environment variable(s) from .env"
  echo "  Variables loaded:"
  for var_name in "${var_names[@]}"; do
    # Hide sensitive values
    if [[ "$var_name" == *"KEY"* ]] || [[ "$var_name" == *"SECRET"* ]] || [[ "$var_name" == *"PASSWORD"* ]]; then
      echo "    - $var_name = ***hidden***"
    else
      var_value=$(eval echo \$$var_name)
      echo "    - $var_name = $var_value"
    fi
  done
  echo ""
else
  echo "⚠ Warning: .env file not found"
  echo ""
fi

# Run Next.js dev server
npm run dev

