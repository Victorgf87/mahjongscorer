/**
 * API Endpoint: /api/score
 * Senior Architect Arbiter with D1 Persistence
 * v2.0.0-database-ready
 */

const RULES_MD = `... (omitiendo por brevedad, sigue igual) ...`;

const SYSTEM_CONTEXT = `Eres el Árbitro Supremo de Mahjong... (omitiendo por brevedad, sigue igual) ...`;

export async function onRequestPost(context) {
  const { request, env, waitUntil } = context;
  const start = Date.now();

  try {
    const { audio, text, mode, userId } = await request.json();
    const model = "gemini-2.5-flash"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_KEY}`;

    const parts = [
        { text: `${SYSTEM_CONTEXT}\nMODO: ${mode}` },
        ...(audio ? [{ inline_data: { mime_type: "audio/webm", data: audio } }] : []),
        { text: text || "Analiza esta jugada." }
    ];

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts }] })
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    const resultText = data.candidates[0].content.parts[0].text;
    const duration = ((Date.now() - start) / 1000).toFixed(2);

    // --- PERSISTENCIA EN D1 (SI ESTÁ DISPONIBLE) ---
    if (env.DB) {
        waitUntil(savePlayToDB(env.DB, {
            mode,
            input_text: text || "Audio",
            ai_raw_response: resultText,
            user_id: userId || 'anonymous'
        }));
    }

    waitUntil(logToLoki(env, { level: "info", mode, duration }));
    
    return new Response(JSON.stringify({ score: resultText, duration }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

async function savePlayToDB(db, data) {
    try {
        await db.prepare(`
            INSERT INTO plays (mode, input_text, ai_raw_response, user_id)
            VALUES (?, ?, ?, ?)
        `).bind(data.mode, data.input_text, data.ai_raw_response, data.user_id).run();
    } catch (e) {
        console.error("D1 Error:", e.message);
    }
}

// ... (logToLoki se mantiene igual) ...
