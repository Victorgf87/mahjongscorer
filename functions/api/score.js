/**
 * API Endpoint: /api/score
 * Universal Arbiter for Mahjong
 * v4.13.8-universal-api
 */

const RULES_MD = `
# DICCIONARIO OFICIAL DE ARBITRAJE MAHJONG
## REGLAMENTO MCR (Chinese Official) - PUNTOS DIRECTOS
- 88 PUNTOS: Big Four Winds, Big Three Dragons, All Green (Todo Verde), Nine Gates, Four Kongs, Seven Shifted Pairs, Thirteen Orphans.
- 64 PUNTOS: All Terminals, Little Four Winds, Little Three Dragons, All Honors, Four Pure Pungs, Orchid.
- 48 PUNTOS: Quadruple Pure Chow, Four Pure Shifted Pungs.
- 32 PUNTOS: Four Pure Shifted Chows, Three Kongs, All Terminals and Honors (Honroutou).
- 24 PUNTOS: Seven Pairs (Siete Pares), Greater Honors and Knitted Tiles, All Pungs (Todo Pon), Pure Triple Chow, Mixed Shifted Pungs, Upper/Middle/Lower Tiles.
- 16 PUNTOS: Pure Straight (Escalera Pura), Three-Suited Terminal Chows, Pure Shifted Pungs, All Five, Triple Knitted Chow.
- 12 PUNTOS: Lesser Honors and Knitted Tiles, Knitted Straight, Upper/Lower Four, Big Three Winds.
- 8 PUNTOS: Mixed Straight, Reversible Tiles, Mixed Triple Chow, Two Pure Terminal Chows, Mixed Shifted Chows, Chicken Hand.
- 6 PUNTOS: All Pungs (Básico), All Half-Flush, Mixed Shifted Pungs, Two Dragons.
- 4 PUNTOS: Fully Concealed (Totalmente Oculta), Last Tile, Out with Replacement, Robbing the Kong.
- 2 PUNTOS: Dragon Pung (Pon de Dragón), Prevalent Wind, Seat Wind, Concealed Hand, All Chows, Tile Hog, Double Pung, Two Mixed Terminal Chows.
- 1 PUNTO: Pure Double Chow, Mixed Double Pung, Short Straight, Two Terminal Chows, Pung of Terminals or Honors, Melded Kong, One Voided Suit, No Terminals, Edge/Closed/Single Wait, Self-Drawn.

## REGLAMENTO RIICHI (Japonés) - HAN / FU
- 1 HAN: Riichi, Tsumo (Mano cerrada), Pinfu, Tanyao, Iippatsu, Fanpai, Iipeiko, Haitey, Houtei, Rinshan, Chankan.
- 2 HAN: Double Riichi, Sanshoku Doujun, Ittsu, Chanta, Toitoi, Sanankou, Sanshoku Doukou, Sankantsu, Chiitoitsu, Honrouto, Shousangen.
- 3 HAN: Honitsu, Junchan, ryanpeiko.
- 6 HAN: Chinitsu.
- YAKUMAN (13+ HAN): Kokushi Musou, Suuankou, Daisangen, Shousuushii, Daisuushii, Tsuuuisou, Ryuuisou (Mano Verde), Chinroutou, Chuuren Poutou, Suukantsu.

## FÓRMULAS DE CÁLCULO
- MCR (Tsumo): (Total Puntos + 8) * 3
- MCR (Ron): Total Puntos + 24
- Riichi: Puntos = Fu * 2^(Han+2). Redondeo a la centena superior.
`;

const SYSTEM_CONTEXT = `Eres el Árbitro Supremo de Mahjong. Usa esta TABLA DE REGLAS: ${RULES_MD}
INSTRUCCIONES: Analiza la jugada, identifica elementos, calcula el total.
FORMATO OBLIGATORIO:
ENTRADA: [Transcripción]
---
ELEMENTOS:
- [Elemento]: [Valor]
SUMA BASE: [Suma]
CÁLCULO FINAL:
-- SI ES TSUMO: ([Suma Base] + 8) * 3 = [Puntos]
-- SI ES RON: [Suma Base] + 24 = [Puntos]
PUNTUACIÓN FINAL: [Valor Real]
---
Breve explicación técnica.`;

export async function onRequestPost(context) {
  const { request, env, waitUntil } = context;
  const start = Date.now();

  try {
    const { audio, text, mode } = await request.json();
    const modePrompt = mode === 'Riichi' ? "SISTEMA SELECCIONADO: RIICHI." : "SISTEMA SELECCIONADO: MCR.";
    const fullInstruction = `${SYSTEM_CONTEXT}\n\n${modePrompt}`;
    
    let resultText = "";
    const inputType = audio ? "audio" : "text";

    if (audio) {
      resultText = await callGemini(env.GEMINI_KEY, [
        { text: fullInstruction },
        { inline_data: { mime_type: "audio/webm", data: audio } },
        { text: "Arbitra esta mano." }
      ]);
    } else {
      resultText = await callGemini(env.GEMINI_KEY, [
        { text: fullInstruction },
        { text: `Arbitra esta jugada: "${text}"` }
      ]);
    }

    waitUntil(logToLoki(env, { level: "info", message: `Processed ${inputType}`, inputType, mode, duration: Date.now() - start }));
    return new Response(JSON.stringify({ score: resultText }), { headers: { "Content-Type": "application/json" } });

  } catch (err) {
    const keyHint = env.GEMINI_KEY ? `${env.GEMINI_KEY.substring(0, 4)}...` : "MISSING";
    waitUntil(logToLoki(env, { level: "error", message: `Key: ${keyHint}, Error: ${err.message}` }));
    return new Response(JSON.stringify({ error: `${err.message} (Key: ${keyHint})` }), { status: 500 });
  }
}

async function callGemini(apiKey, userParts) {
  const model = "gemini-pro"; 
  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ role: "user", parts: userParts }] })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "Sin respuesta.";
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
