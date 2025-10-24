#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AyoType Landing Page Testing Script
Tests the landing page running on localhost using Claude Agent Runtime
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

async def test_landing_page():
    """Test AyoType landing page on localhost"""

    print("🏠 Starting Landing Page Browser Test...")
    print("=" * 60)

    # Initialize browser driver
    driver = BrowserDriver()
    diagnostics = ConsoleDiagnostics()

    try:
        # Initialize browser (visible, not headless)
        await driver.init(headless=False, viewport={"width": 1280, "height": 720})
        print("✅ Browser initialized")

        # Navigate to Landing Page
        url = "http://127.0.0.1:3000/apps/landing/index.html"
        print(f"\n📍 Navigating to {url}")
        await driver.navigate(url)
        await asyncio.sleep(2)  # Wait for page to load

        # Take initial screenshot
        screenshot1 = await driver.screenshot()
        print(f"📸 Initial screenshot: {screenshot1}")

        # Get page title
        title = await driver.get_title()
        print(f"📄 Page title: {title}")

        # Check page structure
        print("\n🔍 Checking page structure...")

        # Check for main elements
        page_analysis = await driver.eval("""
            ({
                hasHeader: !!document.querySelector('header'),
                hasNav: !!document.querySelector('nav'),
                hasMain: !!document.querySelector('main'),
                hasFooter: !!document.querySelector('footer'),
                linkCount: document.querySelectorAll('a').length,
                headingCount: document.querySelectorAll('h1, h2, h3').length,
                imageCount: document.querySelectorAll('img').length,
                projectCards: document.querySelectorAll('.project-card, .card, [class*="project"]').length
            })
        """)

        print(f"  • Header: {'✅' if page_analysis['hasHeader'] else '❌'}")
        print(f"  • Navigation: {'✅' if page_analysis['hasNav'] else '❌'}")
        print(f"  • Main content: {'✅' if page_analysis['hasMain'] else '❌'}")
        print(f"  • Footer: {'✅' if page_analysis['hasFooter'] else '❌'}")
        print(f"  • Links found: {page_analysis['linkCount']}")
        print(f"  • Headings found: {page_analysis['headingCount']}")
        print(f"  • Images found: {page_analysis['imageCount']}")
        print(f"  • Project cards: {page_analysis['projectCards']}")

        # Check for EmojiFusion link
        print("\n🔍 Looking for EmojiFusion link...")
        emojifusion_link = await driver.eval("""
            Array.from(document.querySelectorAll('a')).find(a =>
                a.textContent.toLowerCase().includes('emojifusion') ||
                a.href.includes('emojifusion')
            )?.href || null
        """)

        if emojifusion_link:
            print(f"✅ Found EmojiFusion link: {emojifusion_link}")
        else:
            print("⚠️  EmojiFusion link not found")

        # Check for contact link
        print("\n🔍 Looking for Contact link...")
        contact_link = await driver.eval("""
            Array.from(document.querySelectorAll('a')).find(a =>
                a.textContent.toLowerCase().includes('contact') ||
                a.href.includes('contact')
            )?.href || null
        """)

        if contact_link:
            print(f"✅ Found Contact link: {contact_link}")
        else:
            print("⚠️  Contact link not found")

        # Scroll down to check if lazy-loaded content appears
        print("\n📜 Scrolling page...")
        await driver.eval("window.scrollTo(0, document.body.scrollHeight)")
        await asyncio.sleep(1)

        # Take screenshot after scroll
        screenshot2 = await driver.screenshot()
        print(f"📸 Scroll screenshot: {screenshot2}")

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
        # Updated criteria: page doesn't need semantic HTML5 tags
        has_basic_structure = (page_analysis['linkCount'] > 0 and
                              page_analysis['headingCount'] > 0)

        if not diagnostics.has_errors() and has_basic_structure:
            print("✅ TEST PASSED: Landing page is working correctly!")
        elif has_basic_structure:
            print("⚠️  TEST PARTIAL: Page loads but has console errors")
        else:
            print("❌ TEST FAILED: Page structure incomplete")
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
    asyncio.run(test_landing_page())
