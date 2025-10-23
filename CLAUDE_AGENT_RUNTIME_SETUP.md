# Claude Agent Runtime Setup Guide

This guide explains how to set up and use the **claude-agent-runtime** for browser automation and console diagnostics in the EmojiFusion project.

## Overview

The `claude-agent-runtime` is a private reusable Python framework that provides:

- **Browser Automation** via Playwright
- **Console Diagnostics** with automatic log categorization
- **Performance Monitoring** with metrics tracking
- **Agent Framework** for structured AI-driven automation
- **Screenshot Management** with auto-naming and storage

## Directory Structure

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
├── setup.py                # Package setup script
└── README.md               # Detailed documentation
```

## Installation

### Prerequisites

1. **Python 3.8+** must be installed
2. **pip** package manager

### Step 1: Install Python Dependencies

```bash
cd claude-agent-runtime
pip install -r requirements.txt
```

This installs:
- `playwright>=1.40.0` - Browser automation framework
- `python-dotenv>=1.0.0` - Environment variable management

### Step 2: Install Playwright Browsers

```bash
playwright install
```

This downloads the browser binaries (Chromium, Firefox, WebKit).

**Platform-specific dependencies:**

For Ubuntu/Debian:
```bash
sudo playwright install-deps
```

For Windows/macOS: Dependencies are usually auto-installed.

### Optional: Install in Development Mode

To install the package in editable mode:

```bash
cd claude-agent-runtime
pip install -e .
```

This allows you to import the package from anywhere while developing.

## Quick Start Examples

### 1. Basic Browser Automation

```python
#!/usr/bin/env python3
import asyncio
import sys
import os

# Add runtime to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'claude-agent-runtime'))

from drivers.playwright_driver import BrowserDriver

async def test_browser():
    # Create driver
    driver = BrowserDriver()

    # Initialize (headless=False to see browser)
    await driver.init(headless=False)

    # Navigate to EmojiFusion
    await driver.navigate("http://localhost:3000")

    # Take screenshot
    screenshot = await driver.screenshot()
    print(f"Screenshot: {screenshot}")

    # Get page title
    title = await driver.get_title()
    print(f"Page title: {title}")

    # Check console logs
    logs = await driver.console_logs()
    print(f"Console logs: {len(logs)} entries")

    # Clean up
    await driver.close()

if __name__ == "__main__":
    asyncio.run(test_browser())
```

### 2. Using the Agent Framework

```python
#!/usr/bin/env python3
import asyncio
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), 'claude-agent-runtime'))

from core.agent import ClaudeAgent
from drivers.playwright_driver import BrowserDriver

async def test_agent():
    # Create components
    driver = BrowserDriver()
    agent = ClaudeAgent(driver=driver)

    # Initialize
    await agent.initialize()

    # Execute task
    result = await agent.execute_task(
        "Test EmojiFusion UI",
        context={"url": "http://localhost:3000"}
    )
    print(f"Task result: {result['status']}")

    # Analyze page
    analysis = await agent.analyze_page()
    print(f"Found {analysis['elementCounts']['buttons']} buttons")
    print(f"Found {analysis['elementCounts']['inputs']} inputs")

    # Wait for condition
    has_input = await agent.wait_for_condition(
        "document.querySelector('input') !== null",
        timeout=5
    )
    print(f"Input element found: {has_input}")

    # Clean up
    await agent.cleanup()

if __name__ == "__main__":
    asyncio.run(test_agent())
```

### 3. Console Diagnostics

```python
#!/usr/bin/env python3
import asyncio
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), 'claude-agent-runtime'))

from drivers.playwright_driver import BrowserDriver
from utils.diagnostics import ConsoleDiagnostics

async def test_diagnostics():
    driver = BrowserDriver()
    await driver.init(headless=False)

    # Navigate and interact with page
    await driver.navigate("http://localhost:3000")
    await asyncio.sleep(2)

    # Get console logs
    logs = await driver.console_logs()

    # Analyze with diagnostics
    diagnostics = ConsoleDiagnostics()
    diagnostics.add_logs(logs)

    # Check for errors
    if diagnostics.has_errors():
        print("ERRORS DETECTED:")
        for error in diagnostics.get_errors():
            print(f"  - {error}")
    else:
        print("No errors found!")

    # Print full report
    print("\n" + diagnostics.generate_report())

    await driver.close()

if __name__ == "__main__":
    asyncio.run(test_diagnostics())
```

### 4. Performance Monitoring

```python
#!/usr/bin/env python3
import asyncio
import time
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), 'claude-agent-runtime'))

from drivers.playwright_driver import BrowserDriver
from utils.diagnostics import PerformanceMonitor

async def test_performance():
    driver = BrowserDriver()
    monitor = PerformanceMonitor()

    await driver.init()

    # Measure page load
    start = time.time()
    await driver.navigate("http://localhost:3000")
    load_time = time.time() - start
    monitor.record_metric("page_load_time", load_time)

    # Measure generation (if API is running)
    start = time.time()
    await driver.eval("""
        fetch('http://127.0.0.1:3001/api/generate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({words: 'test', mode: 'emoji', tone: 'cute'})
        })
    """)
    api_time = time.time() - start
    monitor.record_metric("api_response_time", api_time)

    # Print report
    print(monitor.generate_report())

    await driver.close()

if __name__ == "__main__":
    asyncio.run(test_performance())
```

## Using with Existing EmojiFusion Scripts

All the Python debug/test scripts in the project root already use this runtime:

- `debug-api.py` - Debug API connections
- `elite-demo.py` - Comprehensive UI testing
- `ui-analyzer.py` - Analyze UI components
- `test-emojifusion.py` - Test generation flow
- `mobile-demo.py` - Mobile-specific testing

They all import it the same way:

```python
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'claude-agent-runtime'))

