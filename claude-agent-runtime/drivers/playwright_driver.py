"""
Playwright Browser Driver
High-level browser automation with console diagnostics
"""

import asyncio
from typing import Optional, List, Dict, Any
from datetime import datetime
import base64
import os


try:
    from playwright.async_api import async_playwright, Browser, Page, BrowserContext
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False
    Browser = None
    Page = None
    BrowserContext = None


class BrowserDriver:
    """
    Playwright-based browser driver with console monitoring
    and screenshot capabilities
    """

    def __init__(self, browser_type: str = "chromium"):
        """
        Initialize browser driver

        Args:
            browser_type: Browser type (chromium, firefox, webkit)
        """
        if not PLAYWRIGHT_AVAILABLE:
            raise ImportError(
                "Playwright not installed. Install with: pip install playwright && playwright install"
            )

        self.browser_type = browser_type
        self.playwright = None
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        self.initialized = False
        self._console_logs: List[str] = []
        self._screenshot_dir = "screenshots"

    async def init(self, headless: bool = True, viewport: Optional[Dict[str, int]] = None):
        """
        Initialize the browser

        Args:
            headless: Run browser in headless mode
            viewport: Viewport size dict with 'width' and 'height'
        """
        if self.initialized:
            return

        self.playwright = await async_playwright().start()

        # Select browser type
        if self.browser_type == "firefox":
            browser_launcher = self.playwright.firefox
        elif self.browser_type == "webkit":
            browser_launcher = self.playwright.webkit
        else:
            browser_launcher = self.playwright.chromium

        # Launch browser
        self.browser = await browser_launcher.launch(headless=headless)

        # Create context with viewport
        viewport_size = viewport or {"width": 1280, "height": 720}
        self.context = await self.browser.new_context(
            viewport=viewport_size,
            locale="en-US",
            timezone_id="America/New_York"
        )

        # Create page
        self.page = await self.context.new_page()

        # Set up console monitoring
        self.page.on("console", self._handle_console)
        self.page.on("pageerror", self._handle_page_error)

        # Ensure screenshot directory exists
        os.makedirs(self._screenshot_dir, exist_ok=True)

        self.initialized = True

    def _handle_console(self, msg):
        """Handle console messages from the browser"""
        log_entry = f"[{msg.type.upper()}] {msg.text}"
        self._console_logs.append(log_entry)

    def _handle_page_error(self, error):
        """Handle page errors"""
        log_entry = f"[PAGE_ERROR] {str(error)}"
        self._console_logs.append(log_entry)

    async def navigate(self, url: str, wait_until: str = "networkidle") -> bool:
        """
        Navigate to a URL

        Args:
            url: Target URL
            wait_until: Wait condition (load, domcontentloaded, networkidle)

        Returns:
            True if navigation successful
        """
        if not self.page:
            raise RuntimeError("Browser not initialized. Call init() first.")

        try:
            await self.page.goto(url, wait_until=wait_until, timeout=30000)
            return True
        except Exception as e:
            print(f"Navigation error: {e}")
            return False

    async def eval(self, js_code: str) -> Any:
        """
        Evaluate JavaScript code in the browser

        Args:
            js_code: JavaScript code to execute

        Returns:
            Result of the JavaScript execution
        """
        if not self.page:
            raise RuntimeError("Browser not initialized. Call init() first.")

        try:
            result = await self.page.evaluate(js_code)
            return result
        except Exception as e:
            print(f"JavaScript evaluation error: {e}")
            return None

    async def click(self, selector: str, timeout: int = 10000) -> bool:
        """
        Click an element

        Args:
            selector: CSS selector
            timeout: Timeout in milliseconds

        Returns:
            True if click successful
        """
        if not self.page:
            raise RuntimeError("Browser not initialized. Call init() first.")

        try:
            await self.page.click(selector, timeout=timeout)
            return True
        except Exception as e:
            print(f"Click error on '{selector}': {e}")
            return False

    async def fill(self, selector: str, text: str, timeout: int = 10000) -> bool:
        """
        Fill an input element

        Args:
            selector: CSS selector
            text: Text to fill
            timeout: Timeout in milliseconds

        Returns:
            True if fill successful
        """
        if not self.page:
            raise RuntimeError("Browser not initialized. Call init() first.")

        try:
            await self.page.fill(selector, text, timeout=timeout)
            return True
        except Exception as e:
            print(f"Fill error on '{selector}': {e}")
            return False

    async def wait_for_selector(self, selector: str, timeout: int = 10000, state: str = "visible") -> bool:
        """
        Wait for an element to appear

        Args:
            selector: CSS selector
            timeout: Timeout in milliseconds
            state: Element state (attached, detached, visible, hidden)

        Returns:
            True if element found
        """
        if not self.page:
            raise RuntimeError("Browser not initialized. Call init() first.")

        try:
            await self.page.wait_for_selector(selector, timeout=timeout, state=state)
            return True
        except Exception as e:
            print(f"Wait for selector error '{selector}': {e}")
            return False

    async def screenshot(self, filename: Optional[str] = None, full_page: bool = False) -> str:
        """
        Take a screenshot

        Args:
            filename: Optional filename (auto-generated if not provided)
            full_page: Capture full page instead of viewport

        Returns:
            Path to the screenshot file
        """
        if not self.page:
            raise RuntimeError("Browser not initialized. Call init() first.")

        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")[:-3]
            filename = f"{self._screenshot_dir}/screenshot_{timestamp}.png"
        elif not filename.startswith(self._screenshot_dir):
            filename = f"{self._screenshot_dir}/{filename}"

        await self.page.screenshot(path=filename, full_page=full_page)
        return filename

    async def console_logs(self) -> List[str]:
        """
        Get collected console logs

        Returns:
            List of console log entries
        """
        return self._console_logs.copy()

    async def clear_console_logs(self):
        """Clear collected console logs"""
        self._console_logs.clear()

    async def get_html(self) -> str:
        """
        Get the current page HTML

        Returns:
            Full page HTML
        """
        if not self.page:
            raise RuntimeError("Browser not initialized. Call init() first.")

        return await self.page.content()

    async def get_title(self) -> str:
        """
        Get the current page title

        Returns:
            Page title
        """
        if not self.page:
            raise RuntimeError("Browser not initialized. Call init() first.")

        return await self.page.title()

    async def get_url(self) -> str:
        """
        Get the current page URL

        Returns:
            Current URL
        """
        if not self.page:
            raise RuntimeError("Browser not initialized. Call init() first.")

        return self.page.url

    async def reload(self, wait_until: str = "networkidle"):
        """
        Reload the current page

        Args:
            wait_until: Wait condition
        """
        if not self.page:
            raise RuntimeError("Browser not initialized. Call init() first.")

        await self.page.reload(wait_until=wait_until)

    async def go_back(self):
        """Navigate back in browser history"""
        if not self.page:
            raise RuntimeError("Browser not initialized. Call init() first.")

        await self.page.go_back()

    async def go_forward(self):
        """Navigate forward in browser history"""
        if not self.page:
            raise RuntimeError("Browser not initialized. Call init() first.")

        await self.page.go_forward()

    async def close(self):
        """Close the browser and clean up resources"""
        if self.page:
            await self.page.close()
            self.page = None

        if self.context:
            await self.context.close()
            self.context = None

        if self.browser:
            await self.browser.close()
            self.browser = None

        if self.playwright:
            await self.playwright.stop()
            self.playwright = None

        self.initialized = False

    async def __aenter__(self):
        """Async context manager entry"""
        await self.init()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self.close()

    def __repr__(self) -> str:
        status = "initialized" if self.initialized else "not initialized"
        return f"<BrowserDriver browser={self.browser_type} status={status}>"
