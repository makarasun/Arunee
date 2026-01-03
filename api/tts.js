export const config = { runtime: "nodejs" };

const DEFAULT_VOICE_ID = "6NqqYkRUdfkapV7zND1u";
const DEFAULT_MODEL_ID = "eleven_v3";

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

  const apiKey = cleanKey(process.env.ELEVENLABS_API_KEY);
  if (!apiKey || !apiKey.startsWith("sk_")) {
    return json(res, 500, { error: "ELEVENLABS_API_KEY missing (paste raw key)" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const text = String(body?.text || "").trim();
    if (!text) return json(res, 400, { error: "Missing text" });

    const voiceId = cleanKey(process.env.ELEVENLABS_VOICE_ID) || DEFAULT_VOICE_ID;
    const modelId = process.env.ELEVENLABS_MODEL_ID || DEFAULT_MODEL_ID;

    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0,
          use_speaker_boost: true,
        },
      }),
    });

    if (!r.ok) {
      const errText = await r.text().catch(() => "");
      let errJson = {};
      try { errJson = JSON.parse(errText); } catch {}
      return json(res, r.status, { error: errJson?.detail || errJson || errText });
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
