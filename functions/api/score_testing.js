/**
 * API Endpoint: /api/score (v2 testing)
 * Arbiter for Mahjong hands with D1 Persistence
 */

// ... (RULES_MD y prompts se mantienen igual que en producción) ...

export async function onRequestPost(context) {
  const { request, env, waitUntil } = context;
  const start = Date.now();

  try {
    const { audio, text, mode, userId } = await request.json();
    const modePrompt = mode === 'Riichi' ? "SISTEMA SELECCIONADO: RIICHI." : "SISTEMA SELECCIONADO: MCR.";
    
    // (Lógica de llamada a Gemini se mantiene igual)
    // ... Supongamos que resultText es la respuesta de la IA ...
    let resultText = "Respuesta de la IA simulada para testing"; // Aquí iría la llamada real

    // --- PERSISTENCIA EN D1 (NUEVO) ---
    if (env.DB) {
        waitUntil(savePlayToDB(env.DB, {
            mode,
            input_text: text || "Audio",
            ai_raw_response: resultText,
            user_id: userId || 'anonymous'
        }));
    }

    return new Response(JSON.stringify({ 
        score: resultText,
        duration: ((Date.now() - start) / 1000).toFixed(2)
    }), { headers: { "Content-Type": "application/json" } });

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
