/**
 * Simple UI Test - Verify generation works in browser
 */

const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Starting simple generation test...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  // Collect console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    console.log('1️⃣ Navigating to app...');
    await page.goto('http://127.0.0.1:3000/app.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    console.log('2️⃣ Entering text...');
    const textarea = page.locator('textarea.query-input');
    await textarea.click();
    await textarea.fill('space cat');
    await page.waitForTimeout(1000);

    console.log('3️⃣ Clicking Generate button...');
    const generateBtn = page.locator('button.generate-btn');

    // Force click to avoid stability issues
    await generateBtn.click({ force: true });

    console.log('4️⃣ Waiting for results...');
    await page.waitForSelector('.result-card', { timeout: 20000 });
    await page.waitForTimeout(2000);

    const resultCount = await page.locator('.result-card').count();
    console.log(`✅ SUCCESS! Generated ${resultCount} combo cards\n`);

    await page.screenshot({ path: 'screenshots/05-generation-success.png', fullPage: true });
    console.log('📸 Screenshot saved: screenshots/05-generation-success.png\n');

    // Check console errors
    if (consoleErrors.length === 0) {
      console.log('✅ No console errors\n');
    } else {
      console.log(`⚠️ Found ${consoleErrors.length} console errors:`);
      consoleErrors.forEach(err => console.log(`   ${err}`));
      console.log('');
    }

    console.log('💡 Keeping browser open for 8 seconds...');
    await page.waitForTimeout(8000);

    console.log('\n✨ Test completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: 'screenshots/test-failure.png', fullPage: true });
    await page.waitForTimeout(5000);
  } finally {
    await browser.close();
  }
})();
