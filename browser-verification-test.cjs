const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function runTests() {
  const browser = await chromium.launch({
    headless: false,  // NON-HEADLESS MODE
    slowMo: 1000,     // Slow down so you can see what's happening
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();
  const results = {
    contactPage: {},
    landingPage: {},
    appPage: {},
    screenshots: []
  };

  // Capture console logs and errors
  const consoleLogs = [];
  const consoleErrors = [];

  page.on('console', msg => {
    const logEntry = `[${msg.type()}] ${msg.text()}`;
    consoleLogs.push(logEntry);
    if (msg.type() === 'error') {
      consoleErrors.push(logEntry);
    }
  });

  page.on('pageerror', error => {
    consoleErrors.push(`[PAGE ERROR] ${error.message}`);
  });

  try {
    console.log('\n=== TEST 1: Contact Page ===\n');

    // Reset console logs
    consoleLogs.length = 0;
    consoleErrors.length = 0;

    await page.goto('http://127.0.0.1:3000/contact.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const contactPageTitle = await page.title();
    const contactPageUrl = page.url();

    // Check if it's a 404
    const is404 = contactPageUrl.includes('404') || await page.locator('text=404').count() > 0;

    // Check for form elements
    const hasForm = await page.locator('form').count() > 0;
    const hasInputs = await page.locator('input, textarea').count() > 0;
    const hasSubmitButton = await page.locator('button[type="submit"], input[type="submit"]').count() > 0;

    results.contactPage = {
      status: is404 ? '404 NOT FOUND' : 'LOADED',
      title: contactPageTitle,
      url: contactPageUrl,
      hasForm,
      hasInputs,
      hasSubmitButton,
      consoleErrors: [...consoleErrors]
    };

    // Screenshot
    const contactScreenshot = 'contact-page-test.png';
    await page.screenshot({ path: contactScreenshot, fullPage: true });
    results.screenshots.push(contactScreenshot);

    console.log(`Status: ${results.contactPage.status}`);
    console.log(`Title: ${contactPageTitle}`);
    console.log(`Form present: ${hasForm}`);
    console.log(`Inputs present: ${hasInputs}`);
    console.log(`Submit button: ${hasSubmitButton}`);
    console.log(`Console errors: ${consoleErrors.length}`);

    console.log('\n=== TEST 2: Landing Page Link ===\n');

    // Reset console logs
    consoleLogs.length = 0;
    consoleErrors.length = 0;

    await page.goto('http://127.0.0.1:3000/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Find EmojiFusion link
    const emojiFusionLink = await page.locator('a:has-text("EmojiFusion"), a[href*="emojifusion"]').first();
    const linkHref = await emojiFusionLink.getAttribute('href').catch(() => null);
    const linkText = await emojiFusionLink.textContent().catch(() => null);

    // Check if it's the correct href
    const isCorrectHref = linkHref === 'https://emojifusion.ayotype.com';
    const isWrongHref = linkHref === '/app' || linkHref === '/app.html';

    results.landingPage = {
      linkFound: !!linkHref,
      linkHref,
      linkText,
      isCorrectHref,
      isWrongHref,
      consoleErrors: [...consoleErrors]
    };

    // Highlight the link
    if (linkHref) {
      await emojiFusionLink.evaluate(el => {
        el.style.border = '3px solid red';
        el.style.backgroundColor = 'yellow';
      });
      await page.waitForTimeout(1000);
    }

    const landingScreenshot = 'landing-page-link-test.png';
    await page.screenshot({ path: landingScreenshot, fullPage: true });
    results.screenshots.push(landingScreenshot);

    console.log(`Link found: ${!!linkHref}`);
    console.log(`Link href: ${linkHref}`);
    console.log(`Link text: ${linkText}`);
    console.log(`Is correct (https://emojifusion.ayotype.com): ${isCorrectHref}`);
    console.log(`Is wrong (/app or /app.html): ${isWrongHref}`);

    console.log('\n=== TEST 3: EmojiFusion App ===\n');

    // Reset console logs
    consoleLogs.length = 0;
    consoleErrors.length = 0;

    await page.goto('http://127.0.0.1:3000/app.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Count dropdowns
    const allSelects = await page.locator('select').all();
    const selectCount = allSelects.length;

    const selectLabels = [];
    for (const select of allSelects) {
      const id = await select.getAttribute('id');
      const name = await select.getAttribute('name');

      // Try to find label
      let labelText = '';
      if (id) {
        const label = await page.locator(`label[for="${id}"]`).textContent().catch(() => '');
        labelText = label.trim();
      }

      // Get options to understand what this select is for
      const options = await select.locator('option').allTextContents();

      selectLabels.push({
        id,
        name,
        label: labelText,
        options: options.slice(0, 3) // First 3 options
      });
    }

    // Check specifically for Mode and Tone dropdowns
    const hasModeDropdown = selectLabels.some(s =>
      s.label?.toLowerCase().includes('mode') ||
      s.options.some(o => o.includes('emoji') || o.includes('word'))
    );

    const hasToneDropdown = selectLabels.some(s =>
      s.label?.toLowerCase().includes('tone') ||
      s.options.some(o => o.includes('cute') || o.includes('cool'))
    );

    const hasLinesDropdown = selectLabels.some(s =>
      s.label?.toLowerCase().includes('line') ||
      s.id?.toLowerCase().includes('line') ||
      s.name?.toLowerCase().includes('line')
    );

    results.appPage = {
      dropdownCount: selectCount,
      dropdowns: selectLabels,
      hasModeDropdown,
      hasToneDropdown,
      hasLinesDropdown,
      consoleErrorsBeforeGeneration: [...consoleErrors]
    };

    console.log(`Dropdown count: ${selectCount}`);
    console.log(`Has Mode dropdown: ${hasModeDropdown}`);
    console.log(`Has Tone dropdown: ${hasToneDropdown}`);
    console.log(`Has Lines dropdown: ${hasLinesDropdown}`);
    console.log('Dropdown details:', JSON.stringify(selectLabels, null, 2));

    // Screenshot before generation
    const appBeforeScreenshot = 'app-page-before-generation.png';
    await page.screenshot({ path: appBeforeScreenshot, fullPage: true });
    results.screenshots.push(appBeforeScreenshot);

    // Test generation with "rainbow"
    console.log('\nTesting generation with "rainbow"...');

    const textarea = page.locator('textarea.query-input, textarea[placeholder*="emoji"], textarea');
    await textarea.first().fill('rainbow');
    await page.waitForTimeout(500);

    // Clear console for generation test
    consoleErrors.length = 0;

    const generateButton = page.locator('button:has-text("Generate"), button[type="submit"]');
    await generateButton.first().click();

    // Wait for results
    await page.waitForTimeout(5000);

    // Check for results
    const hasResults = await page.locator('.combo, .emoji-combo, [class*="combo"]').count() > 0;
    const resultCount = await page.locator('.combo, .emoji-combo, [class*="combo"]').count();

    results.appPage.generation = {
      hasResults,
      resultCount,
      consoleErrorsAfterGeneration: [...consoleErrors]
    };

    console.log(`Results appeared: ${hasResults}`);
    console.log(`Result count: ${resultCount}`);
    console.log(`Console errors during generation: ${consoleErrors.length}`);

    // Screenshot after generation
    const appAfterScreenshot = 'app-page-after-generation.png';
    await page.screenshot({ path: appAfterScreenshot, fullPage: true });
    results.screenshots.push(appAfterScreenshot);

    // Final report
    console.log('\n=== COMPREHENSIVE TEST REPORT ===\n');
    console.log(JSON.stringify(results, null, 2));

    // Write results to file
    fs.writeFileSync('test-results.json', JSON.stringify(results, null, 2));
    console.log('\nResults saved to test-results.json');
    console.log(`Screenshots saved: ${results.screenshots.join(', ')}`);

    // Keep browser open for manual inspection
    console.log('\n⏳ Browser will remain open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('Test error:', error);
    results.error = error.message;

    // Emergency screenshot
    try {
      await page.screenshot({ path: 'error-screenshot.png' });
      results.screenshots.push('error-screenshot.png');
    } catch (e) {
      console.error('Could not take error screenshot:', e);
    }
  } finally {
    await browser.close();
  }

  return results;
}

runTests().then(results => {
  console.log('\n✅ Tests completed');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Tests failed:', error);
  process.exit(1);
});
