export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { text } = req.body || {};
  const input = String(text || "").slice(0, 2000);

  // โทน B (สดใส/ขี้เล่น) — ลองตามลำดับนี้
  const voices = ["shimmer", "nova", "aria", "verse", "alloy"];

  let lastErr = null;

  for (const voice of voices) {
    try {
      const r = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini-tts",
          voice,
          format: "mp3",
          input,
        }),
      });

      if (!r.ok) {
        lastErr = await r.text();
        continue;
      }

      const buf = Buffer.from(await r.arrayBuffer());
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("X-Tangmo-Voice", voice);
      return res.status(200).send(buf);
    } catch (e) {
      lastErr = String(e);
      continue;
    }
  }

  return res.status(500).send(lastErr || "TTS failed");
}
