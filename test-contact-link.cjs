const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('\n=== Testing Contact Link in Footer ===\n');

  // Navigate to landing page
  await page.goto('http://127.0.0.1:3000');
  console.log('✅ Landing page loaded');

  // Find and click contact link
  const contactLink = page.locator('a.social-link:has-text("Contact")');
  const href = await contactLink.getAttribute('href');
  console.log(`Contact link href: ${href}`);

  await contactLink.click();
  await page.waitForLoadState('networkidle');

  const url = page.url();
  const title = await page.title();

  console.log(`\nNavigated to: ${url}`);
  console.log(`Page title: ${title}`);

  const is404 = title.toLowerCase().includes('404') ||
                title.toLowerCase().includes('not found') ||
                await page.locator('text=404').count() > 0;

  if (is404) {
    console.log('❌ Contact page returned 404');
  } else if (title.includes('Contact')) {
    console.log('✅ Contact page loaded successfully!');
  } else {
    console.log('⚠️  Unexpected page loaded');
  }

  // Check for form
  const formPresent = await page.locator('form').count() > 0;
  console.log(`Form present: ${formPresent ? '✅' : '❌'}`);

  await browser.close();
})();
