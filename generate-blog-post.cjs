#!/usr/bin/env node
/**
 * Blog Post Generator for Combo of the Day
 * Creates markdown files and metadata for blog integration
 *
 * Usage:
 *   node generate-blog-post.cjs
 *   node generate-blog-post.cjs 2025-01-17
 */

const fs = require('fs');
const path = require('path');

const BLOG_DATA_FILE = path.join(__dirname, 'combo-of-the-day.json');
const BLOG_OUTPUT_DIR = path.join(__dirname, 'public', 'blog', 'combo-of-the-day');
const SOCIAL_OUTPUT_DIR = path.join(__dirname, 'public', 'social-posts');

// Ensure directories exist
function ensureDirectories() {
  [BLOG_OUTPUT_DIR, SOCIAL_OUTPUT_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    }
  });
}

// Get tone emoji
function getToneEmoji(tone) {
  const emojis = {
    cute: '🐣',
    cool: '😎',
    chaotic: '⚡',
    romantic: '💕',
    minimal: '◽',
    nostalgic: '🌙'
  };
  return emojis[tone] || '✨';
}

// Format date nicely
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Generate markdown blog post
function generateMarkdown(data) {
  const toneEmoji = getToneEmoji(data.tone);
  const formattedDate = formatDate(data.date);

  return `---
title: "Combo of the Day: ${data.name}"
date: ${data.date}
slug: combo-of-the-day-${data.date}
category: emojifusion
tags: [emoji, combo, ${data.tone}, ${data.theme.replace(/\s+/g, '-')}]
image: ${data.png_url || '/og-image-emojifusion.png'}
description: "${data.description} — Today's featured EmojiFusion combo brings ${data.tone} vibes to your messages."
author: EmojiFusion Bot
canonical: https://emojifusion.ayotype.com/blog/combo-of-the-day/${data.date}
---

# ${data.combo}

**Combo of the Day** · ${formattedDate}

## About This Combo

- **Theme:** ${data.theme} ${toneEmoji}
- **Tone:** ${data.tone}
- **Vibe:** ${data.description}

${data.description} — Today's featured combination brings **${data.tone}** energy to your messages and content. Perfect for expressing ${data.theme} moments in your communications.

## The Combo

\`\`\`
${data.combo}
\`\`\`

## More Variations

Today's generation created ${data.all_results.emoji.length} emoji combinations${data.all_results.ascii.length > 0 ? ` and ${data.all_results.ascii.length} ASCII art pieces` : ''}:

${data.all_results.emoji.slice(0, 6).map((item, i) =>
  `${i + 1}. **${item.combo}** — ${item.name}`
).join('\n')}

${data.all_results.ascii.length > 0 ? `
### ASCII Art Variations

\`\`\`
${data.all_results.ascii[0].combo}
\`\`\`
` : ''}

## How to Use

Copy and paste this combo into:
- 💬 Text messages and chat apps
- 📧 Emails for a personal touch
- 📱 Social media posts and comments
- ✍️ Creative writing and blogs
- 🎨 Design mockups and presentations

## Create Your Own

Want to generate your own custom combos? Try [EmojiFusion](https://emojifusion.ayotype.com) — our free tool that creates unique emoji and ASCII art combinations tailored to your words and mood.

**Features:**
- ✨ AI-powered generation
- 🎭 6 different tones (cute, cool, chaotic, romantic, minimal, nostalgic)
- 🎨 Emoji + ASCII art output
- 📱 Mobile-optimized interface
- 💾 Save favorites and history
- 📸 Export as PNG images

---

*EmojiFusion is created by [Ayotype](https://ayotype.com) — Making digital communication more expressive, one combo at a time.*

<div class="combo-cta">
  <a href="https://emojifusion.ayotype.com" class="btn-primary">
    ✨ Try EmojiFusion Now
  </a>
  <a href="/blog/combo-of-the-day" class="btn-secondary">
    📅 View All Combos
  </a>
</div>
`;
}

// Generate social media post templates
function generateSocialPosts(data) {
  const toneEmoji = getToneEmoji(data.tone);

  return {
    twitter: {
      text: `✨ Combo of the Day

${data.combo}

Theme: ${data.theme} ${toneEmoji}
Vibe: ${data.description}

Create your own at emojifusion.ayotype.com

#EmojiFusion #EmojiArt #${data.tone}Vibes`,
      image: data.png_url
    },

    instagram: {
      text: `✨ Combo of the Day ✨

${data.combo}

Today's vibe: ${data.theme} ${toneEmoji}
${data.description}

Want to create your own? Link in bio! 👆

#EmojiFusion #EmojiArt #EmojiCombo #DigitalArt #${data.tone.charAt(0).toUpperCase() + data.tone.slice(1)}Vibes #CreativeTools #Ayotype`,
      image: data.png_url
    },

    threads: {
      text: `✨ Combo of the Day

${data.combo}

${data.description} — Today we're feeling ${data.theme} vibes ${toneEmoji}

Create your own custom combos at emojifusion.ayotype.com`,
      image: data.png_url
    },

    linkedin: {
      text: `Combo of the Day: ${data.name}

${data.combo}

At Ayotype, we believe in making digital communication more expressive. Today's EmojiFusion combo brings "${data.theme}" energy to your messages — ${data.description.toLowerCase()}.

Whether you're crafting marketing copy, designing presentations, or just want to add personality to your communications, the right emoji combination can make all the difference.

Try EmojiFusion: emojifusion.ayotype.com

#DigitalCommunication #CreativeTools #Emoji #ContentCreation`,
      image: data.png_url
    },

    bluesky: {
      text: `✨ Combo of the Day

${data.combo}

${data.theme} ${toneEmoji} — ${data.description}

emojifusion.ayotype.com`,
      image: data.png_url
    },

    mastodon: {
      text: `✨ #ComboOfTheDay

${data.combo}

Theme: ${data.theme} ${toneEmoji}
Vibe: ${data.description}

Create your own at emojifusion.ayotype.com

#EmojiFusion #EmojiArt #CreativeTools #${data.tone}`,
      image: data.png_url
    }
  };
}

