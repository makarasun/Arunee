export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, image, history } = req.body || {};

  const system = `<<SYSTEM PROMPT TANGMO ตัวเต็มที่กูให้มึงก่อนหน้านี้ วางตรงนี้ทั้งก้อน>>`;

  const messages = [
    { role: "system", content: system },
    ...(Array.isArray(history)
      ? history.map(h => ({
          role: h.role === "assistant" ? "assistant" : "user",
          content: String(h.content || "")
        }))
      : []),
    {
      role: "user",
      content: image
        ? [
            { type: "text", text: message || "" },
            { type: "image_url", image_url: { url: image } }
          ]
        : [{ type: "text", text: message || "สวัสดี" }]
    }
  ];

  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages
    })
  });

  const data = await r.json();
  const reply = data?.choices?.[0]?.message?.content || "ขอโทษค่ะ ตอนนี้ระบบยังไม่พร้อม";

  res.status(200).json({ reply });
}
