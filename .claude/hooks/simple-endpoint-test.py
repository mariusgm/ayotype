#!/usr/bin/env python3
"""
🔧 Simple Endpoint Testing Demo
=============================
Demonstrates endpoint testing without external dependencies.
"""

import json
import time
import sys
from urllib.request import urlopen, Request
from urllib.parse import urlencode
from urllib.error import URLError, HTTPError

# Colors
RED = '\033[0;31m'
GREEN = '\033[0;32m'
YELLOW = '\033[1;33m'
BLUE = '\033[0;34m'
CYAN = '\033[0;36m'
NC = '\033[0m'

def test_endpoint(name, url, method='GET', data=None, headers=None, expected_status=None):
    """Test a single endpoint"""
    print(f"\n{BLUE}🔍 Testing: {name}{NC}")
    print("-" * 40)
    
    try:
        start_time = time.time()
        
        # Prepare request
        if method == 'POST' and data:
            post_data = json.dumps(data).encode('utf-8')
            req = Request(url, data=post_data)
            req.add_header('Content-Type', 'application/json')
        else:
            req = Request(url)
            
        if headers:
            for key, value in headers.items():
                req.add_header(key, value)
                
        # Make request
        try:
            response = urlopen(req, timeout=10)
            status_code = response.getcode()
            response_time = (time.time() - start_time) * 1000
            
            # Read response
            content = response.read(1000).decode('utf-8', errors='ignore')
            
            # Check status
            if expected_status and status_code not in expected_status:
                print(f"{RED}❌ Status: {status_code} (expected {expected_status}){NC}")
                return False
            else:
                print(f"{GREEN}✅ Status: {status_code}{NC}")
                
            # Check response time
            if response_time < 1000:
                print(f"{GREEN}✅ Response Time: {response_time:.0f}ms{NC}")
            elif response_time < 3000:
                print(f"{YELLOW}⚠️  Response Time: {response_time:.0f}ms (slow){NC}")
            else:
                print(f"{RED}❌ Response Time: {response_time:.0f}ms (too slow){NC}")
                
            # Check content
            if method == 'POST' and 'api' in url:
                try:
                    json_data = json.loads(content)
                    if 'result' in json_data or 'error' in json_data:
                        print(f"{GREEN}✅ Response Format: Valid JSON{NC}")
                    else:
                        print(f"{YELLOW}⚠️  Response Format: Unexpected structure{NC}")
                except json.JSONDecodeError:
                    print(f"{YELLOW}⚠️  Response Format: Not JSON{NC}")
            else:
                if len(content) > 100:
                    print(f"{GREEN}✅ Content: Received {len(content)} characters{NC}")
                else:
                    print(f"{YELLOW}⚠️  Content: Short response ({len(content)} chars){NC}")
                    
            # Check headers
            headers_dict = dict(response.headers)
            if 'Content-Type' in headers_dict:
                content_type = headers_dict['Content-Type']
                print(f"{GREEN}✅ Content-Type: {content_type}{NC}")
            else:
                print(f"{YELLOW}⚠️  Missing Content-Type header{NC}")
                
            return True
            
        except HTTPError as e:
            status_code = e.code
            response_time = (time.time() - start_time) * 1000
            
            print(f"{RED}❌ HTTP Error: {status_code}{NC}")
            print(f"{YELLOW}Response Time: {response_time:.0f}ms{NC}")
            
            # For some endpoints, 404 might be expected
            if expected_status and status_code in expected_status:
                print(f"{GREEN}✅ Expected error status{NC}")
                return True
                
            return False
            
    except URLError as e:
        print(f"{RED}❌ Connection Error: {str(e)}{NC}")
        return False
    except Exception as e:
        print(f"{RED}❌ Test Error: {str(e)}{NC}")
        return False

def main():
    """Run endpoint testing demo"""
    print(f"{CYAN}🔧 ENDPOINT TESTING SYSTEM DEMO{NC}")
    print("=" * 50)
    
    base_url = "http://127.0.0.1:3000"
    
    # Test definitions
    tests = [
        {
            'name': 'Main Application Page',
            'url': f'{base_url}/',
            'method': 'GET',
            'expected_status': [200]
        },
        {
            'name': 'API Generate Endpoint',
            'url': f'{base_url}/api/generate',
            'method': 'POST',
            'data': {'words': 'test', 'mode': 'emoji', 'tone': 'fun'},
            'expected_status': [200, 400, 429]
        },
        {
            'name': 'Static Manifest File',
            'url': f'{base_url}/manifest.webmanifest',
            'method': 'GET',
            'expected_status': [200]
        },
        {
            'name': 'Service Worker',
            'url': f'{base_url}/sw.js',
            'method': 'GET',
            'expected_status': [200]
        },
        {
            'name': '404 Error Handling',
            'url': f'{base_url}/nonexistent-page',
            'method': 'GET',
            'expected_status': [404]
        },
        {
            'name': 'API Invalid Request',
            'url': f'{base_url}/api/generate',
            'method': 'POST',
            'data': {},  # Empty data should cause error
            'expected_status': [400]
        }
    ]
    
    # Run tests
    passed = 0
    total = len(tests)
    
    for test in tests:
        success = test_endpoint(
            test['name'],
            test['url'],
            test.get('method', 'GET'),
            test.get('data'),
            test.get('headers'),
            test.get('expected_status')
        )
        if success:
            passed += 1
            
    # Summary
    print(f"\n{CYAN}📊 ENDPOINT TESTING SUMMARY{NC}")
    print("=" * 50)
    print(f"Tests Passed: {passed}/{total}")
    
    if passed == total:
        print(f"\n{GREEN}🎉 ALL ENDPOINT TESTS PASSED!{NC}")
        print(f"{GREEN}✅ API endpoints are responding correctly{NC}")
    else:
        print(f"\n{YELLOW}⚠️  SOME ENDPOINT TESTS FAILED{NC}")
        print(f"{YELLOW}🔧 Review the output above for specific issues{NC}")
        
    # Security recommendations
    print(f"\n{CYAN}🔐 SECURITY RECOMMENDATIONS:{NC}")
    print("• Verify CORS headers are properly configured")
    print("• Ensure rate limiting is implemented")
    print("• Check for proper error message sanitization")
    print("• Validate input sanitization and validation")
    print("• Monitor for unusual response times or patterns")
    
    # Performance insights
    print(f"\n{CYAN}⚡ PERFORMANCE INSIGHTS:{NC}")
    print("• Monitor response times under load")
    print("• Implement caching for repeated requests")
    print("• Consider API response compression")
    print("• Set up performance monitoring and alerting")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)