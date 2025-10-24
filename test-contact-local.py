#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AyoType Contact Page Testing Script
Tests the contact page running on localhost using Claude Agent Runtime
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

async def test_contact_page():
    """Test AyoType contact page on localhost"""

    print("📧 Starting Contact Page Browser Test...")
    print("=" * 60)

    # Initialize browser driver
    driver = BrowserDriver()
    diagnostics = ConsoleDiagnostics()

    try:
        # Initialize browser (visible, not headless)
        await driver.init(headless=False, viewport={"width": 1280, "height": 720})
        print("✅ Browser initialized")

        # Navigate to Contact Page
        url = "http://127.0.0.1:3000/apps/landing/contact.html"
        print(f"\n📍 Navigating to {url}")
        await driver.navigate(url)
        await asyncio.sleep(2)  # Wait for page to load

        # Take initial screenshot
        screenshot1 = await driver.screenshot()
        print(f"📸 Initial screenshot: {screenshot1}")

        # Get page title
        title = await driver.get_title()
        print(f"📄 Page title: {title}")

        # Check for contact form elements
        print("\n🔍 Checking contact form structure...")

        form_analysis = await driver.eval("""
            ({
                hasForm: !!document.querySelector('form'),
                hasNameField: !!document.querySelector('input[name="name"], input#name'),
                hasEmailField: !!document.querySelector('input[name="email"], input#email, input[type="email"]'),
                hasMessageField: !!document.querySelector('textarea[name="message"], textarea#message'),
                hasSubmitButton: !!document.querySelector('button[type="submit"], input[type="submit"]'),
                inputCount: document.querySelectorAll('input').length,
                textareaCount: document.querySelectorAll('textarea').length,
                buttonCount: document.querySelectorAll('button').length
            })
        """)

        print(f"  • Form element: {'✅' if form_analysis['hasForm'] else '❌'}")
        print(f"  • Name field: {'✅' if form_analysis['hasNameField'] else '❌'}")
        print(f"  • Email field: {'✅' if form_analysis['hasEmailField'] else '❌'}")
        print(f"  • Message field: {'✅' if form_analysis['hasMessageField'] else '❌'}")
        print(f"  • Submit button: {'✅' if form_analysis['hasSubmitButton'] else '❌'}")
        print(f"  • Total inputs: {form_analysis['inputCount']}")
        print(f"  • Total textareas: {form_analysis['textareaCount']}")
        print(f"  • Total buttons: {form_analysis['buttonCount']}")

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
        has_valid_form = (form_analysis['hasForm'] and
                         form_analysis['hasEmailField'] and
                         form_analysis['hasSubmitButton'])

        if not diagnostics.has_errors() and has_valid_form:
            print("✅ TEST PASSED: Contact page is working correctly!")
        elif has_valid_form:
            print("⚠️  TEST PARTIAL: Form present but has console errors")
        else:
            print("❌ TEST FAILED: Contact form incomplete")
        print("=" * 60)

        # Keep browser open for manual inspection
        print("\n👀 Browser will stay open for 15 seconds for manual inspection...")
        await asyncio.sleep(15)

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
    asyncio.run(test_contact_page())
