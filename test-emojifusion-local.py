#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
EmojiFusion Local Testing Script
Tests the EmojiFusion app running on localhost using Claude Agent Runtime
"""

import sys
import os
import asyncio

# Set UTF-8 encoding for Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

# Add claude-agent-runtime to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'claude-agent-runtime'))

from drivers.playwright_driver import BrowserDriver
from utils.diagnostics import ConsoleDiagnostics

async def test_emojifusion():
    """Test EmojiFusion app on localhost"""

    print("🎬 Starting EmojiFusion Browser Test...")
    print("=" * 60)

    # Initialize browser driver
    driver = BrowserDriver()
    diagnostics = ConsoleDiagnostics()

    try:
        # Initialize browser (visible, not headless)
        await driver.init(headless=False, viewport={"width": 390, "height": 844})
        print("✅ Browser initialized")

        # Navigate to EmojiFusion
        url = "http://127.0.0.1:3000/apps/emojifusion/index.html"
        print(f"\n📍 Navigating to {url}")
        await driver.navigate(url)
        await asyncio.sleep(2)  # Wait for page to load

        # Take initial screenshot
        screenshot1 = await driver.screenshot()
        print(f"📸 Initial screenshot: {screenshot1}")

        # Get page title
        title = await driver.get_title()
        print(f"📄 Page title: {title}")

        # Check for textarea
        print("\n🔍 Looking for query input...")
        textarea = await driver.wait_for_selector("textarea.query-input", timeout=5000)
        print("✅ Found textarea")

        # Enter test text
        test_text = "rainbow cyber unicorn"
        print(f"\n⌨️  Entering text: '{test_text}'")
        await driver.fill("textarea.query-input", test_text)
        await asyncio.sleep(1)

        # Find and click Generate button
        print("\n🔍 Looking for Generate button...")
        generate_button = await driver.wait_for_selector("button:has-text('Generate')", timeout=5000)
        print("✅ Found Generate button")

        print("🖱️  Clicking Generate button...")
        # Use JavaScript click to bypass animation stability issues
        click_result = await driver.eval("""
            document.querySelector('button.generate-btn')?.click()
        """)
        await asyncio.sleep(1)  # Give it a moment to register the click

        # Wait for results
        print("\n⏳ Waiting for combos to appear...")
        await asyncio.sleep(5)  # Wait for API call and rendering

        # Check for combos (use correct class name: result-combo)
        combos_count = await driver.eval("document.querySelectorAll('.result-combo').length")
        print(f"\n📊 Results: Found {combos_count} combos")

        if combos_count > 0:
            print("✅ Generation successful!")

            # Get first combo text
            first_combo = await driver.eval("""
                document.querySelector('.result-combo')?.textContent || 'N/A'
            """)
            print(f"🎨 First combo: {first_combo}")
        else:
            print("⚠️  No combos found - generation may have failed")

        # Take screenshot of results
        screenshot2 = await driver.screenshot()
        print(f"\n📸 Results screenshot: {screenshot2}")

        # Get console logs
        print("\n📋 Checking console logs...")
        logs = await driver.console_logs()
        diagnostics.add_logs(logs)

        # Check for errors
        if diagnostics.has_errors():
            print("\n❌ ERRORS FOUND IN CONSOLE:")
            for error in diagnostics.get_errors():
                print(f"  • {error}")
        else:
            print("✅ No console errors detected")

        # Show warnings if any
        warnings = diagnostics.get_warnings()
        if warnings:
            print(f"\n⚠️  {len(warnings)} warnings found:")
            for warning in warnings[:5]:  # Show first 5
                print(f"  • {warning}")

        # Generate diagnostics report
        print("\n" + "=" * 60)
        print("📊 DIAGNOSTICS REPORT")
        print("=" * 60)
        print(diagnostics.generate_report())

        # Final verdict
        print("\n" + "=" * 60)
        if not diagnostics.has_errors() and combos_count > 0:
            print("✅ TEST PASSED: EmojiFusion is working correctly!")
        elif combos_count > 0 and diagnostics.has_errors():
            print("⚠️  TEST PARTIAL: Generation works but has console errors")
        else:
            print("❌ TEST FAILED: Generation did not work")
        print("=" * 60)

        # Keep browser open for manual inspection
        print("\n👀 Browser will stay open for 30 seconds for manual inspection...")
        await asyncio.sleep(30)

    except Exception as e:
        print(f"\n❌ TEST ERROR: {e}")
        import traceback
        traceback.print_exc()

    finally:
        # Clean up
        print("\n🧹 Closing browser...")
        await driver.close()
        print("✅ Test complete")

if __name__ == "__main__":
    asyncio.run(test_emojifusion())
