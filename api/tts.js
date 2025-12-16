export const config = { runtime: "nodejs" };

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
    return json(res, 500, { error: "OPENAI_API_KEY missing (paste raw key)" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const text = String(body?.text || "").trim();
    if (!text) return json(res, 400, { error: "Missing text" });

    const voice = process.env.OPENAI_TTS_VOICE || "alloy"; // fixed voice for stability
    const model = process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts";

    const r = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        voice,
        format: "mp3",
        input: text,
      }),
    });

    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      return json(res, r.status, { error: err?.error || err });
    }

    const audio = Buffer.from(await r.arrayBuffer());
    res.statusCode = 200;
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    res.end(audio);
  } catch (e) {
    return json(res, 500, { error: String(e?.message || e) });
  }
}
