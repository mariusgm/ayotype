#!/usr/bin/env python3
"""
🔧 Advanced API Endpoint Testing System
=====================================
Comprehensive endpoint testing with security validation,
performance metrics, and detailed diagnostics.
"""

import asyncio
import aiohttp
import json
import time
import sys
import os
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from datetime import datetime
import hashlib
import hmac

# ANSI color codes
RED = '\033[0;31m'
GREEN = '\033[0;32m'
YELLOW = '\033[1;33m'
BLUE = '\033[0;34m'
CYAN = '\033[0;36m'
MAGENTA = '\033[0;35m'
NC = '\033[0m'  # No Color

@dataclass
class EndpointTest:
    """Configuration for an endpoint test"""
    name: str
    url: str
    method: str = 'GET'
    headers: Optional[Dict[str, str]] = None
    body: Optional[Dict[str, Any]] = None
    expected_status: List[int] = None
    expected_fields: List[str] = None
    max_response_time: float = 2.0  # seconds
    security_checks: List[str] = None
    rate_limit_test: bool = False

@dataclass
class TestResult:
    """Result of an endpoint test"""
    test_name: str
    passed: bool
    response_time: float
    status_code: int
    errors: List[str]
    warnings: List[str]
    security_issues: List[str]

class EndpointTester:
    def __init__(self, base_url: str = "http://127.0.0.1:3000"):
        self.base_url = base_url
        self.results: List[TestResult] = []
        self.session: Optional[aiohttp.ClientSession] = None
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.session.close()
        
    def get_test_endpoints(self) -> List[EndpointTest]:
        """Define all endpoints to test"""
        return [
            # Main API endpoint
            EndpointTest(
                name="Emoji Generation API",
                url="/api/generate",
                method="POST",
                headers={"Content-Type": "application/json"},
                body={"words": "test", "mode": "emoji", "tone": "fun"},
                expected_status=[200, 400, 429],  # 429 for rate limit
                expected_fields=["result", "mode"],
                security_checks=["cors", "content-type", "rate-limit"],
                rate_limit_test=True
            ),
            
            # Invalid API request test
            EndpointTest(
                name="API Error Handling - Invalid Input",
                url="/api/generate",
                method="POST",
                headers={"Content-Type": "application/json"},
                body={},  # Missing required fields
                expected_status=[400],
                expected_fields=["error"],
                security_checks=["error-disclosure"]
            ),
            
            # Main page
            EndpointTest(
                name="Main Application Page",
                url="/",
                method="GET",
                expected_status=[200],
                security_checks=["security-headers", "csp"]
            ),
            
            # Static assets
            EndpointTest(
                name="Static Assets - Manifest",
                url="/manifest.webmanifest",
                method="GET",
                expected_status=[200],
                max_response_time=1.0
            ),
            
            # Service Worker
            EndpointTest(
                name="Service Worker",
                url="/sw.js",
                method="GET",
                expected_status=[200],
                security_checks=["mime-type"]
            ),
            
            # Non-existent endpoint
            EndpointTest(
                name="404 Error Handling",
                url="/api/nonexistent",
                method="GET",
                expected_status=[404],
                security_checks=["error-disclosure"]
            ),
            
            # CORS preflight
            EndpointTest(
                name="CORS Preflight Request",
                url="/api/generate",
                method="OPTIONS",
                headers={
                    "Origin": "https://example.com",
                    "Access-Control-Request-Method": "POST"
                },
                expected_status=[200, 204],
                security_checks=["cors-preflight"]
            )
        ]
        
    async def test_endpoint(self, test: EndpointTest) -> TestResult:
        """Test a single endpoint"""
        errors = []
        warnings = []
        security_issues = []
        
        try:
            start_time = time.time()
            
            # Build full URL
            url = f"{self.base_url}{test.url}"
            
            # Make request
            kwargs = {
                "method": test.method,
                "url": url,
                "headers": test.headers or {},
                "timeout": aiohttp.ClientTimeout(total=10)
            }
            
            if test.body and test.method in ["POST", "PUT", "PATCH"]:
                kwargs["json"] = test.body
                
            async with self.session.request(**kwargs) as response:
                response_time = time.time() - start_time
                status_code = response.status
                
                # Read response
                try:
                    response_text = await response.text()
                    response_data = json.loads(response_text) if response_text else {}
                except:
                    response_data = {}
                    
                # Check status code
                if test.expected_status:
                    if status_code not in test.expected_status:
                        errors.append(f"Expected status {test.expected_status}, got {status_code}")
                        
                # Check response time
                if response_time > test.max_response_time:
                    warnings.append(f"Response time {response_time:.2f}s exceeds max {test.max_response_time}s")
                    
                # Check expected fields
                if test.expected_fields and isinstance(response_data, dict):
                    for field in test.expected_fields:
                        if field not in response_data:
                            errors.append(f"Missing expected field: {field}")
                            
                # Security checks
                if test.security_checks:
                    security_issues.extend(await self.run_security_checks(test, response, response_data))
                    
                return TestResult(
                    test_name=test.name,
                    passed=len(errors) == 0 and len(security_issues) == 0,
                    response_time=response_time,
                    status_code=status_code,
                    errors=errors,
                    warnings=warnings,
                    security_issues=security_issues
                )
                
        except asyncio.TimeoutError:
            errors.append("Request timed out")
            return TestResult(
                test_name=test.name,
                passed=False,
                response_time=test.max_response_time,
                status_code=0,
                errors=errors,
                warnings=warnings,
                security_issues=security_issues
            )
        except Exception as e:
            errors.append(f"Request failed: {str(e)}")
            return TestResult(
                test_name=test.name,
                passed=False,
                response_time=0,
                status_code=0,
                errors=errors,
                warnings=warnings,
                security_issues=security_issues
            )
            
    async def run_security_checks(self, test: EndpointTest, response: aiohttp.ClientResponse, 
                                 response_data: Dict) -> List[str]:
        """Run security checks on the response"""
        issues = []
        
        for check in test.security_checks:
            if check == "cors":
                # Check CORS headers
                if "Access-Control-Allow-Origin" not in response.headers:
                    issues.append("Missing CORS headers")
                elif response.headers.get("Access-Control-Allow-Origin") == "*":
                    issues.append("CORS allows all origins (*) - consider restricting")
                    
            elif check == "content-type":
                # Check Content-Type
                content_type = response.headers.get("Content-Type", "")
                if "application/json" not in content_type:
                    issues.append(f"Unexpected Content-Type: {content_type}")
                    
            elif check == "security-headers":
                # Check security headers
                required_headers = {
                    "X-Content-Type-Options": "nosniff",
                    "X-Frame-Options": ["DENY", "SAMEORIGIN"],
                    "Referrer-Policy": ["strict-origin-when-cross-origin", "no-referrer"]
                }
                
                for header, expected_values in required_headers.items():
                    if header not in response.headers:
                        issues.append(f"Missing security header: {header}")
                    elif isinstance(expected_values, list):
                        if response.headers[header] not in expected_values:
                            issues.append(f"Invalid {header}: {response.headers[header]}")
                    elif response.headers[header] != expected_values:
                        issues.append(f"Invalid {header}: {response.headers[header]}")
                        
            elif check == "error-disclosure":
                # Check for sensitive information in errors
                if isinstance(response_data, dict) and "error" in response_data:
                    error_msg = str(response_data.get("error", ""))
                    sensitive_patterns = ["stack", "trace", "path", "file", "line"]
                    for pattern in sensitive_patterns:
                        if pattern in error_msg.lower():
                            issues.append(f"Possible sensitive information disclosure in error: '{pattern}'")
                            
            elif check == "rate-limit":
                # Check for rate limit headers
                rate_limit_headers = ["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"]
                has_rate_limit = any(h in response.headers for h in rate_limit_headers)
                if not has_rate_limit and response.status != 429:
                    issues.append("No rate limiting headers found")
                    
            elif check == "mime-type":
                # Check correct MIME type for JS files
                if test.url.endswith(".js"):
                    content_type = response.headers.get("Content-Type", "")
                    if "javascript" not in content_type:
                        issues.append(f"Incorrect MIME type for JS file: {content_type}")
                        
        return issues
        
    async def test_rate_limiting(self, test: EndpointTest) -> Optional[TestResult]:
        """Test rate limiting by making rapid requests"""
        if not test.rate_limit_test:
            return None
            
        print(f"\n{CYAN}🔄 Testing rate limiting for {test.name}...{NC}")
        
        # Make 15 rapid requests (assuming limit is 10/minute)
        results = []
        for i in range(15):
            result = await self.test_endpoint(test)
            results.append(result)
            
            if result.status_code == 429:
                print(f"{GREEN}✓ Rate limiting working - triggered after {i+1} requests{NC}")
                return TestResult(
                    test_name=f"{test.name} - Rate Limiting",
                    passed=True,
                    response_time=0,
                    status_code=429,
                    errors=[],
                    warnings=[],
                    security_issues=[]
                )
                
        # If we didn't hit rate limit
        return TestResult(
            test_name=f"{test.name} - Rate Limiting",
            passed=False,
            response_time=0,
            status_code=200,
            errors=["Rate limiting not triggered after 15 requests"],
            warnings=[],
            security_issues=["No rate limiting implemented"]
        )
        
    async def run_all_tests(self):
        """Run all endpoint tests"""
        print(f"{CYAN}🔧 ENDPOINT TESTING SYSTEM{NC}")
        print("=" * 50)
        
        # Check if server is running
        try:
            async with self.session.get(self.base_url, timeout=aiohttp.ClientTimeout(total=2)) as response:
                print(f"{GREEN}✓ Server is running at {self.base_url}{NC}\n")
        except:
            print(f"{RED}❌ Server not running at {self.base_url}{NC}")
            print(f"{YELLOW}Please start the development server with 'npm run dev'{NC}")
            return False
            
        # Get all tests
        tests = self.get_test_endpoints()
        
        # Run each test
        for test in tests:
            print(f"\n{BLUE}🔍 Testing: {test.name}{NC}")
            print("-" * 40)
            
            result = await self.test_endpoint(test)
            self.results.append(result)
            
            # Print result
            if result.passed:
                print(f"{GREEN}✅ PASSED{NC} - {result.response_time:.3f}s - Status: {result.status_code}")
            else:
                print(f"{RED}❌ FAILED{NC} - Status: {result.status_code}")
                
            # Print errors
            for error in result.errors:
                print(f"  {RED}Error: {error}{NC}")
                
            # Print warnings
            for warning in result.warnings:
                print(f"  {YELLOW}Warning: {warning}{NC}")
                
            # Print security issues
            for issue in result.security_issues:
                print(f"  {RED}Security: {issue}{NC}")
                
            # Rate limit test
            if test.rate_limit_test:
                rate_limit_result = await self.test_rate_limiting(test)
                if rate_limit_result:
                    self.results.append(rate_limit_result)
                    
        # Summary
        self.print_summary()
        
        # Return success if all critical tests passed
        critical_failures = sum(1 for r in self.results if not r.passed and len(r.security_issues) > 0)
        return critical_failures == 0
        
    def print_summary(self):
        """Print test summary"""
        total = len(self.results)
        passed = sum(1 for r in self.results if r.passed)
        failed = total - passed
        
        total_errors = sum(len(r.errors) for r in self.results)
        total_warnings = sum(len(r.warnings) for r in self.results)
        total_security = sum(len(r.security_issues) for r in self.results)
        
        print(f"\n{CYAN}📊 TEST SUMMARY{NC}")
        print("=" * 50)
        print(f"Total Tests: {total}")
        print(f"{GREEN}Passed: {passed}{NC}")
        print(f"{RED}Failed: {failed}{NC}")
        print(f"\nIssues Found:")
        print(f"  Errors: {total_errors}")
        print(f"  Warnings: {total_warnings}")
        print(f"  Security: {total_security}")
        
        # Performance summary
        avg_response_time = sum(r.response_time for r in self.results) / len(self.results)
        print(f"\nAverage Response Time: {avg_response_time:.3f}s")
        
        if failed == 0 and total_security == 0:
            print(f"\n{GREEN}🎉 ALL ENDPOINT TESTS PASSED!{NC}")
        else:
            print(f"\n{RED}⚠️  ENDPOINT ISSUES REQUIRE ATTENTION{NC}")
            
        # Recommendations
        print(f"\n{YELLOW}📋 RECOMMENDATIONS:{NC}")
        if total_security > 0:
            print("  • Fix security issues immediately")
        if total_errors > 0:
            print("  • Resolve endpoint errors before deployment")
        if total_warnings > 0:
            print("  • Review warnings for potential improvements")
        if avg_response_time > 1.0:
            print("  • Consider optimizing slow endpoints")

async def main():
    """Main entry point"""
    async with EndpointTester() as tester:
        success = await tester.run_all_tests()
        sys.exit(0 if success else 1)

if __name__ == "__main__":
    asyncio.run(main())