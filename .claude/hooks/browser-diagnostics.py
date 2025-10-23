#!/usr/bin/env python3
"""
🌐 Advanced Browser & Console Diagnostics System
==============================================
Comprehensive browser testing with console monitoring,
performance metrics, and visual regression testing.
"""

import asyncio
import json
import os
import sys
import time
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from pathlib import Path
import base64

try:
    from playwright.async_api import async_playwright, Page, ConsoleMessage, Browser
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False
    print("⚠️  Playwright not installed. Run: pip install playwright && playwright install chromium")

# ANSI color codes
RED = '\033[0;31m'
GREEN = '\033[0;32m'
YELLOW = '\033[1;33m'
BLUE = '\033[0;34m'
CYAN = '\033[0;36m'
MAGENTA = '\033[0;35m'
NC = '\033[0m'

@dataclass
class ConsoleEntry:
    """Represents a console log entry"""
    type: str  # log, error, warning, info
    text: str
    timestamp: float
    location: Optional[str] = None
    stack_trace: Optional[str] = None

@dataclass
class NetworkEntry:
    """Represents a network request"""
    url: str
    method: str
    status: int
    duration: float
    size: int
    failed: bool
    error: Optional[str] = None

@dataclass
class PerformanceMetrics:
    """Browser performance metrics"""
    page_load_time: float
    dom_content_loaded: float
    first_paint: float
    first_contentful_paint: float
    largest_contentful_paint: float
    cumulative_layout_shift: float
    first_input_delay: float
    time_to_interactive: float
    memory_usage: Optional[float] = None

@dataclass
class DiagnosticReport:
    """Complete diagnostic report"""
    url: str
    timestamp: str
    passed: bool
    console_logs: List[ConsoleEntry]
    network_requests: List[NetworkEntry]
    performance: Optional[PerformanceMetrics]
    errors: List[str]
    warnings: List[str]
    security_issues: List[str]
    screenshots: Dict[str, str]  # name -> path
    recommendations: List[str]

