export const config = { runtime: "nodejs" };

// ใช้ Assistant ID จาก env หรือค่าที่ให้มา
const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID || "asst_mJUHv4jgkoQFbKigrEovVf9q";

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
      error: "OPENAI_API_KEY missing/invalid (remove quotes/backslashes and paste raw key)"
    });
  }
  if (!ASSISTANT_ID) {
    return json(res, 500, { error: "OPENAI_ASSISTANT_ID missing" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const imageDataUrl = body?.image || null;

    const input = [];
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
        "OpenAI-Beta": "assistants=v2",
      },
      body: JSON.stringify({
        assistant_id: ASSISTANT_ID,
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
