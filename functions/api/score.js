const RULES_MD = `
# REGLAMENTO OFICIAL MAHJONG (LOOKUP TABLE)
## MCR (Chinese Official)
- Big Four Winds/Big Three Dragons/All Green: 88 pts.
- All Terminals/Little Four Winds/Little Three Dragons: 64 pts.
- All Terminals and Honors (Honroutou): 32 pts.
- Seven Pairs (Siete Pares)/All Pungs (Todo Pon): 24 pts. (Nota: Si es All Pungs básico sin más, aplicar 6 pts, pero si es combinada con otras, evaluar valor real).
- Pure Straight (Escalera Pura): 16 pts.
- All Pungs (Básico): 6 pts.
- Fully Concealed (Totalmente Oculta): 4 pts.
- Concealed Hand (Mano Oculta): 2 pts.
- Dragon Pung (Pon Dragón): 2 pts.
- Pure Double Chow (2 Chis iguales): 1 pt.

## CÁLCULOS MCR
- Tsumo: (Total + 8) * 3
- Ron: Total + 24
`;

const BASE_PROMPT = `
Eres el Árbitro Supremo Internacional de Mahjong. Tu precisión es absoluta.
Usa la siguiente TABLA DE REGLAS como única fuente de verdad para los puntos:

${RULES_MD}

FORMATO DE RESPUESTA OBLIGATORIO:
- [Jugada]: [Valor de la Tabla]
--- Total: [Suma]
-- Si Tsumo: [Cálculo matemático] = [Resultado]
-- Si Ron: [Cálculo matemático] = [Resultado]
(Separador)
Explicación técnica basada en la tabla de reglas.
`;

export async function onRequestPost(context) {
  const { request, env, waitUntil } = context;

  try {
    const { audio, mode } = await request.json();
    
    const modePrompt = mode === 'Riichi' 
      ? "SISTEMA SELECCIONADO: RIICHI."
      : "SISTEMA SELECCIONADO: MCR.";

    const systemInstruction = `${BASE_PROMPT}\n\n${modePrompt}`;
    
    // Usamos el modelo Flash (Barato, rápido y ahora preciso con la tabla)
    const result = await callGeminiWithRules(audio, env.GEMINI_KEY, systemInstruction, env, waitUntil);
    
    return new Response(JSON.stringify({ text: result.text }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

async function callGeminiWithRules(base64Audio, apiKey, systemInstruction, env, waitUntil) {
  // Alias estable para 1.5 Flash (Tier de pago)
  const model = "gemini-flash-latest"; 
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: "user", parts: [
        { inline_data: { mime_type: "audio/webm", data: base64Audio } },
        { text: "Arbitra esta mano siguiendo estrictamente la tabla de reglas proporcionada." }
      ]}]
    })
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  
  return { model, text: data.candidates?.[0]?.content?.parts?.[0]?.text || "Sin respuesta." };
}
