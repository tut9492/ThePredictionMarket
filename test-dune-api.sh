#!/bin/bash

# Test Dune API with your API key
# Usage: ./test-dune-api.sh YOUR_API_KEY

API_KEY=${1:-$DUNE_API_KEY}
QUERY_ID=${2:-5753743}

if [ -z "$API_KEY" ]; then
  echo "❌ Error: API key not provided"
  echo "Usage: ./test-dune-api.sh YOUR_API_KEY [QUERY_ID]"
  echo "Or set DUNE_API_KEY environment variable"
  exit 1
fi

echo "Testing Dune API with query ID: $QUERY_ID"
echo "----------------------------------------"

response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -H "X-Dune-API-Key:$API_KEY" "https://api.dune.com/api/v1/query/$QUERY_ID/results?limit=1000")

http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d':' -f2)
body=$(echo "$response" | sed '/HTTP_CODE:/d')

echo "HTTP Status: $http_code"
echo ""

if [ "$http_code" = "200" ]; then
  echo "✅ Success! Response:"
  echo "$body" | head -100
else
  echo "❌ Error! Response:"
  echo "$body"
fi

