/**
 * API Endpoint: /api/score
 * Arbiter for Mahjong hands (Voice or Text)
 * v4.12.1-smart-api
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

const BASE_PROMPT = `
Eres el Árbitro Supremo de Mahjong. Tu precisión es absoluta. 
Usa esta TABLA DE REGLAS como única fuente de verdad:

${RULES_MD}

INSTRUCCIONES:
1. Analiza la jugada proporcionada (puede ser por audio o texto).
2. Identifica los elementos de la jugada que aparecen en la tabla.
3. Calcula el total siguiendo estrictamente las fórmulas proporcionadas.
4. Si la entrada es ambigua o incoherente, intenta interpretarla con sentido común de Mahjong, pero prioriza la tabla.

FORMATO DE RESPUESTA OBLIGATORIO:
ENTRADA: [Escribe aquí exactamente lo que has entendido de la jugada]
---
- [Elemento]: [Valor]
- [Elemento]: [Valor]
--- TOTAL: [Suma total]
-- TSUMO: [Cálculo] = [Resultado Final]
-- RON: [Cálculo] = [Resultado Final]

Breve explicación técnica.
`;

export async function onRequestPost(context) {
  const { request, env, waitUntil } = context;

  try {
    const { audio, text, mode } = await request.json();
    
    const modePrompt = mode === 'Riichi' ? "SISTEMA SELECCIONADO: RIICHI." : "SISTEMA SELECCIONADO: MCR.";
    const systemInstruction = `${BASE_PROMPT}\n\n${modePrompt}`;
    
    let resultText = "";

    if (audio) {
      // Proceso de audio como antes
      resultText = await callGemini(env.GEMINI_KEY, systemInstruction, [
        { inline_data: { mime_type: "audio/webm", data: audio } },
        { text: "Arbitra esta mano de Mahjong." }
      ]);
    } else if (text) {
      // Proceso de texto manual
      resultText = await callGemini(env.GEMINI_KEY, systemInstruction, [
        { text: `Arbitra esta jugada de texto: "${text}"` }
      ]);
    } else {
      throw new Error("No input provided (audio or text)");
    }
    
    return new Response(JSON.stringify({ score: resultText }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

async function callGemini(apiKey, systemInstruction, userParts) {
  const model = "gemini-1.5-flash-latest"; 
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: "user", parts: userParts }]
    })
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "Sin respuesta.";
}
