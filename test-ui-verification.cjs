/**
 * UI Verification Test for EmojiFusion
 * Tests that the Lines dropdown has been removed and generation works
 */

const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Starting UI verification test...\n');

  // Launch browser in non-headless mode so we can see it
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500 // Slow down actions for visibility
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  // Collect console logs
  const consoleLogs = [];
  const consoleErrors = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push({ type: msg.type(), text });
    if (msg.type() === 'error') {
      consoleErrors.push(text);
    }
  });

  try {
    console.log('1️⃣ Navigating to http://127.0.0.1:3000/app.html...');
    await page.goto('http://127.0.0.1:3000/app.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    console.log('✅ Page loaded successfully\n');

    // Take initial screenshot
    await page.screenshot({ path: 'screenshots/01-initial-load.png', fullPage: true });
    console.log('📸 Screenshot saved: screenshots/01-initial-load.png\n');

    // Check for Lines dropdown (should NOT exist)
    console.log('2️⃣ Checking for Lines dropdown...');
    const linesDropdown = await page.locator('select').filter({ hasText: /lines/i }).count();
    const linesLabel = await page.locator('label').filter({ hasText: /lines/i }).count();

    if (linesDropdown === 0 && linesLabel === 0) {
      console.log('✅ Lines dropdown successfully removed from UI\n');
    } else {
      console.log('❌ WARNING: Found potential Lines dropdown elements!\n');
    }

    // Verify Mode and Tone dropdowns exist
    console.log('3️⃣ Verifying Mode and Tone controls...');
    const modeDropdown = await page.locator('#mode-select').count();
    const toneDropdown = await page.locator('#tone-select').count();

    console.log(`   Mode dropdown: ${modeDropdown === 1 ? '✅ Found' : '❌ Missing'}`);
    console.log(`   Tone dropdown: ${toneDropdown === 1 ? '✅ Found' : '❌ Missing'}\n`);

    // Take screenshot of controls
    await page.screenshot({ path: 'screenshots/02-controls.png', fullPage: true });
    console.log('📸 Screenshot saved: screenshots/02-controls.png\n');

    // Test generation flow
    console.log('4️⃣ Testing generation flow...');

    // Enter text
    console.log('   Entering text: "rainbow unicorn"');
    await page.locator('textarea.query-input').fill('rainbow unicorn');
    await page.waitForTimeout(500);

    // Select tone
    console.log('   Selecting tone: cute');
    await page.locator('#tone-select').selectOption('cute');
    await page.waitForTimeout(500);

    // Take screenshot before generation
    await page.screenshot({ path: 'screenshots/03-before-generate.png', fullPage: true });
    console.log('📸 Screenshot saved: screenshots/03-before-generate.png\n');

    // Click Generate button
    console.log('   Clicking Generate button...');
    await page.locator('button:has-text("Generate")').click();

    // Wait for results
    console.log('   Waiting for results...');
    await page.waitForSelector('.result-card', { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Count results
    const resultCount = await page.locator('.result-card').count();
    console.log(`✅ Generated ${resultCount} combo cards\n`);

    // Take screenshot of results
    await page.screenshot({ path: 'screenshots/04-after-generate.png', fullPage: true });
    console.log('📸 Screenshot saved: screenshots/04-after-generate.png\n');

    // Test API endpoint directly
    console.log('5️⃣ Testing API endpoint...');
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          words: 'test',
          mode: 'both',
          tone: 'cute'
          // Note: NO 'lines' parameter sent from frontend
        })
      });
      return {
        ok: res.ok,
        status: res.status,
        data: await res.json()
      };
    });

    console.log(`   API Status: ${response.status} ${response.ok ? '✅' : '❌'}`);
    console.log(`   Emoji combos: ${response.data.emoji?.length || 0}`);
    console.log(`   ASCII combos: ${response.data.ascii?.length || 0}\n`);

    // Check console errors
    console.log('6️⃣ Checking browser console...');
    if (consoleErrors.length === 0) {
      console.log('✅ No console errors found\n');
    } else {
      console.log(`❌ Found ${consoleErrors.length} console errors:`);
      consoleErrors.forEach(err => console.log(`   - ${err}`));
      console.log('');
    }

    // Show some console logs
    console.log('📝 Recent console logs (last 10):');
    consoleLogs.slice(-10).forEach(log => {
      console.log(`   [${log.type}] ${log.text}`);
    });
    console.log('');

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Lines dropdown removed: ${linesDropdown === 0 && linesLabel === 0 ? 'YES' : 'NO'}`);
    console.log(`✅ Mode dropdown present: ${modeDropdown === 1 ? 'YES' : 'NO'}`);
    console.log(`✅ Tone dropdown present: ${toneDropdown === 1 ? 'YES' : 'NO'}`);
    console.log(`✅ Generation works: ${resultCount > 0 ? 'YES' : 'NO'}`);
    console.log(`✅ API endpoint works: ${response.ok ? 'YES' : 'NO'}`);
    console.log(`✅ No console errors: ${consoleErrors.length === 0 ? 'YES' : 'NO'}`);
    console.log('='.repeat(60));
    console.log('\n💡 Browser window will stay open for 10 seconds for manual inspection...');

    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    await page.screenshot({ path: 'screenshots/error-state.png', fullPage: true });
    console.log('📸 Error screenshot saved: screenshots/error-state.png');

    // Keep browser open to inspect error
    console.log('\n💡 Browser will stay open for 15 seconds to inspect error...');
    await page.waitForTimeout(15000);
  } finally {
    await browser.close();
    console.log('\n✨ Test completed. Browser closed.');
  }
})();
