var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker/index.ts
import portfolioContext from "./d7cb8ad13c634e1ba7340b3f42022f36bce92014-portfolio-context.md";
var LOCAL_DEV_ORIGINS = /* @__PURE__ */ new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173"
]);
function getCorsHeaders(request, env) {
  const origin = request.headers.get("Origin") ?? "";
  const allowedOrigin = env.ALLOWED_ORIGIN || "https://lazaroo1.github.io";
  const allowOrigin = origin === allowedOrigin || LOCAL_DEV_ORIGINS.has(origin) ? origin : allowedOrigin;
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}
__name(getCorsHeaders, "getCorsHeaders");
function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...init.headers || {}
    }
  });
}
__name(jsonResponse, "jsonResponse");
function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];
  const normalized = history.slice(-8).map((message) => {
    const item = message;
    if (item.role !== "user" && item.role !== "assistant") return null;
    if (typeof item.content !== "string" || !item.content.trim()) return null;
    return {
      role: item.role === "assistant" ? "model" : "user",
      parts: [{ text: item.content.trim().slice(0, 2e3) }]
    };
  }).filter((message) => message !== null);
  while (normalized[0]?.role === "model") {
    normalized.shift();
  }
  return normalized;
}
__name(normalizeHistory, "normalizeHistory");
function getSystemInstruction() {
  return `${portfolioContext}

Instrucciones finales:
- Responde siempre en el idioma del usuario.
- No inventes proyectos, estudios ni experiencia.
- S\xE9 concreto: m\xE1ximo 5 bullets o 2 p\xE1rrafos cortos.
- Si el usuario pregunta algo casual, responde breve y vuelve al perfil, proyectos o stack de L\xE1zaro.
- Si falta informaci\xF3n, dilo y sugiere revisar GitHub, LinkedIn o contactar a L\xE1zaro.`;
}
__name(getSystemInstruction, "getSystemInstruction");
var index_default = {
  async fetch(request, env) {
    const corsHeaders = getCorsHeaders(request, env);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    if (request.method !== "POST") {
      return jsonResponse(
        { error: "Method not allowed" },
        { status: 405, headers: corsHeaders }
      );
    }
    if (!env.GEMINI_API_KEY) {
      return jsonResponse(
        { error: "Missing GEMINI_API_KEY secret" },
        { status: 500, headers: corsHeaders }
      );
    }
    try {
      const body = await request.json();
      const message = typeof body.message === "string" ? body.message.trim() : "";
      if (!message) {
        return jsonResponse(
          { error: "Missing message" },
          { status: 400, headers: corsHeaders }
        );
      }
      const model = env.GEMINI_MODEL || "gemini-2.5-flash";
      const contents = [
        ...normalizeHistory(body.history),
        { role: "user", parts: [{ text: message.slice(0, 4e3) }] }
      ];
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": env.GEMINI_API_KEY
          },
          body: JSON.stringify({
            contents,
            systemInstruction: {
              parts: [{ text: getSystemInstruction() }]
            },
            generationConfig: {
              temperature: 0.35,
              topP: 0.8,
              maxOutputTokens: 420
            }
          })
        }
      );
      const data = await geminiResponse.json();
      const reply = data.candidates?.flatMap((candidate) => candidate.content?.parts ?? []).map((part) => part.text ?? "").join("").trim();
      if (!geminiResponse.ok || !reply) {
        return jsonResponse(
          {
            error: "Gemini API error",
            details: data.error?.message || "Empty response from Gemini"
          },
          { status: geminiResponse.status || 502, headers: corsHeaders }
        );
      }
      return jsonResponse({ reply }, { status: 200, headers: corsHeaders });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return jsonResponse(
        { error: "Internal Server Error", message },
        { status: 500, headers: corsHeaders }
      );
    }
  }
};
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
