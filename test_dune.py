#!/usr/bin/env python3
"""
Test script for Dune API using dune_client
Usage: python3 test_dune.py YOUR_API_KEY [QUERY_ID]
"""

import sys
import os
from dune_client.client import DuneClient

def test_dune_api(api_key: str, query_id: int = 5753743):
    """Test Dune API with given API key and query ID"""
    try:
        print(f"🔌 Connecting to Dune API...")
        print(f"📊 Query ID: {query_id}")
        print(f"🔑 API Key: {api_key[:10]}...{api_key[-4:] if len(api_key) > 14 else '***'}")
        print("-" * 50)
        
        # Initialize Dune client
        dune = DuneClient(api_key)
        
        # Get latest result
        print("📥 Fetching latest query result...")
        query_result = dune.get_latest_result(query_id)
        
        print("✅ Success! Query result received")
        print("-" * 50)
        
        # Display result summary
        if hasattr(query_result, 'result') and query_result.result:
            result = query_result.result
            if hasattr(result, 'rows'):
                print(f"📈 Rows returned: {len(result.rows)}")
                if result.rows:
                    print(f"\n📋 First row sample:")
                    print(result.rows[0])
                    print(f"\n📋 Column names:")
                    if result.rows:
                        print(list(result.rows[0].keys()))
            else:
                print(f"📊 Result: {result}")
        else:
            print(f"📊 Query result: {query_result}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    # Get API key from command line or environment
    if len(sys.argv) > 1:
        api_key = sys.argv[1]
    elif "DUNE_API_KEY" in os.environ:
        api_key = os.environ["DUNE_API_KEY"]
    else:
        print("❌ Error: API key not provided")
        print("Usage: python3 test_dune.py YOUR_API_KEY [QUERY_ID]")
        print("Or set DUNE_API_KEY environment variable")
        sys.exit(1)
    
    # Get query ID from command line or use default
    query_id = int(sys.argv[2]) if len(sys.argv) > 2 else 5753743
    
    # Test the API
    success = test_dune_api(api_key, query_id)
    sys.exit(0 if success else 1)

