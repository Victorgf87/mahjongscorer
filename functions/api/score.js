/**
 * API Endpoint: /api/score
 * Strict Arbiter for Mahjong
 * v4.16.2-strict-rules
 */

const RULES_MD = `
# REGLAMENTO OFICIAL MAHJONG
## MCR (Chinese Official)
- 88: Big Four Winds, Big Three Dragons, All Green, Nine Gates, Four Kongs, Seven Pairs, 13 Orphans.
- 64: All Terminals, Little Four Winds, Little Three Dragons, All Honors, Four Pure Pungs.
- 48: Quadruple Pure Chow, Four Pure Shifted Pungs.
- 32: Four Pure Shifted Chows, Three Kongs, Honroutou.
- 24: Seven Pairs (Siete Pares), Greater Honors, Pure Triple Chow.
- 16: Pure Straight (Escalera Pura), Three-Suited Terminal Chows, Pure Shifted Pungs.
- 12: Lesser Honors, Knitted Straight, Big Three Winds.
- 8: Mixed Straight, Reversible Tiles, Mixed Triple Chow.
- 6: ALL PUNGS (Todo Pon / Peng Peng Hu), All Half-Flush, Two Dragons.
- 4: Fully Concealed, Last Tile, Robbing Kong.
- 2: Dragon Pung (Pon Dragón), Prevalent/Seat Wind, Concealed Hand, All Chows.
- 1: Pure Double Chow, Mixed Double Pung, Short Straight, Terminal Pung, Self-Drawn.

## FÓRMULAS
- MCR TSUMO: (Suma Base + 8) * 3
- MCR RON: Suma Base + 24
- RIICHI: Fu * 2^(Han+2) (centena sup)
`;

const STRICT_PROMPT = `
Eres un procesador de datos de Mahjong. PROHIBIDO SALUDAR. PROHIBIDO USAR EXCLAMACIONES.
Cíñete ESTRICTAMENTE a la tabla de reglas proporcionada:
${RULES_MD}

INSTRUCCIONES:
1. Transcribe la ENTRADA de forma literal, sin añadir preámbulos.
2. Identifica ELEMENTOS.
3. Calcula SUMA BASE.
4. Calcula PUNTUACIÓN FINAL según Tsumo/Ron.

FORMATO OBLIGATORIO:
ENTRADA: [Texto literal detectado]
---
ELEMENTOS:
- [Nombre]: [Puntos]
SUMA BASE: [X]
PUNTUACIÓN FINAL: [Cálculo matemático según Tsumo/Ron]
---
Explicación breve de 1 frase.
`;

export async function onRequestPost(context) {
  const { request, env, waitUntil } = context;
  const start = Date.now();
  try {
    const { audio, text, mode } = await request.json();
    const model = "gemini-2.5-flash"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_KEY}`;

    const parts = [
        { text: `${STRICT_PROMPT}\nMODO SELECCIONADO: ${mode}` },
        ...(audio ? [{ inline_data: { mime_type: "audio/webm", data: audio } }] : []),
        { text: text || "Analiza el audio adjunto." }
    ];

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts }] })
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    const resultText = data.candidates[0].content.parts[0].text;

    waitUntil(logToLoki(env, { level: "info", mode, duration: Date.now() - start }));
    
    return new Response(JSON.stringify({ 
        score: resultText,
        duration: ((Date.now() - start) / 1000).toFixed(2)
    }), { headers: { "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

async function logToLoki(env, payload) {
  if (!env.GRAFANA_URL || !env.GRAFANA_USER || !env.GRAFANA_TOKEN) return;
  const line = JSON.stringify({ app: "mahjong-scorer", ...payload });
  const logData = { streams: [{ stream: { app: "mahjong-scorer" }, values: [[(Date.now() * 1000000).toString(), line]] }] };
  await fetch(env.GRAFANA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Basic ${btoa(`${env.GRAFANA_USER}:${env.GRAFANA_TOKEN}`)}` },
    body: JSON.stringify(logData)
  }).catch(() => {});
}
