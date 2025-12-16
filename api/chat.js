export const config = { runtime: "nodejs" };

const ASSISTANT_PROMPT =
  process.env.OPENAI_ASSISTANT_PROMPT ||
  `You are Tangmo, an assistant for "Arunee Curtains", a shop offering comprehensive interior design services (curtains, walls, floors, design, install, aftercare). Be concise, friendly, and give practical suggestions. Respond in Thai unless user uses another language. If an image is provided, describe and give recommendations relevant to the service.`;

function cleanKey(raw) {
  return String(raw || "")
    .trim()
    .replace(/^["']+|["']+$/g, "")
    .replace(/\\+/g, "");
}

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "Method not allowed" });
  }

  const apiKey = cleanKey(process.env.OPENAI_API_KEY);
  if (!apiKey || !apiKey.startsWith("sk-")) {
    return json(res, 500, {
      error: "OPENAI_API_KEY missing/invalid (paste raw key, no quotes/backslashes)"
    });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const imageDataUrl = body?.image || null;

    const input = [{ role: "system", content: ASSISTANT_PROMPT }];
    messages.forEach((m) => input.push({ role: m.role, content: m.content }));

    if (imageDataUrl) {
      input.push({
        role: "user",
        content: [
          { type: "input_text", text: messages?.at(-1)?.content || "ภาพหน้างาน" },
          { type: "input_image", image_url: imageDataUrl },
        ],
      });
    }

    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        input,
        max_output_tokens: 520,
        temperature: 0.7,
      }),
    });

    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return json(res, r.status, { error: data?.error || data });
    }

    const text =
      (data?.output_text || "").trim() ||
      (data?.output ?? [])
        .map((o) => (o?.content ?? []).map((c) => c?.text || "").join(""))
        .join("")
        .trim() ||
      (data?.content?.[0]?.text || "").trim();

    if (!text) {
      return json(res, 500, { error: data?.error || "empty response from OpenAI" });
    }

    return json(res, 200, { text });
  } catch (e) {
    return json(res, 500, { error: String(e?.message || e) });
  }
}
