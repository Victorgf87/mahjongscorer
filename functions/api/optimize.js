/**
 * API Endpoint: /api/optimize
 * MCR Strategy Optimizer for Mahjong Mastery
 * v4.21.0-senior-architect-d1
 */

const RULES_MD = `
# REGLAMENTO MCR (Chinese Official) - BARRERA DE 8 PUNTOS
Debes alcanzar al menos 8 puntos para poder ganar (Hu).

## COMBINACIONES CLAVE (Fan)
- 88: Big Four Winds, Big Three Dragons, Seven Shifted Pairs, Thirteen Orphans.
- 64: All Terminals, All Honors, Four Pure Pungs.
- 24: Seven Pairs, Pure Triple Chow, Mixed Shifted Pungs.
- 16: Pure Straight (Escalera Pura del mismo palo), All Five.
- 12: Lesser Honors and Knitted Tiles, Knitted Straight.
- 8: Mixed Straight (Escalera en los 3 palos), Mixed Triple Chow, Reversible Tiles, Chicken Hand.
- 6: ALL PUNGS (Todo Pon), All Half-Flush (Media Limpia).
- 4: Fully Concealed (Totalmente Oculta).
- 2: Dragon Pung, Prevalent/Seat Wind, Concealed Hand, All Chows (Todo Chi), Tile Hog, Double Pung.
- 1: Pure Double Chow, Short Straight, Two Terminal Chows, Pung of Terminals/Honors, One Voided Suit, No Terminals.
`;

const SYSTEM_CONTEXT = `
Eres un Maestro Estratega de Mahjong MCR (Reglas de Competición Chinas).
Tu misión es recibir una mano inicial de un jugador y sugerir las 3 mejores rutas críticas para alcanzar el mínimo legal de 8 puntos.

REGLAS DE RESPUESTA:
1. Analiza las fichas recibidas.
2. Identifica los fan que ya están presentes o son muy probables de conseguir.
3. Sugiere 3 rutas distintas. Cada ruta debe llamarse "Ruta X: [Nombre de la combinación principal]".
4. Para cada ruta, explica:
   - Qué combinaciones (fan) componen los 8+ puntos.
   - Qué fichas son clave para mantener.
   - Qué fichas sobran (descartes recomendados).
   - Dificultad estimada (Baja, Media, Alta).

Usa un tono profesional, directo y experto. Evita introducciones innecesarias.
`;

export async function onRequestPost(context) {
  const { request, env, waitUntil } = context;
  const start = Date.now();

  try {
    const { hand, userId } = await request.json();
    if (!hand) return new Response(JSON.stringify({ error: "No hand provided" }), { status: 400 });

    const model = "gemini-2.5-flash"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_KEY}`;

    const prompt = `
MANO DEL JUGADOR: ${hand}

${SYSTEM_CONTEXT}

REGLAS DE REFERENCIA:
${RULES_MD}
`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [{ text: prompt }]
        }]
      })
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error.message);

    const resultText = data.candidates[0].content.parts[0].text;
    const duration = ((Date.now() - start) / 1000).toFixed(2);

    // --- PERSISTENCIA EN D1 ---
    if (env.DB) {
        waitUntil(saveOptimizationToDB(env.DB, {
            hand,
            ai_raw_response: resultText,
            user_id: userId || 'anonymous'
        }));
    }

    // --- LOGS EN LOKI ---
    waitUntil(logToLoki(env, { level: "info", mode: "optimize", duration, tier: "premium", model }));

    return new Response(JSON.stringify({ analysis: resultText, duration }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

async function saveOptimizationToDB(db, data) {
    try {
        await db.prepare(`
            INSERT INTO plays (mode, input_text, ai_raw_response, user_id)
            VALUES (?, ?, ?, ?)
        `).bind("MCR_OPTIMIZE", data.hand, data.ai_raw_response, data.user_id).run();
    } catch (e) {
        console.error("D1 Error:", e.message);
    }
}

async function logToLoki(env, payload) {
  if (!env.GRAFANA_URL || !env.GRAFANA_USER || !env.GRAFANA_TOKEN) return;
  const line = JSON.stringify({ app: "mahjong-scorer", ...payload });
  const logData = { 
    streams: [{ 
      stream: { app: "mahjong-scorer" }, 
      values: [[(Date.now() * 1000000).toString(), line]] 
    }] 
  };
  await fetch(env.GRAFANA_URL, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json", 
      "Authorization": `Basic ${btoa(`${env.GRAFANA_USER}:${env.GRAFANA_TOKEN}`)}` 
    },
    body: JSON.stringify(logData)
  }).catch(() => {});
}
