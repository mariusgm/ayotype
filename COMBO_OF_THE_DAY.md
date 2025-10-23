# Combo of the Day - Setup Guide

Automated daily combo generation for blog posts and social media.

## 🚀 Quick Start

### 1. Install Dependencies (Optional)

For PNG generation, install the canvas package:

```bash
npm install canvas
```

**Note:** The script works without canvas, but won't generate PNG files. It will still create the JSON data.

### 2. Run Manually

Generate today's combo:

```bash
node generate-combo-of-the-day.cjs
```

Generate for a specific date:

```bash
node generate-combo-of-the-day.cjs 2025-01-17
```

### 3. Output

The script creates:

- **PNG Image**: `public/combo-of-the-day/YYYY-MM-DD.png` (if canvas is installed)
- **JSON Data**: `combo-of-the-day.json` (last 90 days)

## 📅 Automated Scheduling

### Option 1: Cron (Linux/Mac)

Add to crontab (`crontab -e`):

```bash
# Generate combo daily at 3 AM
0 3 * * * cd /path/to/emojifusion && node generate-combo-of-the-day.cjs
```

### Option 2: Task Scheduler (Windows)

1. Open Task Scheduler
2. Create Basic Task
3. Trigger: Daily at 3:00 AM
4. Action: Start a program
   - Program: `node`
   - Arguments: `generate-combo-of-the-day.cjs`
   - Start in: `C:\git_marius\emojifusion`

### Option 3: GitHub Actions (Recommended)

Create `.github/workflows/combo-of-the-day.yml`:

```yaml
name: Generate Combo of the Day

on:
  schedule:
    - cron: '0 3 * * *'  # 3 AM UTC daily
  workflow_dispatch:  # Allow manual trigger

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          npm install
          npm install canvas

      - name: Start API server
        run: node real-api.cjs &

      - name: Wait for server
        run: sleep 5

      - name: Generate combo
        run: node generate-combo-of-the-day.cjs

      - name: Commit and push
        run: |
          git config user.name "Combo Bot"
          git config user.email "bot@ayotype.com"
          git add public/combo-of-the-day/*.png combo-of-the-day.json
          git commit -m "🎨 Combo of the Day: $(date +%Y-%m-%d)"
          git push
```

## 📊 Data Format

The `combo-of-the-day.json` file contains:

```json
[
  {
    "date": "2025-01-17",
    "combo": "🌙✨💫",
    "name": "Moonlit Sparkles",
    "theme": "space vibes",
    "tone": "cool",
    "description": "Cosmic and otherworldly",
    "png_url": "/combo-of-the-day/2025-01-17.png",
    "all_results": {
      "emoji": [...],
      "ascii": [...]
    }
  }
]
```

## 🌐 Blog Integration

### Fetch Latest Combo

```javascript
// On ayotype.com
const response = await fetch('https://emojifusion.ayotype.com/combo-of-the-day.json');
const combos = await response.json();
const today = combos[0]; // Most recent combo
```

### Display on Website

```html
<div class="combo-of-the-day">
  <h2>Combo of the Day</h2>
  <img src="${today.png_url}" alt="${today.name}">
  <p class="combo-text">${today.combo}</p>
  <p class="theme">Theme: ${today.theme} (${today.tone})</p>
  <p class="description">${today.description}</p>
  <a href="https://emojifusion.ayotype.com">Try EmojiFusion →</a>
</div>
```

### Generate Blog Post (Markdown)

```javascript
const blogPost = `---
title: "Combo of the Day: ${today.name}"
date: ${today.date}
image: ${today.png_url}
category: emojifusion
tags: [emoji, ${today.tone}, ${today.theme}]
---

## ${today.combo}

**Theme:** ${today.theme}
**Tone:** ${today.tone}
**Description:** ${today.description}

${today.description} — Today's featured combination brings ${today.tone} vibes to your messages and content.

[Try EmojiFusion →](https://emojifusion.ayotype.com)
`;
```

## 🎨 Themes

The script rotates through 15 curated themes:

- Space vibes (cool)
- Cozy mornings (cute)
- Neon dreams (chaotic)
- Pixel art (nostalgic)
- Rainy nights (romantic)
- Coffee magic (cute)
- Sunset beach (romantic)
- Cyber punk (cool)
- Forest mystical (nostalgic)
- Party lights (chaotic)
- Zen garden (minimal)
- Starry wishes (romantic)
- Retro arcade (nostalgic)
- Neon cats (chaotic)
- Moonlight dance (romantic)

Each date deterministically selects a theme using a hash function.

## 📝 API Endpoint

Create an API route on ayotype.com:

```javascript
// /api/combo-of-the-day
export default async function handler(req, res) {
  const combos = await fetch('https://emojifusion.ayotype.com/combo-of-the-day.json')
    .then(r => r.json());

  const today = combos.find(c => c.date === new Date().toISOString().split('T')[0]);

  if (today) {
    res.json(today);
  } else {
    res.status(404).json({ error: 'No combo for today' });
  }
}
```

## 🐛 Troubleshooting

### Canvas installation fails on Windows

```bash
# Install build tools first
npm install --global windows-build-tools
npm install canvas
```

### API not responding

Make sure the API server is running:

```bash
node real-api.cjs
```

### Permission denied (Linux/Mac)

Make script executable:

```bash
chmod +x generate-combo-of-the-day.cjs
```

## 📱 Social Media

Share combos automatically:

```bash
# In your cron/task
node generate-combo-of-the-day.cjs && node post-to-social.cjs
```

Example `post-to-social.cjs`:

```javascript
const data = JSON.parse(fs.readFileSync('combo-of-the-day.json'));
const today = data[0];

// Post to Twitter/X
await twitter.tweet({
  text: `✨ Combo of the Day\n\n${today.combo}\n\n${today.name} — ${today.description}\n\nTry it: emojifusion.ayotype.com`,
  media: today.png_url
});
```

## 🎯 Next Steps

1. ✅ Run the script once to test
2. ✅ Check `combo-of-the-day.json` output
3. ✅ Set up automated scheduling
4. ⏳ Integrate with ayotype.com blog
5. ⏳ Add social media posting
6. ⏳ Create archive page
