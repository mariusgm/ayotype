# Claude Agent Runtime

**Private Reusable Browser Automation + Console Diagnostics**

A lightweight Python framework for browser automation and testing with Claude AI integration capabilities. Built on Playwright with comprehensive console monitoring and diagnostics.

## Features

- **Browser Automation**: High-level Playwright wrapper for easy browser control
- **Console Monitoring**: Automatic capture and categorization of browser console logs
- **Performance Tracking**: Built-in performance metrics monitoring
- **Screenshot Capture**: Easy screenshot management with auto-naming
- **Agent Framework**: Structured patterns for AI-driven browser automation
- **Diagnostics**: Comprehensive error reporting and log analysis

## Installation

### 1. Install Python Dependencies

```bash
cd claude-agent-runtime
pip install -r requirements.txt
```

### 2. Install Playwright Browsers

```bash
playwright install
```

This will download Chromium, Firefox, and WebKit browsers.

## Quick Start

### Basic Browser Automation

```python
import asyncio
from drivers.playwright_driver import BrowserDriver

async def main():
    # Initialize browser driver
    driver = BrowserDriver()
    await driver.init(headless=False)

    # Navigate to a page
    await driver.navigate("https://example.com")

    # Take a screenshot
    screenshot = await driver.screenshot()
    print(f"Screenshot saved: {screenshot}")

    # Evaluate JavaScript
    title = await driver.eval("document.title")
    print(f"Page title: {title}")

    # Get console logs
    logs = await driver.console_logs()
    for log in logs:
        print(log)

    # Clean up
    await driver.close()

asyncio.run(main())
```

### Using the Agent Framework

```python
import asyncio
from core.agent import ClaudeAgent
from drivers.playwright_driver import BrowserDriver

async def main():
    # Create driver and agent
    driver = BrowserDriver()
    agent = ClaudeAgent(driver=driver)

    # Initialize
    await agent.initialize()

    # Execute a task
    result = await agent.execute_task(
        "Navigate to example.com",
        context={"url": "https://example.com"}
    )

    # Analyze the page
    analysis = await agent.analyze_page()
    print(f"Page has {analysis['elementCounts']['buttons']} buttons")

    # Clean up
    await agent.cleanup()

asyncio.run(main())
```

### Console Diagnostics

```python
from utils.diagnostics import ConsoleDiagnostics

# Create diagnostics instance
diagnostics = ConsoleDiagnostics()

# Add logs from browser
logs = await driver.console_logs()
diagnostics.add_logs(logs)

# Check for errors
if diagnostics.has_errors():
    print("Errors found:")
    for error in diagnostics.get_errors():
        print(f"  - {error}")

# Generate report
print(diagnostics.generate_report())
```

### Performance Monitoring

```python
from utils.diagnostics import PerformanceMonitor

monitor = PerformanceMonitor()

# Record metrics
monitor.record_metric("page_load_time", 1.23)
monitor.record_metric("api_response_time", 0.45)

# Get statistics
print(f"Average load time: {monitor.get_average('page_load_time')}")
print(f"Max response time: {monitor.get_max('api_response_time')}")

# Generate report
print(monitor.generate_report())
```

## API Reference

### BrowserDriver

Main class for browser automation.

**Methods:**
- `init(headless=True, viewport=None)` - Initialize the browser
- `navigate(url, wait_until="networkidle")` - Navigate to URL
- `eval(js_code)` - Execute JavaScript
- `click(selector, timeout=10000)` - Click element
- `fill(selector, text, timeout=10000)` - Fill input
- `wait_for_selector(selector, timeout=10000, state="visible")` - Wait for element
- `screenshot(filename=None, full_page=False)` - Take screenshot
- `console_logs()` - Get console logs
- `get_html()` - Get page HTML
- `get_title()` - Get page title
- `get_url()` - Get current URL
- `reload()` - Reload page
- `close()` - Close browser

### ClaudeAgent

