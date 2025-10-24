#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Contact Form Submission Test
Tests form submission with API integration
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

async def test_contact_form_submission():
    """Test contact form submission end-to-end"""

    print("📧 Starting Contact Form Submission Test...")
    print("=" * 60)

    driver = BrowserDriver()
    diagnostics = ConsoleDiagnostics()

    try:
        # Initialize browser
        await driver.init(headless=False, viewport={"width": 1280, "height": 720})
        print("✅ Browser initialized")

        # Navigate to contact page
        url = "http://127.0.0.1:3000/apps/landing/contact.html"
        print(f"\n📍 Navigating to {url}")
        await driver.navigate(url)
        await asyncio.sleep(2)

        # Take screenshot
        screenshot1 = await driver.screenshot()
        print(f"📸 Initial screenshot: {screenshot1}")

        # Mock reCAPTCHA Enterprise for testing
        print("\n🔧 Mocking reCAPTCHA Enterprise...")
        await driver.eval("""
            window.grecaptcha = {
                enterprise: {
                    execute: async () => {
                        console.log('✅ Mock reCAPTCHA executed');
                        return 'mock-recaptcha-token-for-testing';
                    }
                }
            };
            console.log('✅ reCAPTCHA mocked successfully');
        """)
        await asyncio.sleep(1)

        # Fill in form fields
        print("\n✏️  Filling in form fields...")

        test_data = {
            'name': 'Test User',
            'email': 'test@example.com',
            'subject': 'Test Submission from Automated Test',
            'message': 'This is an automated test message to verify the contact form works correctly.'
        }

        await driver.fill('#name', test_data['name'])
        print(f"  ✅ Name: {test_data['name']}")

        await driver.fill('#email', test_data['email'])
        print(f"  ✅ Email: {test_data['email']}")

        await driver.fill('#subject', test_data['subject'])
        print(f"  ✅ Subject: {test_data['subject']}")

        await driver.fill('#message', test_data['message'])
        print(f"  ✅ Message: {test_data['message'][:50]}...")

        # Take screenshot before submission
        screenshot2 = await driver.screenshot()
        print(f"\n📸 Form filled screenshot: {screenshot2}")

        # Submit form
        print("\n📤 Submitting form...")
        await driver.eval("document.querySelector('.submit-btn').click()")

        # Wait for submission to complete
        print("⏳ Waiting for response...")
        await asyncio.sleep(5)

        # Check for success/error message
        print("\n🔍 Checking response...")
        response_check = await driver.eval("""
            ({
                messageDiv: document.querySelector('.message'),
                messageText: document.querySelector('.message')?.textContent || '',
                messageClass: document.querySelector('.message')?.className || '',
                isVisible: document.querySelector('.message.show') !== null,
                isSuccess: document.querySelector('.message.success.show') !== null,
                isError: document.querySelector('.message.error.show') !== null,
                buttonLoading: document.querySelector('.submit-btn.loading') !== null,
                buttonDisabled: document.querySelector('.submit-btn').disabled
            })
        """)

        print(f"  • Message visible: {response_check['isVisible']}")
        print(f"  • Message text: {response_check['messageText']}")
        print(f"  • Success: {response_check['isSuccess']}")
        print(f"  • Error: {response_check['isError']}")
        print(f"  • Button still loading: {response_check['buttonLoading']}")

        # Take screenshot after submission
        screenshot3 = await driver.screenshot()
        print(f"\n📸 After submission screenshot: {screenshot3}")

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

        # Show relevant info logs
        info_logs = [log for log in logs if '[INFO]' in log or '[LOG]' in log]
        if info_logs:
            print(f"\nℹ️  Info logs ({len(info_logs)}):")
            for log in info_logs[-5:]:  # Show last 5
                print(f"  • {log}")

        # Generate diagnostics report
        print("\n" + "=" * 60)
        print("📊 DIAGNOSTICS REPORT")
        print("=" * 60)
        print(diagnostics.generate_report())

        # Final verdict
        print("\n" + "=" * 60)

        if response_check['isSuccess']:
            print("✅ TEST PASSED: Form submitted successfully!")
        elif response_check['isError']:
            print("⚠️  TEST PARTIAL: Form submitted but got error message")
        elif response_check['messageText']:
            print(f"ℹ️  TEST INFO: Got message - {response_check['messageText']}")
        else:
            print("❌ TEST FAILED: No response message detected")

        print("=" * 60)

        # Keep browser open for inspection
        print("\n👀 Browser will stay open for 20 seconds for manual inspection...")
        await asyncio.sleep(20)

    except Exception as e:
        print(f"\n❌ TEST ERROR: {e}")
        import traceback
        traceback.print_exc()

    finally:
        print("\n🧹 Closing browser...")
        await driver.close()
        print("✅ Test complete")

if __name__ == "__main__":
    asyncio.run(test_contact_form_submission())