// Generate email newsletter snippet
function generateEmailSnippet(data) {
  const toneEmoji = getToneEmoji(data.tone);
  const formattedDate = formatDate(data.date);

  return `<!-- EmojiFusion Combo of the Day -->
<div style="background: linear-gradient(135deg, #1a1a1a, #0a0a0a); border-radius: 16px; padding: 32px; text-align: center; margin: 24px 0;">
  <h2 style="color: #ffb6c1; font-size: 24px; margin: 0 0 16px 0;">
    ✨ Combo of the Day
  </h2>

  <div style="font-size: 48px; line-height: 1.2; margin: 16px 0;">
    ${data.combo}
  </div>

  <p style="color: #b6b6b1; font-size: 18px; margin: 16px 0 8px 0;">
    <strong>${data.theme}</strong> ${toneEmoji}
  </p>

  <p style="color: #9a9a96; font-size: 14px; margin: 0 0 24px 0;">
    ${data.description}
  </p>

  <a href="https://emojifusion.ayotype.com"
     style="display: inline-block; background: linear-gradient(135deg, #FF79C6, #FFD94E);
            color: #0a0a0a; padding: 12px 32px; border-radius: 24px;
            text-decoration: none; font-weight: 600; font-size: 16px;">
    Try EmojiFusion
  </a>

  <p style="color: #666; font-size: 12px; margin: 16px 0 0 0;">
    ${formattedDate}
  </p>
</div>
`;
}

// Save all outputs
function saveAllOutputs(data) {
  const date = data.date;

  // 1. Markdown blog post
  const markdown = generateMarkdown(data);
  const mdPath = path.join(BLOG_OUTPUT_DIR, `${date}.md`);
  fs.writeFileSync(mdPath, markdown);
  console.log(`✅ Blog post saved: ${mdPath}`);

  // 2. Social media templates
  const socialPosts = generateSocialPosts(data);
  const socialPath = path.join(SOCIAL_OUTPUT_DIR, `${date}.json`);
  fs.writeFileSync(socialPath, JSON.stringify(socialPosts, null, 2));
  console.log(`✅ Social posts saved: ${socialPath}`);

  // 3. Email newsletter snippet
  const emailSnippet = generateEmailSnippet(data);
  const emailPath = path.join(SOCIAL_OUTPUT_DIR, `${date}-email.html`);
  fs.writeFileSync(emailPath, emailSnippet);
  console.log(`✅ Email snippet saved: ${emailPath}`);

  // 4. Individual platform files for easy copying
  Object.entries(socialPosts).forEach(([platform, content]) => {
    const platformPath = path.join(SOCIAL_OUTPUT_DIR, `${date}-${platform}.txt`);
    fs.writeFileSync(platformPath, content.text);
  });
  console.log(`✅ Platform-specific posts saved`);
}

// Main function
function main() {
  console.log('📝 EmojiFusion - Blog Post Generator\n');

  // Check if combo data exists
  if (!fs.existsSync(BLOG_DATA_FILE)) {
    console.error('❌ Error: combo-of-the-day.json not found');
    console.error('   Run: node generate-combo-of-the-day.cjs first');
    process.exit(1);
  }

  // Load combo data
  const combos = JSON.parse(fs.readFileSync(BLOG_DATA_FILE, 'utf8'));

  // Get date from args or use today
  const targetDate = process.argv[2] || new Date().toISOString().split('T')[0];
  console.log(`📅 Generating blog content for: ${targetDate}\n`);

  // Find combo for this date
  const data = combos.find(c => c.date === targetDate);

  if (!data) {
    console.error(`❌ Error: No combo found for ${targetDate}`);
    console.error('   Run: node generate-combo-of-the-day.cjs ${targetDate} first');
    process.exit(1);
  }

  console.log(`🎨 Theme: ${data.theme}`);
  console.log(`🎭 Tone: ${data.tone}`);
  console.log(`📝 Combo: ${data.combo}\n`);

  // Ensure output directories exist
  ensureDirectories();

  // Generate and save all outputs
  saveAllOutputs(data);

  console.log('\n✨ Blog content generated successfully!');
  console.log(`\n📊 Generated files:`);
  console.log(`   • Markdown blog post`);
  console.log(`   • Social media templates (6 platforms)`);
  console.log(`   • Email newsletter snippet`);
  console.log(`   • Platform-specific text files`);
  console.log(`\n📂 Output directories:`);
  console.log(`   • Blog: ${BLOG_OUTPUT_DIR}`);
  console.log(`   • Social: ${SOCIAL_OUTPUT_DIR}`);
}

// Run
main();
