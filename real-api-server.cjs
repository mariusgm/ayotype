#!/usr/bin/env node
/**
 * Real EmojiFusion API server using Groq API
 * Replaces mock server for development with actual AI generation
 */

const http = require('http');
const url = require('url');
require('dotenv').config();

const PORT = 3001;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
  console.error('❌ GROQ_API_KEY not found in .env file');
  process.exit(1);
}

function getGroqSystemPrompt(words, tone, mode, lines) {
  const validLines = Math.max(1, Math.min(2, lines));
  
  return `EmojiFusion System Prompt (Groq-Optimized for Llama-3.3-70B-Versatile)

You are EmojiFusion — a generator that creates compact, expressive emoji/ascii combos formatted for mobile cards.

GOAL
Generate short, visually balanced combos inspired by the user's topic and tone.
Each combo must contain exactly the number of visual lines specified (1 or 2).
A "line" means one horizontal visual row, not a paragraph or blank line.

INPUT
- topic: "${words}"
- tone: ${tone}
- mode: ${mode}
- lines: ${validLines}

FORMAT RULES
- Produce exactly 6 combos.
- Each combo must contain exactly ${validLines} line${validLines !== 1 ? 's' : ''}.
- If lines > 1 → use a single literal "\\n" between lines (no blank lines).
- No markdown, commentary, or quotes.
- Each line < 40 visible characters.
- Emojis and ASCII must align cleanly on iOS/Android.
- No leading/trailing whitespace anywhere.
- Never output text outside the JSON object.

CREATIVE RULES
- Interpret the topic loosely — riff, expand, or imply mood.
  Example: topic "coffee" → "☕ calm start", "(^_^) bloom slow", "in the mood 🌤".
- Use short micro-phrases or emotive fragments that feel natural.
- Match tone:
  - cute → soft, warm, rounded
  - cool → balanced, clean
  - chaotic → playful, bold
  - minimal → sparse, elegant
  - nostalgic → gentle, wistful
  - aesthetic → poetic, calm
- Keep internal coherence across lines.
- Vary theme slightly between combos.

OUTPUT (strict JSON)
Return only valid JSON in this format:

{
  "combos": [
    {"text": "<combo text including any literal \\\\n line breaks>", "name": "<1–3 word lowercase label>"}
  ]
}

REQUIREMENTS
- The JSON must parse successfully.
- "text" must include the entire combo, with literal "\\\\n" for newlines.
- "name" is a short lowercase descriptor derived from its vibe.
- No other keys or commentary.`;
}

function cleanLine(s, max = 60) {
  return s.replace(/[\x00-\x1F]/g, "").slice(0, max).trim();
}

const server = http.createServer(async (req, res) => {
  // CORS headers for local development
  res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  
  if (parsedUrl.pathname === '/api/generate' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { words = "", mode = "both", tone = "wholesome", seed = "", lines = 1 } = JSON.parse(body);
        
        console.log(`🎨 Generating for: "${words}" (${tone}, ${mode}, ${lines} lines)`);
        
        const payload = {
          words: String(words).slice(0, 160),
          mode: mode,
          tone: String(tone).slice(0, 40),
          seed: String(seed).slice(0, 32),
          lines: Math.max(1, Math.min(2, Number(lines) || 1))
        };

        // Call Groq API
        const groqPrompt = getGroqSystemPrompt(payload.words, payload.tone, payload.mode, payload.lines);
        
        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { 
            "Authorization": `Bearer ${GROQ_API_KEY}`, 
            "Content-Type": "application/json" 
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "system", content: groqPrompt }],
            temperature: 0.8,
            top_p: 0.9,
            max_tokens: 500
          })
        });

        if (!groqResponse.ok) {
          throw new Error(`Groq API error: ${groqResponse.status} ${groqResponse.statusText}`);
        }

        const data = await groqResponse.json();
        const content = data.choices?.[0]?.message?.content || "{}";

        // Parse and format response
        let parsed;
        try { 
          let cleanContent = content.trim();
          if (!cleanContent.endsWith('}')) {
            cleanContent += '}';
          }
          parsed = JSON.parse(cleanContent); 
        } catch { 
          console.error('❌ Failed to parse Groq response:', content);
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: "AI response parsing failed" }));
          return;
        }

        const clamp = (arr, limit = 12) => Array.isArray(arr)
          ? arr.slice(0, limit).map(x => ({
              combo: cleanLine(String(x.combo || x.text || "").slice(0, 60), 40),
              name:  cleanLine(String(x.name || "").slice(0, 40), 40)
            }))
          : [];

        // Convert new format to legacy format for compatibility
        const combos = clamp(parsed.combos || [], 6);
        const emojiCombos = combos.filter(c => !/^[!-~\s\n]*$/.test(c.combo));
        const asciiCombos = combos.filter(c => /^[!-~\s\n]*$/.test(c.combo));
        
        const response = {
          meta: { mode: payload.mode, tone: payload.tone, seed: payload.seed },
          emoji: payload.mode === "ascii" ? [] : (emojiCombos.length > 0 ? emojiCombos : combos),
          ascii: payload.mode === "emoji" ? [] : (asciiCombos.length > 0 ? asciiCombos : combos)
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response, null, 2));
        
        console.log(`✅ Generated ${response.emoji.length} emoji + ${response.ascii.length} ascii combos`);
        
      } catch (e) {
        console.error('❌ Generation error:', e.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: "Generation failed", details: e.message }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`🤖 Real EmojiFusion API running on http://127.0.0.1:${PORT}`);
  console.log(`📝 Using Groq API with key: ${GROQ_API_KEY.slice(0, 7)}...`);
  console.log(`🛑 This server is LOCALHOST ONLY - not accessible from internet`);
});