export const config = { runtime: "edge" };

type Mode = "emoji" | "ascii" | "both";

const KV = {
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || ""
};

// Model Configuration: Gemini 1.5 Pro (primary) with Groq (fallback)
const GEMINI_KEY = process.env.GOOGLEGEMINI_API_KEY;   // primary - superior for creative layout
const GROQ_KEY   = process.env.GROQ_API_KEY;           // fallback - fast deterministic output
const MODEL_BASE = process.env.UPSTASH_MODEL_BASE_URL; // e.g. https://api.upstash.ai/openai/v1
const MODEL_KEY  = process.env.UPSTASH_MODEL_API_KEY;  // bearer
const OR_KEY     = process.env.OPENROUTER_API_KEY;     // optional fallback

async function redis(cmd: any[]) {
  if (!KV.url || !KV.token) return { result: null }; // Skip if Redis not configured
  try {
    const r = await fetch(KV.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${KV.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(cmd)
    });
    if (!r.ok) throw new Error("Redis error");
    return r.json();
  } catch {
    return { result: null }; // Graceful fallback if Redis fails
  }
}

function sha256Base64(s: string) {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(s))
    .then(buf => btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(buf)))));
}

function getGeminiSystemPrompt(words: string, tone: string, mode: string) {
  const modeInstructions = mode === "emoji"
    ? "Use ONLY emoji characters (🎉✨💫 etc) with optional short text. No ASCII art emoticons."
    : mode === "ascii"
    ? "Use ONLY ASCII art emoticons (^_^, ^^, (˘︶˘), (＾▽＾), :D, etc) with text. No Unicode emoji. Never use <3 (use 'heart' instead)."
    : "Mix BOTH emoji (🎉✨💖) AND ASCII art emoticons (^_^, (˘︶˘), (＾▽＾), ^^) together in EACH combo. Each combo MUST contain ≥1 emoji AND ≥1 ASCII emoticon like (＾▽＾), (˘︶˘), ^^, or :D. Example: '🥰 (＾▽＾)\\nbig win energy' or '(˘︶˘) ✨\\nwe did it!'";

  const fewShotExample = mode === "both"
    ? `\n\n📚 Example Output (for reference only, create NEW unique combos):\nTopic: "celebration" · Tone: cute · Mode: combo\n\n{\n  "combos": [\n    {"text": "🎉 (＾▽＾)\\ncelebration time", "name": "party"},\n    {"text": "💖 ^_^\\ncelebration vibes", "name": "joyful"},\n    {"text": "✨ (˘︶˘)\\ncelebration feels", "name": "sparkly"},\n    {"text": "🥰 ^^\\nbig win energy", "name": "victory"},\n    {"text": "(＾▽＾) 🌟\\nwe did it!", "name": "proud"},\n    {"text": "💫 :D\\nchef's kiss", "name": "perfect"}\n  ]\n}\n\nNotice: First 3 include "celebration" (preserving user input), last 3 are creative riffs. Each has emoji + ASCII emoticon, clean single-space formatting, and meaningful variety.`
    : "";

  return `EmojiFusion — Adaptive Line Mode (Gemini 1.5)

You are **EmojiFusion**, an expressive generator that creates compact combos for mobile cards.

🎯 Goal
Generate short, visually balanced combos inspired by the user's topic and tone.
Each combo should feel natural and emotionally resonant — not rigidly formatted.

🔒 The number of lines (1 to 3) is chosen automatically by you based on what looks most visually appealing and expressive.
The user **cannot specify or influence** how many lines are produced.

🧩 Input
- topic: "${words}"
- tone: ${tone}
- mode: ${mode}

📱 Format Rules
- Produce **6 unique combos**
- ${modeInstructions}
- Each combo may use **1 to 3 short lines**, whichever layout looks most balanced and expressive
- Use a **single literal "\\n"** to separate lines (no blank lines)
- No markdown, quotes, or commentary
- Each line < 40 visible characters
- Keep emojis and ASCII aligned across mobile devices
- No leading or trailing whitespace

🚫 Spacing & Character Rules (STRICT)
- Use single spaces only (never double spaces)
- Never use <3 — use ❤️ emoji instead
- Never add space inside emoticons: use :D not : D
- Never add space inside emoji combos
- Trim all leading/trailing whitespace

💡 Style Rules
- Interpret the topic freely — riff, expand, or imply a mood or micro-story
  Example: topic "coffee" → "☕ calm start", "(^_^) bloom slow", "in the mood 🌤"
- Use short emotive fragments or poetic micro-phrases
- Match tone:
  - cute → soft and warm (use 🥰💖✨🌸💫)
  - cool → sleek and clean (use 🌟⚡️🔥💎🎯)
  - chaotic → bold and playful (use 🎉🤪💥🎊⚡)
  - romantic → gentle and affectionate (use 💕💖✨🌹🥰)
  - minimal → simple and elegant (use ✨・⚪︎▫️)
  - nostalgic → wistful and gentle (use 🌤️💭✨🍃)
  - aesthetic → calm and balanced (use ✨🌸💫🍃🌙)
  - professional → refined, neutral tone with controlled symbols and clean spacing (use ✓・◦)
- Maintain cohesion across all lines in a combo
- Vary theme slightly between combos for richness

🎨 Variety Requirements (CRITICAL)
- **At least 3 combos MUST include words from the user's original input** — preserve their exact words
  Example: input "GREAT" → at least 3 combos should contain "great"
- **The remaining 3 combos can be creative riffs** — use playful micro-phrases that expand on the theme
  Examples: "big win energy", "chef's kiss", "so proud", "we did it", "you crushed it", "feel-good vibes", "loving this", "here for it"
- **Rotate through emoji classes**: faces (🥰😊), hearts (💖💕), celebration (🎉✨), stars (⭐️💫), hands (👏🤝)
- **All combos must be meaningfully different** — not just punctuation/emoji swaps
- **No near-duplicates**: each combo should have a distinct vibe and wording

📤 Output
Return **strict JSON only** in this exact schema:

{
  "combos": [
    {"text": "<combo text including any literal \\\\n line breaks>", "name": "<1–3 word lowercase label>"}
  ]
}

Requirements:
- JSON must parse without errors
- "text" = full combo (including any literal \\\\n line breaks)
- "name" = short lowercase descriptor derived from its vibe
- No extra keys, no commentary, no markdown${fewShotExample}`;
}

