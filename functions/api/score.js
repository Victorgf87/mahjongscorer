/**
 * API Endpoint: /api/score
 * Ultra-Robust Arbiter for Mahjong
 * v4.15.0-gemini-2.0
 */

const RULES_MD = `
# DICCIONARIO OFICIAL DE ARBITRAJE MAHJONG
## REGLAMENTO MCR (Chinese Official) - PUNTOS DIRECTOS
- 88 PUNTOS: Big Four Winds, Big Three Dragons, All Green, Nine Gates, Four Kongs, Seven Shifted Pairs, Thirteen Orphans.
- 64 PUNTOS: All Terminals, Little Four Winds, Little Three Dragons, All Honors, Four Pure Pungs, Orchid.
- 48 PUNTOS: Quadruple Pure Chow, Four Pure Shifted Pungs.
- 32 PUNTOS: Four Pure Shifted Chows, Three Kongs, All Terminals and Honors.
- 24 PUNTOS: Seven Pairs, Greater Honors and Knitted Tiles, All Pungs, Pure Triple Chow, Mixed Shifted Pungs, Upper/Middle/Lower Tiles.
- 16 PUNTOS: Pure Straight, Three-Suited Terminal Chows, Pure Shifted Pungs, All Five, Triple Knitted Chow.
- 12 PUNTOS: Lesser Honors and Knitted Tiles, Knitted Straight, Upper/Lower Four, Big Three Winds.
- 8 PUNTOS: Mixed Straight, Reversible Tiles, Mixed Triple Chow, Two Pure Terminal Chows, Mixed Shifted Chows, Chicken Hand.
- 6 PUNTOS: All Pungs, All Half-Flush, Mixed Shifted Pungs, Two Dragons.
- 4 PUNTOS: Fully Concealed, Last Tile, Out with Replacement, Robbing the Kong.
- 2 PUNTOS: Dragon Pung, Prevalent Wind, Seat Wind, Concealed Hand, All Chows, Tile Hog, Double Pung, Two Mixed Terminal Chows.
- 1 PUNTO: Pure Double Chow, Mixed Double Pung, Short Straight, Two Terminal Chows, Pung of Terminals or Honors, Melded Kong, One Voided Suit, No Terminals, Edge/Closed/Single Wait, Self-Drawn.

## REGLAMENTO RIICHI (Japonés) - HAN / FU
- 1 HAN: Riichi, Tsumo (Mano cerrada), Pinfu, Tanyao, Iippatsu, Fanpai, Iipeiko, Haitey, Houtei, Rinshan, Chankan.
- 2 HAN: Double Riichi, Sanshoku Doujun, Ittsu, Chanta, Toitoi, Sanankou, Sanshoku Doukou, Sankantsu, Chiitoitsu, Honrouto, Shousangen.
- 3 HAN: Honitsu, Junchan, ryanpeiko.
- 6 HAN: Chinitsu.
- YAKUMAN: Kokushi Musou, Suuankou, Daisangen, Shousuushii, Daisuushii, Tsuuuisou, Ryuuisou, Chinroutou, Chuuren Poutou, Suukantsu.

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
  try {
    const { audio, text, mode } = await request.json();
    const modePrompt = mode === 'Riichi' ? "SISTEMA SELECCIONADO: RIICHI." : "SISTEMA SELECCIONADO: MCR.";
    const parts = [{ text: `${SYSTEM_CONTEXT}\n\n${modePrompt}` }];
    
    if (audio) parts.push({ inline_data: { mime_type: "audio/webm", data: audio } }, { text: "Arbitra el audio." });
    else parts.push({ text: `Arbitra esta jugada: "${text}"` });

    // Intento 1: Gemini 1.5 Flash (El más rápido y moderno)
    let response = await callGeminiAPI(env.GEMINI_KEY, "gemini-2.0-flash", parts);
    
    // Si falla por "modelo no encontrado", intentamos con Gemini Pro (Universal)
    if (response.error && response.error.includes("not found")) {
        response = await callGeminiAPI(env.GEMINI_KEY, "gemini-pro", parts);
    }

    if (response.error) throw new Error(response.error);

    return new Response(JSON.stringify({ score: response.text }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

async function callGeminiAPI(apiKey, model, parts) {
  // Probamos primero con v1beta que es la más compatible con nombres de modelos
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts }] })
    });
    const data = await res.json();
    if (data.error) return { error: data.error.message };
    return { text: data.candidates?.[0]?.content?.parts?.[0]?.text || "Sin respuesta." };
  } catch (e) {
      return { error: e.message };
  }
}
