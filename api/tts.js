export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.statusCode = 405;
    return res.end("Method not allowed");
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const text = String(body.text || "").trim();
    if (!text) {
      res.statusCode = 400;
      return res.end("Missing text");
    }

    const voice = process.env.OPENAI_TTS_VOICE || "alloy"; // เปลี่ยนได้ใน Vercel env
    const model = process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts";

    const r = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        voice,
        input: text,
        format: "mp3",
        speed: 1.05,
      }),
    });

    if (!r.ok) {
      const err = await r.text();
      res.statusCode = r.status;
      return res.end(err);
    }

    const buf = Buffer.from(await r.arrayBuffer());
    res.statusCode = 200;
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    return res.end(buf);
  } catch (e) {
    res.statusCode = 500;
    return res.end(String(e?.message || e));
  }
}
