/**
 * API Endpoint: /api/score
 * Arbiter for Mahjong hands (Voice or Text)
 * v4.14.4-ultra-debug
 */

const RULES_MD = `... (omitiendo por brevedad, sigue igual) ...`;

export async function onRequestPost(context) {
  const { request, env, waitUntil } = context;
  try {
    const { audio, text, mode } = await request.json();
    const model = "gemini-1.5-flash-latest"; 
    const apiKey = env.GEMINI_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const prompt = `Eres el Árbitro de Mahjong. Reglas: ${RULES_MD}. Arbitra esto (${mode}): ${text || "Audio proporcionado"}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [
          ...(audio ? [{ inline_data: { mime_type: "audio/webm", data: audio } }] : []),
          { text: prompt }
        ]}]
      })
    });

    const data = await res.json();
    if (data.error) return new Response(JSON.stringify({ error: data.error.message, debug: data }), { status: 500 });
    
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sin respuesta";
    return new Response(JSON.stringify({ score: resultText }), { headers: { "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