function getGroqSystemPrompt(words: string, tone: string, mode: string, lines: number) {
  const validLines = Math.max(1, Math.min(2, lines));

  const modeInstructions = mode === "emoji"
    ? "Use ONLY emoji characters (🎉✨💫 etc) with optional short text. No ASCII art emoticons."
    : mode === "ascii"
    ? "Use ONLY ASCII art emoticons (^_^, ^^, (˘︶˘), (＾▽＾), :D, etc) with text. No Unicode emoji. Never use <3 (use 'heart' instead)."
    : "Mix BOTH emoji (🎉✨💖) AND ASCII art emoticons (^_^, (˘︶˘), (＾▽＾), ^^) together in EACH combo. Each combo MUST contain ≥1 emoji AND ≥1 ASCII emoticon like (＾▽＾), (˘︶˘), ^^, or :D. Example: '🥰 (＾▽＾) big win energy' or '(˘︶˘) ✨ we did it!'";

  return `EmojiFusion System Prompt (Groq-Optimized for Llama-3.3-70B-Versatile)

You are EmojiFusion — a generator that creates compact, expressive combos formatted for mobile cards.

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
- ${modeInstructions}
- Each combo must contain exactly ${validLines} line${validLines !== 1 ? 's' : ''}.
- If lines > 1 → use a single literal "\\n" between lines (no blank lines).
- No markdown, commentary, or quotes.
- Each line < 40 visible characters.
- Emojis and ASCII must align cleanly on iOS/Android.
- No leading/trailing whitespace anywhere.
- Never output text outside the JSON object.

SPACING & CHARACTER RULES (STRICT)
- Use single spaces only (never double spaces).
- Never use <3 — use ❤️ emoji instead.
- Never add space inside emoticons: use :D not : D.
- Never add space inside emoji combos.
- Trim all leading/trailing whitespace.

CREATIVE RULES
- Interpret the topic loosely — riff, expand, or imply mood.
  Example: topic "coffee" → "☕ calm start", "(^_^) bloom slow", "in the mood 🌤".
- Use short micro-phrases or emotive fragments that feel natural.
- Match tone:
  - cute → soft, warm (use 🥰💖✨🌸💫)
  - cool → balanced, clean (use 🌟⚡️🔥💎🎯)
  - chaotic → playful, bold (use 🎉🤪💥🎊⚡)
  - minimal → sparse, elegant (use ✨・⚪︎▫️)
  - nostalgic → gentle, wistful (use 🌤️💭✨🍃)
  - aesthetic → poetic, calm (use ✨🌸💫🍃🌙)
- Keep internal coherence across lines.
- Vary theme slightly between combos.

VARIETY REQUIREMENTS (CRITICAL)
- At least 3 combos MUST include words from the user's original input — preserve their exact words.
  Example: input "GREAT" → at least 3 combos should contain "great".
- The remaining 3 combos can be creative riffs — use playful micro-phrases that expand on the theme.
  Examples: "big win energy", "chef's kiss", "so proud", "we did it", "you crushed it", "feel-good vibes", "loving this", "here for it".
- Rotate through emoji classes: faces (🥰😊), hearts (💖💕), celebration (🎉✨), stars (⭐️💫), hands (👏🤝).
- All combos must be meaningfully different — not just punctuation/emoji swaps.
- No near-duplicates: each combo should have a distinct vibe and wording.

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

const LEGACY_SYSTEM_PROMPT = `
You generate fun, safe, shareable combos from user words.

CONSTRAINTS
- MODE: "emoji" only Unicode emoji strings, "ascii" only ASCII characters, "both" both lists.
- TONE: follow style words; no profanity/hate/sexual/graphic content.
- Each combo <= 20 visible chars; ASCII max 2 lines, 20 cols per line.
- Output ONLY strict JSON:
{
  "meta": { "mode": "emoji|ascii|both", "tone": "string", "seed": "string" },
  "emoji": [ { "combo": "string", "name": "short descriptive title" } ],
  "ascii": [ { "combo": "string", "name": "short descriptive title" } ]
}

STRATEGY
- Build small word lists from user input (nouns, verbs, moods).
- Map to safe emoji categories; compose 8–12 varied combos.
- ASCII: cute micro-art or symbolic mashups for chats.
- No code fences, no commentary, JSON object only.
`.trim();

function userPrompt(words: string, mode: string, tone: string, seed: string) {
  return `words: "${words}"
mode: "${mode}"
tone: "${tone}"
seed: "${seed}"`;
}

function cleanLine(s: string, max = 60) {
  return s.replace(/[\x00-\x1F]/g, "").slice(0, max).trim();
}

// Backend validation helpers
function isHybrid(text: string): boolean {
  // Check for emoji (Unicode emoji range)
  const hasEmoji = /[\u2190-\u2BFF\u2600-\u27BF\u{1F000}-\u{1FAFF}]/u.test(text);
  // Check for ASCII emoticons
  const hasAscii = /[\(\)^_¬°;:]/.test(text);
  return hasEmoji && hasAscii;
}

function fixSpacing(text: string): string {
  return text
    .replace(/<3/g, '❤️')                    // Replace <3 with heart emoji
    .replace(/:\s+D/g, ':D')                 // Fix : D → :D
    .replace(/;\s+\)/g, ';)')                // Fix ; ) → ;)
    .replace(/\(\s+\^/g, '(^')               // Fix ( ^ → (^
    .replace(/\s{2,}/g, ' ')                 // Collapse multiple spaces
    .trim();                                  // Remove leading/trailing whitespace
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

function validateLineCount(text: string): boolean {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  return lines.length >= 1 && lines.length <= 3;
}

function dedupeCombos(combos: any[], mode: string): any[] {
  const result: any[] = [];

  for (const combo of combos) {
    // Fix spacing issues
    let text = fixSpacing(combo.combo || combo.text || "");

    // Validate line count
    if (!validateLineCount(text)) {
      continue;
    }

    // For combo mode (both), enforce hybrid requirement
    if (mode === "both" && !isHybrid(text)) {
      continue;
    }

    // Check for near-duplicates (Levenshtein distance < 5)
    const isDuplicate = result.some(existing => {
      const existingText = existing.combo || existing.text || "";
      return levenshteinDistance(text, existingText) < 5;
    });

    if (!isDuplicate) {
      result.push({
        combo: text,
        text: text,
        name: combo.name || "combo"
      });
    }
  }

  return result;
}

export default async function handler(req: Request) {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  const { words = "", mode = "both", tone = "wholesome", seed = "", lines = 1 } = await req.json().catch(()=> ({}));
  const m = String(mode).toLowerCase();
  if (!["emoji","ascii","both"].includes(m)) return new Response("Bad mode", { status: 400 });

  // Rate limit 10/min/IP
  const ip = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for") || "0.0.0.0";
  const rlKey = `rl:${ip}`;
  await redis(["INCR", rlKey]); await redis(["EXPIRE", rlKey, 60]);
  const c = Number((await redis(["GET", rlKey])).result || "0");
  if (c > 10) return new Response("Rate limit", { status: 429 });

  const payload = {
    words: String(words).slice(0,160),
    mode: m as Mode,
    tone: String(tone).slice(0,40),
    seed: String(seed).slice(0,32),
    lines: Math.max(1, Math.min(2, Number(lines) || 1))
  };

  const cacheKey = "cache:" + await sha256Base64(JSON.stringify(payload));
  const hit = await redis(["GET", cacheKey]);
  if (hit?.result) return new Response(hit.result, { headers: { "Content-Type": "application/json" } });

  let resp: Response;
  let isGroq = false;
  let isGemini = false;

  // Try Gemini first (primary - superior creative layout and emoji semantics)
  if (GEMINI_KEY) {
    isGemini = true;
    const geminiPrompt = getGeminiSystemPrompt(payload.words, payload.tone, payload.mode);

    try {
      resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: geminiPrompt }] }],
          generationConfig: {
            temperature: 0.85,
            topP: 0.9,
            maxOutputTokens: 350,
            stopSequences: ["}"]
          }
        })
      });

      // If Gemini fails, fall through to Groq
      if (!resp.ok) {
        console.log('Gemini API failed, falling back to Groq');
        isGemini = false;
      }
    } catch (error) {
      console.log('Gemini API error, falling back to Groq:', error);
      isGemini = false;
    }
  }

  // Fallback to Groq (fast deterministic output)
  if (!isGemini && GROQ_KEY) {
    isGroq = true;
    const groqPrompt = getGroqSystemPrompt(payload.words, payload.tone, payload.mode, payload.lines);

    resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: groqPrompt }],
        temperature: 0.8,
        top_p: 0.9,
        max_tokens: 450
      })
    });
  } 
  // Fallback to Upstash (legacy prompt)
  else if (MODEL_BASE && MODEL_KEY) {
    const sys = LEGACY_SYSTEM_PROMPT;
    const usr = userPrompt(payload.words, payload.mode, payload.tone, payload.seed);
    
    resp = await fetch(`${MODEL_BASE}/chat/completions`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${MODEL_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: sys }, { role: "user", content: usr }],
        temperature: 0.65,
        max_tokens: 450
      })
    });
  } 
  // Fallback to OpenRouter (legacy prompt)
  else if (OR_KEY) {
    const sys = LEGACY_SYSTEM_PROMPT;
    const usr = userPrompt(payload.words, payload.mode, payload.tone, payload.seed);
    
    resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OR_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-flash-1.5",
        messages: [{ role: "system", content: sys }, { role: "user", content: usr }],
        temperature: 0.65,
        max_tokens: 450
      })
    });
  } else {
    return new Response("LLM not configured", { status: 500 });
  }

  if (!resp.ok) return new Response("LLM error", { status: 502 });
  const data = await resp.json();

  // Extract content based on model format
  let content: string;
  if (isGemini) {
    // Gemini format: response.candidates[0].content.parts[0].text
    content = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  } else {
    // OpenAI-compatible format (Groq, Upstash, OpenRouter)
    content = data.choices?.[0]?.message?.content || "{}";
  }

  // Strict JSON & sanitation
  let parsed: any;
  try {
    // Clean and parse JSON response
    let cleanContent = content.trim();
    // Extract JSON if wrapped in markdown code blocks
    if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    }
    parsed = JSON.parse(cleanContent);
  } catch (e) {
    console.error('JSON parse error:', e, 'Content:', content);
    return new Response("Bad JSON", { status: 502 });
  }

  const clamp = (arr?: any[], limit = 12) => Array.isArray(arr)
    ? arr.slice(0, limit).map(x => ({
        combo: cleanLine(String(x.combo || x.text || "").slice(0, 60), 40),
        name:  cleanLine(String(x.name || "").slice(0, 40), 40)
      }))
    : [];

  let safe: any;

  // Handle new Gemini/Groq format (both use "combos" array)
  if ((isGemini || isGroq) && parsed.combos) {
    const combos = clamp(parsed.combos, 6);

    // Apply backend validation and deduping
    const validatedCombos = dedupeCombos(combos, payload.mode);

    // Convert new format to legacy format for compatibility
    const emojiCombos = validatedCombos.filter(c => !/^[!-~\s\n]*$/.test(c.combo));
    const asciiCombos = validatedCombos.filter(c => /^[!-~\s\n]*$/.test(c.combo));

    safe = {
      meta: { mode: payload.mode, tone: payload.tone, seed: payload.seed },
      emoji: payload.mode === "ascii" ? [] : (emojiCombos.length > 0 ? emojiCombos : validatedCombos),
      ascii: payload.mode === "emoji" ? [] : (asciiCombos.length > 0 ? asciiCombos : validatedCombos)
    };
  }
  // Handle legacy format (Upstash/OpenRouter)
  else {
    safe = {
      meta: { mode: payload.mode, tone: payload.tone, seed: payload.seed },
      emoji: clamp(parsed.emoji),
      ascii: clamp((payload.mode === "emoji") ? [] : parsed.ascii)
    };
  }

  const body = JSON.stringify(safe);
  await redis(["SET", cacheKey, body, "EX", 60*60*24*7]); // 7d
  return new Response(body, { headers: { "Content-Type": "application/json" } });
}