from drivers.playwright_driver import BrowserDriver
from core.agent import ClaudeAgent
```

## Browser Types

You can specify different browsers:

```python
# Chromium (default)
driver = BrowserDriver(browser_type="chromium")

# Firefox
driver = BrowserDriver(browser_type="firefox")

# WebKit (Safari)
driver = BrowserDriver(browser_type="webkit")
```

## Screenshots

Screenshots are automatically saved to `screenshots/` directory:

```python
# Auto-named screenshot
path = await driver.screenshot()
# Output: screenshots/screenshot_20241017_123045_123.png

# Custom filename
path = await driver.screenshot("my_test.png")
# Output: screenshots/my_test.png

# Full page screenshot
path = await driver.screenshot(full_page=True)
```

## Console Log Format

Console logs are captured with type prefixes:

- `[LOG]` - Normal console.log()
- `[ERROR]` - console.error()
- `[WARNING]` - console.warn()
- `[PAGE_ERROR]` - Uncaught JavaScript errors

## API Reference

### BrowserDriver

```python
driver = BrowserDriver(browser_type="chromium")

# Initialize browser
await driver.init(headless=True, viewport={"width": 1280, "height": 720})

# Navigation
await driver.navigate(url, wait_until="networkidle")
await driver.reload()
await driver.go_back()
await driver.go_forward()

# JavaScript execution
result = await driver.eval("document.title")

# Element interaction
await driver.click(selector, timeout=10000)
await driver.fill(selector, text, timeout=10000)
await driver.wait_for_selector(selector, timeout=10000, state="visible")

# Information retrieval
html = await driver.get_html()
title = await driver.get_title()
url = await driver.get_url()
logs = await driver.console_logs()

# Screenshots
path = await driver.screenshot(filename=None, full_page=False)

# Cleanup
await driver.close()
```

### ClaudeAgent

```python
agent = ClaudeAgent(driver=driver, config={})

# Initialize
await agent.initialize()

# Execute tasks
result = await agent.execute_task("task description", context={})

# Page analysis
analysis = await agent.analyze_page()

# Wait for conditions
success = await agent.wait_for_condition("JS expression", timeout=10)

# History
history = await agent.get_task_history()
await agent.clear_history()

# Cleanup
await agent.cleanup()
```

### ConsoleDiagnostics

```python
diagnostics = ConsoleDiagnostics()

# Add logs
diagnostics.add_log(log)
diagnostics.add_logs(logs)

# Query
errors = diagnostics.get_errors()
warnings = diagnostics.get_warnings()
has_errors = diagnostics.has_errors()

# Search
matches = diagnostics.search_logs(pattern, case_sensitive=False)

# Reports
summary = diagnostics.get_summary()
report = diagnostics.generate_report()

# Clear
diagnostics.clear()
```

### PerformanceMonitor

```python
monitor = PerformanceMonitor()

# Record
monitor.record_metric(name, value)

# Query
values = monitor.get_metric(name)
avg = monitor.get_average(name)
min_val = monitor.get_min(name)
max_val = monitor.get_max(name)
latest = monitor.get_latest(name)

# Reports
summary = monitor.get_summary()
report = monitor.generate_report()

# Clear
monitor.clear(metric_name=None)
```

## Troubleshooting

### Python Not Found

Install Python 3.8+ and ensure it's in your PATH:

```bash
# Windows
python --version

# macOS/Linux
python3 --version
```

### Playwright Installation Fails

```bash
# Uninstall and reinstall
pip uninstall playwright
pip install playwright
playwright install
```

### Browser Won't Launch

Check system dependencies:

```bash
# Ubuntu/Debian
sudo playwright install-deps

# Check installed browsers
playwright install --help
```

### Import Errors

Ensure the path is correctly added:

```python
import sys
import os

# This must point to the directory containing claude-agent-runtime
sys.path.append(os.path.join(os.path.dirname(__file__), 'claude-agent-runtime'))
```

### Port Already in Use

If you see connection errors, check that the dev servers are running:

```bash
# Terminal 1: API server
node real-api.cjs

# Terminal 2: Vite dev server
npm run dev
```

## Best Practices

1. **Always use headless=True in CI/CD** for faster execution
2. **Set appropriate viewports** for mobile testing
3. **Use async context managers** for automatic cleanup:
   ```python
   async with BrowserDriver() as driver:
       await driver.init()
       # Use driver...
   # Automatically closed
   ```
4. **Clear console logs periodically** to avoid memory issues
5. **Wait for selectors** instead of using fixed delays
6. **Capture screenshots on failures** for debugging

## Integration with Claude Code

This runtime is designed to work with Claude Code for:

- **Automated UI testing** - Test EmojiFusion features
- **Browser interaction workflows** - Automate complex user flows
- **Console error detection** - Monitor for JavaScript errors
- **Performance benchmarking** - Track load times and API response times
- **Screenshot-based verification** - Visual regression testing

The agent framework provides structured patterns that Claude can use to perform complex multi-step browser automation tasks autonomously.

## Next Steps

1. Read the full API documentation in `claude-agent-runtime/README.md`
2. Explore the existing test scripts (`debug-api.py`, `elite-demo.py`, etc.)
3. Create custom automation scripts for your testing needs
4. Integrate with CI/CD pipelines for automated testing

## Support

For issues or questions about the claude-agent-runtime:

1. Check the README in `claude-agent-runtime/README.md`
2. Review the example scripts
3. Consult Playwright documentation: https://playwright.dev/python/