class BrowserDiagnostics:
    def __init__(self, base_url: str = "http://127.0.0.1:3000", headless: bool = True):
        self.base_url = base_url
        self.headless = headless
        self.console_logs: List[ConsoleEntry] = []
        self.network_requests: List[NetworkEntry] = []
        self.errors: List[str] = []
        self.warnings: List[str] = []
        self.security_issues: List[str] = []
        self.screenshots: Dict[str, str] = {}
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None
        
    async def __aenter__(self):
        if not PLAYWRIGHT_AVAILABLE:
            raise RuntimeError("Playwright is not available")
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.browser:
            await self.browser.close()
            
    def _handle_console(self, msg: ConsoleMessage):
        """Handle console messages"""
        entry = ConsoleEntry(
            type=msg.type,
            text=msg.text,
            timestamp=time.time(),
            location=msg.location.get("url") if msg.location else None
        )
        
        self.console_logs.append(entry)
        
        # Track errors and warnings
        if msg.type == "error":
            self.errors.append(f"Console error: {msg.text}")
            
            # Check for specific error patterns
            if "CORS" in msg.text:
                self.security_issues.append("CORS error detected")
            elif "Mixed Content" in msg.text:
                self.security_issues.append("Mixed content warning (HTTP resource on HTTPS page)")
            elif "CSP" in msg.text or "Content Security Policy" in msg.text:
                self.security_issues.append("Content Security Policy violation")
                
        elif msg.type == "warning":
            self.warnings.append(f"Console warning: {msg.text}")
            
    def _handle_request_failed(self, request):
        """Handle failed network requests"""
        self.network_requests.append(NetworkEntry(
            url=request.url,
            method=request.method,
            status=0,
            duration=0,
            size=0,
            failed=True,
            error=request.failure
        ))
        self.errors.append(f"Network request failed: {request.url} - {request.failure}")
        
    def _handle_response(self, response):
        """Handle network responses"""
        request = response.request
        
        # Calculate duration if timing info available
        duration = 0
        if hasattr(response, 'timing'):
            duration = response.timing.get('responseEnd', 0) - response.timing.get('requestStart', 0)
            
        entry = NetworkEntry(
            url=request.url,
            method=request.method,
            status=response.status,
            duration=duration,
            size=len(response.body()) if hasattr(response, 'body') else 0,
            failed=False
        )
        
        self.network_requests.append(entry)
        
        # Check for issues
        if response.status >= 400:
            self.errors.append(f"HTTP {response.status} error: {request.url}")
        elif response.status >= 300 and response.status < 400:
            self.warnings.append(f"Redirect {response.status}: {request.url}")
            
    async def setup_page(self):
        """Setup browser and page with event handlers"""
        playwright = await async_playwright().start()
        self.browser = await playwright.chromium.launch(headless=self.headless)
        
        # Create context with permissions
        context = await self.browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (EmojiFusion Diagnostics) Chrome/120.0.0.0',
            permissions=['geolocation', 'notifications'],
            ignore_https_errors=True
        )
        
        self.page = await context.new_page()
        
        # Setup event handlers
        self.page.on('console', self._handle_console)
        self.page.on('requestfailed', self._handle_request_failed)
        self.page.on('response', self._handle_response)
        
        # Enable additional diagnostics
        await self.page.add_init_script("""
            // Track performance metrics
            window.__diagnostics = {
                errors: [],
                warnings: [],
                performance: {}
            };
            
            // Override console methods to capture more info
            const originalError = console.error;
            console.error = function(...args) {
                window.__diagnostics.errors.push({
                    message: args.join(' '),
                    stack: new Error().stack,
                    timestamp: Date.now()
                });
                originalError.apply(console, args);
            };
            
            // Track performance metrics
            window.addEventListener('load', () => {
                const perfData = performance.getEntriesByType('navigation')[0];
                if (perfData) {
                    window.__diagnostics.performance = {
                        pageLoadTime: perfData.loadEventEnd - perfData.fetchStart,
                        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.fetchStart,
                        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
                        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
                    };
                }
            });
        """)
        
    async def capture_screenshot(self, name: str, full_page: bool = False):
        """Capture and save screenshot"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"screenshots/{name}_{timestamp}.png"
        
        # Ensure directory exists
        os.makedirs("screenshots", exist_ok=True)
        
        await self.page.screenshot(path=filename, full_page=full_page)
        self.screenshots[name] = filename
        
        return filename
        
    async def get_performance_metrics(self) -> Optional[PerformanceMetrics]:
        """Get detailed performance metrics"""
        try:
            # Get navigation timing
            metrics = await self.page.evaluate("""
                () => {
                    const nav = performance.getEntriesByType('navigation')[0];
                    const paint = performance.getEntriesByType('paint');
                    
                    return {
                        pageLoadTime: nav.loadEventEnd - nav.fetchStart,
                        domContentLoaded: nav.domContentLoadedEventEnd - nav.fetchStart,
                        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
                        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
                        timeToInteractive: nav.domInteractive - nav.fetchStart
                    };
                }
            """)
            
            # Get Core Web Vitals
            cls = await self.page.evaluate("""
                () => {
                    return new Promise(resolve => {
                        new PerformanceObserver((list) => {
                            const entries = list.getEntries();
                            const cls = entries.find(e => e.name === 'CLS');
                            resolve(cls ? cls.value : 0);
                        }).observe({entryTypes: ['layout-shift']});
                        
                        setTimeout(() => resolve(0), 1000);
                    });
                }
            """)
            
            # Get memory usage if available
            memory = await self.page.evaluate("""
                () => performance.memory ? performance.memory.usedJSHeapSize / 1048576 : null
            """)
            
            return PerformanceMetrics(
                page_load_time=metrics['pageLoadTime'],
                dom_content_loaded=metrics['domContentLoaded'],
                first_paint=metrics['firstPaint'],
                first_contentful_paint=metrics['firstContentfulPaint'],
                largest_contentful_paint=0,  # TODO: Implement LCP measurement
                cumulative_layout_shift=cls,
                first_input_delay=0,  # TODO: Implement FID measurement
                time_to_interactive=metrics['timeToInteractive'],
                memory_usage=memory
            )
        except Exception as e:
            self.errors.append(f"Failed to get performance metrics: {str(e)}")
            return None
            
    async def check_accessibility(self):
        """Basic accessibility checks"""
        try:
            results = await self.page.evaluate("""
                () => {
                    const issues = [];
                    
                    // Check for alt text on images
                    const images = document.querySelectorAll('img');
                    images.forEach(img => {
                        if (!img.alt && !img.getAttribute('aria-label')) {
                            issues.push(`Image missing alt text: ${img.src}`);
                        }
                    });
                    
                    // Check for form labels
                    const inputs = document.querySelectorAll('input, select, textarea');
                    inputs.forEach(input => {
                        if (!input.labels?.length && !input.getAttribute('aria-label')) {
                            issues.push(`Form input missing label: ${input.name || input.id}`);
                        }
                    });
                    
                    // Check heading hierarchy
                    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
                    let lastLevel = 0;
                    headings.forEach(h => {
                        const level = parseInt(h.tagName[1]);
                        if (level > lastLevel + 1) {
                            issues.push(`Heading hierarchy skip: ${h.tagName} after H${lastLevel}`);
                        }
                        lastLevel = level;
                    });
                    
                    return issues;
                }
            """)
            
            for issue in results:
                self.warnings.append(f"Accessibility: {issue}")
                
        except Exception as e:
            self.errors.append(f"Accessibility check failed: {str(e)}")
            
    async def check_security(self):
        """Security-specific checks"""
        try:
            # Check for insecure resources
            insecure = await self.page.evaluate("""
                () => {
                    const issues = [];
                    
                    // Check for HTTP resources on HTTPS page
                    if (window.location.protocol === 'https:') {
                        const resources = document.querySelectorAll('[src^="http:"], [href^="http:"]');
                        resources.forEach(r => {
                            issues.push(`Insecure resource: ${r.src || r.href}`);
                        });
                    }
                    
                    // Check for external scripts without integrity
                    const scripts = document.querySelectorAll('script[src*="//"]');
                    scripts.forEach(s => {
                        if (!s.integrity && !s.src.includes(window.location.hostname)) {
                            issues.push(`External script without integrity check: ${s.src}`);
                        }
                    });
                    
                    // Check for inline scripts
                    const inlineScripts = document.querySelectorAll('script:not([src])');
                    if (inlineScripts.length > 0) {
                        issues.push(`Found ${inlineScripts.length} inline scripts - consider CSP`);
                    }
                    
                    return issues;
                }
            """)
            
            for issue in insecure:
                self.security_issues.append(issue)
                
        except Exception as e:
            self.errors.append(f"Security check failed: {str(e)}")
            
    async def test_user_interactions(self):
        """Test basic user interactions"""
        try:
            # Test emoji generation form
            emoji_input = await self.page.query_selector('input[type="text"], textarea')
            if emoji_input:
                await emoji_input.fill("test interaction")
                
                # Find and click generate button
                generate_button = await self.page.query_selector('button:has-text("Generate"), button:has-text("Fuse")')
                if generate_button:
                    await generate_button.click()
                    
                    # Wait for response
                    await self.page.wait_for_timeout(2000)
                    
                    # Check for result
                    result = await self.page.query_selector('.result, .output, [data-result]')
                    if result:
                        self.warnings.append("✓ User interaction test: Emoji generation working")
                    else:
                        self.errors.append("User interaction test: No result after generation")
                else:
                    self.warnings.append("Generate button not found")
            else:
                self.warnings.append("Input field not found for interaction test")
                
        except Exception as e:
            self.errors.append(f"User interaction test failed: {str(e)}")
            
    async def run_diagnostics(self, url: str = "/") -> DiagnosticReport:
        """Run complete diagnostics on a URL"""
        full_url = f"{self.base_url}{url}"
        print(f"\n{CYAN}🔍 Running diagnostics on: {full_url}{NC}")
        
        try:
            await self.setup_page()
            
            # Navigate to page
            response = await self.page.goto(full_url, wait_until="networkidle", timeout=30000)
            
            if not response:
                self.errors.append("Failed to navigate to page")
                
            # Wait for page to stabilize
            await self.page.wait_for_timeout(2000)
            
            # Capture initial screenshot
            await self.capture_screenshot("initial_load")
            
            # Run various checks
            print(f"{BLUE}Running performance analysis...{NC}")
            performance = await self.get_performance_metrics()
            
            print(f"{BLUE}Running accessibility checks...{NC}")
            await self.check_accessibility()
            
            print(f"{BLUE}Running security checks...{NC}")
            await self.check_security()
            
            print(f"{BLUE}Testing user interactions...{NC}")
            await self.test_user_interactions()
            
            # Capture final screenshot
            await self.capture_screenshot("after_tests", full_page=True)
            
            # Get diagnostics data from page
            diagnostics_data = await self.page.evaluate("() => window.__diagnostics || {}")
            
            # Analyze results
            passed = len(self.errors) == 0 and len(self.security_issues) == 0
            
            # Generate recommendations
            recommendations = self.generate_recommendations()
            
            # Create report
            report = DiagnosticReport(
                url=full_url,
                timestamp=datetime.now().isoformat(),
                passed=passed,
                console_logs=self.console_logs,
                network_requests=self.network_requests,
                performance=performance,
                errors=self.errors,
                warnings=self.warnings,
                security_issues=self.security_issues,
                screenshots=self.screenshots,
                recommendations=recommendations
            )
            
            return report
            
        except Exception as e:
            self.errors.append(f"Diagnostic run failed: {str(e)}")
            return DiagnosticReport(
                url=full_url,
                timestamp=datetime.now().isoformat(),
                passed=False,
                console_logs=self.console_logs,
                network_requests=self.network_requests,
                performance=None,
                errors=self.errors,
                warnings=self.warnings,
                security_issues=self.security_issues,
                screenshots=self.screenshots,
                recommendations=["Fix critical errors before running full diagnostics"]
            )
            
    def generate_recommendations(self) -> List[str]:
        """Generate recommendations based on findings"""
        recommendations = []
        
        # Performance recommendations
        if self.network_requests:
            slow_requests = [r for r in self.network_requests if r.duration > 1000]
            if slow_requests:
                recommendations.append(f"Optimize {len(slow_requests)} slow network requests")
                
        # Error recommendations
        console_errors = [log for log in self.console_logs if log.type == "error"]
        if console_errors:
            recommendations.append(f"Fix {len(console_errors)} console errors")
            
        # Security recommendations
        if self.security_issues:
            recommendations.append("Address security issues immediately")
            
        # Accessibility recommendations
        accessibility_warnings = [w for w in self.warnings if "Accessibility" in w]
        if accessibility_warnings:
            recommendations.append("Improve accessibility for better user experience")
            
        return recommendations
        
    def print_report(self, report: DiagnosticReport):
        """Print formatted diagnostic report"""
        print(f"\n{CYAN}📊 BROWSER DIAGNOSTICS REPORT{NC}")
        print("=" * 60)
        print(f"URL: {report.url}")
        print(f"Timestamp: {report.timestamp}")
        print(f"Status: {'PASSED' if report.passed else 'FAILED'}")
        
        # Console summary
        print(f"\n{MAGENTA}Console Logs:{NC}")
        error_logs = [log for log in report.console_logs if log.type == "error"]
        warning_logs = [log for log in report.console_logs if log.type == "warning"]
        print(f"  Errors: {len(error_logs)}")
        print(f"  Warnings: {len(warning_logs)}")
        
        # Network summary
        print(f"\n{MAGENTA}Network Requests:{NC}")
        failed_requests = [r for r in report.network_requests if r.failed or r.status >= 400]
        print(f"  Total: {len(report.network_requests)}")
        print(f"  Failed: {len(failed_requests)}")
        
        # Performance summary
        if report.performance:
            print(f"\n{MAGENTA}Performance Metrics:{NC}")
            print(f"  Page Load: {report.performance.page_load_time:.2f}ms")
            print(f"  DOM Ready: {report.performance.dom_content_loaded:.2f}ms")
            print(f"  First Paint: {report.performance.first_paint:.2f}ms")
            print(f"  First Contentful Paint: {report.performance.first_contentful_paint:.2f}ms")
            if report.performance.memory_usage:
                print(f"  Memory Usage: {report.performance.memory_usage:.2f}MB")
                
        # Issues summary
        if report.errors:
            print(f"\n{RED}Errors ({len(report.errors)}):{NC}")
            for error in report.errors[:5]:  # Show first 5
                print(f"  • {error}")
                
        if report.security_issues:
            print(f"\n{RED}Security Issues ({len(report.security_issues)}):{NC}")
            for issue in report.security_issues:
                print(f"  • {issue}")
                
        if report.warnings:
            print(f"\n{YELLOW}Warnings ({len(report.warnings)}):{NC}")
            for warning in report.warnings[:5]:  # Show first 5
                print(f"  • {warning}")
                
        # Recommendations
        if report.recommendations:
            print(f"\n{CYAN}📋 Recommendations:{NC}")
            for rec in report.recommendations:
                print(f"  ✓ {rec}")
                
        # Screenshots
        if report.screenshots:
            print(f"\n{BLUE}📸 Screenshots saved:{NC}")
            for name, path in report.screenshots.items():
                print(f"  • {name}: {path}")
                
        # Final status
        if report.passed:
            print(f"\n{GREEN}✅ BROWSER DIAGNOSTICS PASSED{NC}")
        else:
            print(f"\n{RED}❌ BROWSER DIAGNOSTICS FAILED{NC}")
            
    def save_report(self, report: DiagnosticReport, filename: str = None):
        """Save report to JSON file"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"diagnostics_report_{timestamp}.json"
            
        # Convert to dict
        report_dict = asdict(report)
        
        # Convert console logs and network requests
        report_dict['console_logs'] = [asdict(log) for log in report.console_logs]
        report_dict['network_requests'] = [asdict(req) for req in report.network_requests]
        if report.performance:
            report_dict['performance'] = asdict(report.performance)
            
        # Save to file
        with open(filename, 'w') as f:
            json.dump(report_dict, f, indent=2)
            
        print(f"\n{GREEN}Report saved to: {filename}{NC}")

async def main():
    """Main entry point"""
    # Check if server is running
    import aiohttp
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get("http://127.0.0.1:3000", timeout=aiohttp.ClientTimeout(total=2)) as response:
                print(f"{GREEN}✓ Development server is running{NC}")
        except:
            print(f"{RED}❌ Development server not running{NC}")
            print(f"{YELLOW}Please start the server with 'npm run dev'{NC}")
            sys.exit(1)
    
    # Run diagnostics
    async with BrowserDiagnostics() as diagnostics:
        report = await diagnostics.run_diagnostics("/")
        diagnostics.print_report(report)
        diagnostics.save_report(report)
        
        # Exit with appropriate code
        sys.exit(0 if report.passed else 1)

if __name__ == "__main__":
    if not PLAYWRIGHT_AVAILABLE:
        print(f"{RED}Playwright is required for browser diagnostics{NC}")
        print(f"{YELLOW}Install with: pip install playwright && playwright install chromium{NC}")
        sys.exit(1)
        
    asyncio.run(main())