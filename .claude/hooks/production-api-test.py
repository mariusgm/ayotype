#!/usr/bin/env python3
"""
🚀 Production API Testing Script
==============================
Tests API endpoints in both development and production environments
to ensure functionality works across all deployment scenarios.
"""

import json
import time
import sys
import os
from urllib.request import urlopen, Request
from urllib.parse import urlencode
from urllib.error import URLError, HTTPError

# Colors
RED = '\033[0;31m'
GREEN = '\033[0;32m'
YELLOW = '\033[1;33m'
BLUE = '\033[0;34m'
CYAN = '\033[0;36m'
MAGENTA = '\033[0;35m'
NC = '\033[0m'

class ProductionAPITester:
    def __init__(self):
        self.localhost_url = "http://127.0.0.1:3000"
        self.production_urls = [
            "https://emojifusion.vercel.app",
            "https://ayotype.com",
            # Add more production URLs as needed
        ]
        self.test_payloads = [
            {
                "name": "Basic Test",
                "data": {"words": "coffee morning", "mode": "emoji", "tone": "cute", "lines": 1}
            },
            {
                "name": "ASCII Multi-line Test", 
                "data": {"words": "space cat", "mode": "ascii", "tone": "cool", "lines": 2}
            },
            {
                "name": "Both Mode Test",
                "data": {"words": "neon cyber", "mode": "both", "tone": "chaotic", "lines": 1}
            },
            {
                "name": "Edge Case Test",
                "data": {"words": "café münchën 2024", "mode": "emoji", "tone": "aesthetic", "lines": 2}
            }
        ]
        
    def test_api_endpoint(self, base_url, test_case):
        """Test a single API endpoint with given payload"""
        url = f"{base_url}/api/generate"
        
        try:
            start_time = time.time()
            
            # Prepare request
            post_data = json.dumps(test_case["data"]).encode('utf-8')
            req = Request(url, data=post_data)
            req.add_header('Content-Type', 'application/json')
            req.add_header('User-Agent', 'EmojiFusion-ProductionTest/1.0')
            
            # Make request
            response = urlopen(req, timeout=15)
            response_time = time.time() - start_time
            status_code = response.getcode()
            
            # Read and parse response
            response_text = response.read().decode('utf-8')
            response_data = json.loads(response_text)
            
            # Validate response structure
            errors = []
            warnings = []
            
            # Check status code
            if status_code != 200:
                errors.append(f"Unexpected status code: {status_code}")
                
            # Check response time
            if response_time > 5.0:
                warnings.append(f"Slow response: {response_time:.2f}s")
            elif response_time > 10.0:
                errors.append(f"Very slow response: {response_time:.2f}s")
                
            # Validate JSON structure
            if not isinstance(response_data, dict):
                errors.append("Response is not a JSON object")
            else:
                # Check for expected fields
                if "meta" not in response_data:
                    errors.append("Missing 'meta' field in response")
                    
                if "emoji" not in response_data and "ascii" not in response_data:
                    errors.append("Missing 'emoji' or 'ascii' fields in response")
                    
                # Check combo count
                combo_count = 0
                if "emoji" in response_data and isinstance(response_data["emoji"], list):
                    combo_count += len(response_data["emoji"])
                if "ascii" in response_data and isinstance(response_data["ascii"], list):
                    combo_count += len(response_data["ascii"])
                    
                if combo_count == 0:
                    errors.append("No combos returned")
                elif combo_count < 3:
                    warnings.append(f"Low combo count: {combo_count}")
                    
                # Validate combo structure
                for combo_type in ["emoji", "ascii"]:
                    if combo_type in response_data and isinstance(response_data[combo_type], list):
                        for i, combo in enumerate(response_data[combo_type]):
                            if not isinstance(combo, dict):
                                errors.append(f"{combo_type}[{i}] is not an object")
                            elif "combo" not in combo or "name" not in combo:
                                errors.append(f"{combo_type}[{i}] missing combo or name field")
                                
            return {
                "success": len(errors) == 0,
                "status_code": status_code,
                "response_time": response_time,
                "errors": errors,
                "warnings": warnings,
                "response_data": response_data
            }
            
        except HTTPError as e:
            if e.code == 500:
                return {
                    "success": False,
                    "status_code": e.code,
                    "response_time": 0,
                    "errors": [f"Server error (500) - likely LLM not configured"],
                    "warnings": [],
                    "response_data": None
                }
            else:
                return {
                    "success": False,
                    "status_code": e.code,
                    "response_time": 0,
                    "errors": [f"HTTP Error: {e.code}"],
                    "warnings": [],
                    "response_data": None
                }
        except URLError as e:
            return {
                "success": False,
                "status_code": 0,
                "response_time": 0,
                "errors": [f"Connection error: {str(e)}"],
                "warnings": [],
                "response_data": None
            }
        except json.JSONDecodeError:
            return {
                "success": False,
                "status_code": 0,
                "response_time": 0,
                "errors": ["Invalid JSON response"],
                "warnings": [],
                "response_data": None
            }
        except Exception as e:
            return {
                "success": False,
                "status_code": 0,
                "response_time": 0,
                "errors": [f"Unexpected error: {str(e)}"],
                "warnings": [],
                "response_data": None
            }
            
    def test_environment(self, base_url, env_name):
        """Test all scenarios against a single environment"""
        print(f"\n{CYAN}🔍 Testing {env_name}: {base_url}{NC}")
        print("─" * 60)
        
        env_results = {
            "environment": env_name,
            "url": base_url,
            "tests": [],
            "total_tests": 0,
            "passed_tests": 0,
            "failed_tests": 0,
            "warnings": 0
        }
        
        for test_case in self.test_payloads:
            print(f"\n{BLUE}📋 {test_case['name']}{NC}")
            
            result = self.test_api_endpoint(base_url, test_case)
            result["test_name"] = test_case["name"]
            env_results["tests"].append(result)
            env_results["total_tests"] += 1
            
            if result["success"]:
                print(f"{GREEN}✅ PASSED{NC} - {result['response_time']:.2f}s")
                env_results["passed_tests"] += 1
            else:
                print(f"{RED}❌ FAILED{NC}")
                env_results["failed_tests"] += 1
                
            # Show errors
            for error in result["errors"]:
                print(f"  {RED}Error: {error}{NC}")
                
            # Show warnings
            for warning in result["warnings"]:
                print(f"  {YELLOW}Warning: {warning}{NC}")
                env_results["warnings"] += 1
                
        return env_results
        
    def check_server_availability(self, url):
        """Check if a server is available"""
        try:
            response = urlopen(f"{url}/", timeout=5)
            return response.getcode() == 200
        except:
            return False
            
    def run_comprehensive_test(self):
        """Run tests against all environments"""
        print(f"{CYAN}🚀 PRODUCTION API TESTING SUITE{NC}")
        print("═" * 60)
        
        all_results = []
        
        # Test localhost (development)
        if self.check_server_availability(self.localhost_url):
            dev_results = self.test_environment(self.localhost_url, "Development (Localhost)")
            all_results.append(dev_results)
        else:
            print(f"\n{YELLOW}⚠️  Development server not running at {self.localhost_url}{NC}")
            print(f"   Start with: {BLUE}npm run dev{NC}")
            
        # Test production environments
        for prod_url in self.production_urls:
            if self.check_server_availability(prod_url):
                prod_results = self.test_environment(prod_url, f"Production ({prod_url})")
                all_results.append(prod_results)
            else:
                print(f"\n{YELLOW}⚠️  Production server not accessible: {prod_url}{NC}")
                
        # Generate summary report
        self.generate_summary_report(all_results)
        
        # Return overall success
        total_failures = sum(r["failed_tests"] for r in all_results)
        return total_failures == 0 and len(all_results) > 0
        
    def generate_summary_report(self, all_results):
        """Generate comprehensive test report"""
        print(f"\n{CYAN}📊 COMPREHENSIVE TEST REPORT{NC}")
        print("═" * 60)
        
        if not all_results:
            print(f"{RED}❌ No environments were accessible for testing{NC}")
            return
            
        total_tests = sum(r["total_tests"] for r in all_results)
        total_passed = sum(r["passed_tests"] for r in all_results)
        total_failed = sum(r["failed_tests"] for r in all_results)
        total_warnings = sum(r["warnings"] for r in all_results)
        
        print(f"\n{MAGENTA}📈 Overall Statistics:{NC}")
        print(f"  Environments Tested: {len(all_results)}")
        print(f"  Total Tests: {total_tests}")
        print(f"  {GREEN}Passed: {total_passed}{NC}")
        print(f"  {RED}Failed: {total_failed}{NC}")
        print(f"  {YELLOW}Warnings: {total_warnings}{NC}")
        
        # Environment breakdown
        print(f"\n{MAGENTA}🌍 Environment Breakdown:{NC}")
        for result in all_results:
            status_color = GREEN if result["failed_tests"] == 0 else RED
            print(f"  {status_color}{result['environment']}: {result['passed_tests']}/{result['total_tests']}{NC}")
            
        # Overall assessment
        if total_failed == 0:
            print(f"\n{GREEN}🎉 ALL TESTS PASSED!{NC}")
            print(f"{GREEN}✅ APIs are working correctly across all environments{NC}")
            if total_warnings > 0:
                print(f"{YELLOW}⚠️  {total_warnings} warnings to review{NC}")
        else:
            print(f"\n{RED}🚨 TESTS FAILED!{NC}")
            print(f"{RED}❌ {total_failed} test(s) failed - fix before deployment{NC}")
            
        # Recommendations
        print(f"\n{CYAN}💡 Recommendations:{NC}")
        
        dev_tested = any(r["environment"] == "Development (Localhost)" for r in all_results)
        prod_tested = any("Production" in r["environment"] for r in all_results)
        
        if not dev_tested:
            print(f"  {YELLOW}• Start development server for local testing{NC}")
        if not prod_tested:
            print(f"  {YELLOW}• Deploy to staging/production for full validation{NC}")
        if total_warnings > 0:
            print(f"  {YELLOW}• Review and address warning messages{NC}")
        if total_failed == 0 and total_warnings == 0:
            print(f"  {GREEN}• Ready for production deployment!{NC}")
            
        print(f"\n{BLUE}🔧 Environment Variables to Check:{NC}")
        print(f"  • GROQ_API_KEY (required for generation)")
        print(f"  • UPSTASH_REDIS_REST_URL (optional, for caching)")
        print(f"  • UPSTASH_REDIS_REST_TOKEN (optional, for caching)")
        print(f"  • OPENROUTER_API_KEY (optional, fallback)")

def main():
    """Main entry point"""
    tester = ProductionAPITester()
    success = tester.run_comprehensive_test()
    
    print(f"\n{CYAN}⏰ Testing completed{NC}")
    
    if success:
        print(f"{GREEN}🎯 All API endpoints are working correctly!{NC}")
        sys.exit(0)
    else:
        print(f"{RED}🚨 API issues detected - review and fix before deployment{NC}")
        sys.exit(1)

if __name__ == "__main__":
    main()