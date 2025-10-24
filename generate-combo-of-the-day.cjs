#!/usr/bin/env node

/**
 * Generate Combo of the Day
 *
 * Fetches today's combo from the API and stores it in JSON format.
 * Optionally generates PNG images if canvas is installed.
 *
 * Usage:
 *   node generate-combo-of-the-day.cjs [YYYY-MM-DD]
 *
 * If no date is provided, uses today's date.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const API_URL = 'https://ayotype.com/api/combo-of-the-day';
const DATA_FILE = path.join(__dirname, 'public', 'combo-of-the-day.json');
const IMAGE_DIR = path.join(__dirname, 'public', 'combo-of-the-day');
const MAX_DAYS = 90; // Keep last 90 days

// Get target date from command line or use today
const targetDate = process.argv[2] || new Date().toISOString().split('T')[0];

// Validate date format
if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
  console.error('❌ Invalid date format. Use YYYY-MM-DD');
  process.exit(1);
}

console.log(`🎨 Generating combo for ${targetDate}...`);

/**
 * Fetch combo from API
 */
function fetchCombo(date) {
  return new Promise((resolve, reject) => {
    const url = `${API_URL}?date=${date}`;

    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`API returned ${res.statusCode}: ${data}`));
          return;
        }

        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (err) {
          reject(new Error(`Failed to parse JSON: ${err.message}`));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Load existing combo data
 */
function loadExistingData() {
  if (!fs.existsSync(DATA_FILE)) {
    return [];
  }

  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.warn('⚠️  Failed to load existing data, starting fresh');
    return [];
  }
}

/**
 * Save combo data
 */
function saveComboData(combos) {
  // Ensure directory exists
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Sort by date (newest first)
  combos.sort((a, b) => b.date.localeCompare(a.date));

  // Keep only last MAX_DAYS
  const trimmed = combos.slice(0, MAX_DAYS);

  // Write to file
  fs.writeFileSync(DATA_FILE, JSON.stringify(trimmed, null, 2));
  console.log(`✅ Saved ${trimmed.length} combos to ${DATA_FILE}`);
}

/**
 * Generate PNG image (optional)
 */
async function generateImage(combo) {
  try {
    // Try to load canvas module
    const { createCanvas } = require('canvas');

    // Create canvas
    const width = 800;
    const height = 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#1a1a1a');
    gradient.addColorStop(1, '#0a0a0a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Combo text (emoji + ASCII)
    ctx.fillStyle = '#f7f7f5';
    ctx.font = 'bold 80px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(combo.combo, width / 2, height / 2 - 40);

    // Theme and tone
    ctx.font = '24px system-ui, sans-serif';
    ctx.fillStyle = '#b6b6b1';
    ctx.fillText(`${combo.theme} · ${combo.tone}`, width / 2, height / 2 + 60);

    // Date
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillStyle = '#9a9a96';
    const dateStr = new Date(combo.date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
    ctx.fillText(dateStr, width / 2, height / 2 + 100);

    // Save PNG
    const imageFile = path.join(IMAGE_DIR, `${combo.date}.png`);

    // Ensure directory exists
    if (!fs.existsSync(IMAGE_DIR)) {
      fs.mkdirSync(IMAGE_DIR, { recursive: true });
    }

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(imageFile, buffer);

    console.log(`🖼️  Generated PNG: ${imageFile}`);
    return imageFile;

  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      console.log('ℹ️  Canvas not installed, skipping PNG generation');
      console.log('   Install with: npm install canvas');
    } else {
      console.error('⚠️  PNG generation failed:', err.message);
    }
    return null;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    // Fetch combo from API
    console.log(`📡 Fetching from ${API_URL}?date=${targetDate}`);
    const combo = await fetchCombo(targetDate);

    console.log(`✅ Fetched combo: ${combo.combo}`);
    console.log(`   Theme: ${combo.theme} (${combo.tone})`);
    console.log(`   Description: ${combo.description}`);

    // Add PNG URL placeholder (may be generated later)
    combo.png_url = `/combo-of-the-day/${combo.date}.png`;

    // Load existing data
    const existingCombos = loadExistingData();

    // Remove existing entry for this date (if any)
    const filtered = existingCombos.filter(c => c.date !== targetDate);

    // Add new combo
    filtered.push(combo);

    // Save updated data
    saveComboData(filtered);

    // Generate PNG image (optional)
    await generateImage(combo);

    console.log('');
    console.log('🎉 Done!');
    console.log(`   Data file: ${DATA_FILE}`);
    console.log(`   View at: https://ayotype.com/combo-archive`);

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

// Run main function
main();