Framework for structured browser automation tasks.

**Methods:**
- `initialize()` - Initialize agent and driver
- `execute_task(task, context=None)` - Execute a high-level task
- `analyze_page()` - Analyze current page structure
- `wait_for_condition(condition, timeout=10, interval=0.5)` - Wait for JS condition
- `get_task_history()` - Get task execution history
- `cleanup()` - Clean up resources

### ConsoleDiagnostics

Analyze and categorize browser console logs.

**Methods:**
- `add_log(log)` - Add a log entry
- `add_logs(logs)` - Add multiple logs
- `get_errors()` - Get error logs
- `get_warnings()` - Get warning logs
- `has_errors()` - Check if errors exist
- `search_logs(pattern, case_sensitive=False)` - Search logs
- `generate_report()` - Generate diagnostic report
- `clear()` - Clear all logs

### PerformanceMonitor

Monitor and analyze performance metrics.

**Methods:**
- `record_metric(name, value)` - Record a metric
- `get_metric(name)` - Get all values for metric
- `get_average(name)` - Get average value
- `get_min(name)` - Get minimum value
- `get_max(name)` - Get maximum value
- `get_summary()` - Get summary statistics
- `generate_report()` - Generate performance report

## Architecture

```
claude-agent-runtime/
├── __init__.py              # Package initialization
├── core/                    # Core agent components
│   ├── __init__.py
│   └── agent.py            # ClaudeAgent class
├── drivers/                 # Browser driver implementations
│   ├── __init__.py
│   └── playwright_driver.py # Playwright wrapper
├── utils/                   # Utility modules
│   ├── __init__.py
│   └── diagnostics.py      # Diagnostics and monitoring
├── requirements.txt         # Python dependencies
└── README.md               # This file
```

## Usage in EmojiFusion Project

The existing Python test scripts use this runtime:

```python
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'claude-agent-runtime'))

from drivers.playwright_driver import BrowserDriver
from core.agent import ClaudeAgent
```

### Example Scripts

- `debug-api.py` - Debug API connections
- `elite-demo.py` - Comprehensive UI testing demo
- `ui-analyzer.py` - Analyze UI components
- `test-emojifusion.py` - Test generation flow
- `mobile-demo.py` - Mobile-specific testing

## Browser Support

- **Chromium** (default) - Chrome/Edge
- **Firefox** - Mozilla Firefox
- **WebKit** - Safari

Select browser type when initializing:

```python
driver = BrowserDriver(browser_type="firefox")
```

## Screenshots

Screenshots are automatically saved to `screenshots/` directory with timestamped filenames:

```
screenshots/
├── screenshot_20241017_123045_123.png
├── screenshot_20241017_123046_456.png
└── ...
```

## Console Log Format

Console logs are captured in the format:

```
[LOG] Normal console.log message
[ERROR] Error message
[WARNING] Warning message
[PAGE_ERROR] Uncaught JavaScript error
```

## Performance Tips

1. **Use headless mode** for faster execution in CI/CD
2. **Set appropriate viewport** for mobile testing
3. **Use wait_for_selector** instead of sleep for reliability
4. **Clear console logs** periodically to avoid memory issues
5. **Use context managers** for automatic cleanup

## Troubleshooting

### Playwright Not Found

```bash
pip install playwright
playwright install
```

### Browser Launch Fails

Ensure you have necessary system dependencies:

```bash
# Ubuntu/Debian
sudo playwright install-deps

# Windows/macOS
# Dependencies usually auto-install
```

### Console Logs Empty

Make sure to call `init()` before navigation to enable log capture.

## License

Private repository - All rights reserved.

## Integration with Claude Code

This runtime is designed to work seamlessly with Claude Code for:

- Automated UI testing
- Browser interaction workflows
- Console error detection
- Performance benchmarking
- Screenshot-based verification

The agent framework provides structured patterns that Claude can use to perform complex multi-step browser automation tasks.
