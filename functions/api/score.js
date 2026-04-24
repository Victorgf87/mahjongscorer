/**
 * API Endpoint: /api/score
 * Arbiter for Mahjong hands (Stable v1)
 * v4.14.7-stable
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
Analiza la jugada, identifica elementos y calcula el total final.
FORMATO:
ENTRADA: [Lo que has entendido]
---
ELEMENTOS:
- [Elemento]: [Valor]
SUMA BASE: [Puntos]
CÁLCULO FINAL:
-- SI ES TSUMO: ([Suma Base] + 8) * 3 = [Puntos]
-- SI ES RON: [Suma Base] + 24 = [Puntos]
PUNTUACIÓN FINAL: [Resultado Final]
---
Breve explicación.`;

export async function onRequestPost(context) {
  const { request, env, waitUntil } = context;
  try {
    const { audio, text, mode } = await request.json();
    const model = "gemini-1.5-flash"; 
    const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${env.GEMINI_KEY}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [
          { text: `${SYSTEM_CONTEXT}\n\nMODO: ${mode}` },
          ...(audio ? [{ inline_data: { mime_type: "audio/webm", data: audio } }] : []),
          { text: text || "Arbitra el audio adjunto." }
        ]}]
      })
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    
    return new Response(JSON.stringify({ score: data.candidates[0].content.parts[0].text }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
