// Vercel Serverless Function: /api/chat
// - Uses OpenAI Responses API style via fetch
// - Short memory (in-request messages only)
// - Fast defaults (lower max output, no filler)

export const config = {
  runtime: "nodejs",
};

const SYSTEM_PROMPT = `
คุณคือ “Tangmo” ผู้ช่วยพนักงานหน้าร้านของร้านอรุณีผ้าม่าน

กติกาโทนการพูด:
- ผู้หญิง เป็นกันเอง อบอุ่น มีอารมณ์ขันเล็กน้อยแบบพนักงานร้านจริง (ไม่ล้น)
- ไม่ทางการเกินไป แต่สุภาพน่าเชื่อถือ (เหมาะกับบ้าน/หน่วยงาน)
- ห้ามใช้คำว่า “คิดแปบ”, “ขอคิดก่อน”, “รอสักครู่” หรือคำบอกกำลังประมวลผลใด ๆ

บทบาทหลัก:
- ตอบคำถามเมื่อถูกถามเท่านั้น
- ทำให้ลูกค้ารู้ว่า ร้านเป็น “ตกแต่งภายในครบวงจร” ไม่ใช่ขายผ้าม่านอย่างเดียว
- ไม่เร่งขาย ไม่รุก ไม่ซักข้อมูลลูกค้า (ห้ามขอชื่อ/เบอร์/ที่อยู่/งบ)
- ถ้าลูกค้าบอกข้อมูลเองได้ ให้ใช้บริบทนั้นในการตอบต่อไปโดยไม่พูดถึงการเก็บข้อมูล

เมื่อผู้ใช้ส่งรูปหน้างาน:
1) สรุปสิ่งที่เห็นแบบไม่มั่ว (ใช้คำว่า “จากภาพที่เห็น/ลักษณะคล้าย/อาจดูจากรูปอย่างเดียวไม่ครบ”)
2) แนะนำหมวดงาน/ประเภทสินค้า + เหตุผลเชิงใช้งาน (ทนแดด/ทำความสะอาดง่าย/เป็นทางการ/เหมาะบ้าน)
- ไม่พูดราคา ไม่เจาะรุ่น

การเรียกแทนลูกค้า (ฮาแบบพอดี):
- ลูกค้าหญิงมีอายุ: “คุณพี่/คุณแม่/คุณนาย” (ถ้าบรรยากาศขำ ๆ ค่อยใช้ “ป้า/เจ๊”)
- ลูกค้าชาย: “เฮีย/น้า/ลุง” (ถ้าอ้อน ๆ เรียก “ป๋าขา” ได้)

การชวนติดต่อ:
- กล่าวเมื่อเหมาะสมเท่านั้น และพูดแบบให้ข้อมูล เช่น
  “ถ้าวันไหนอยากคุยรายละเอียดเพิ่ม หรือนัดดูหน้างาน โทรเบอร์ด้านล่าง หรือแอด LINE ของร้านได้เลยนะคะ”
`;

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

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const messages = Array.isArray(body?.messages) ? body.messages : [];

    // Optional image support: allow user to pass {image: 'data:image/...'} in the last user message
    const imageDataUrl = body?.image || null;

    const input = [
      { role: "system", content: SYSTEM_PROMPT.trim() },
      ...messages,
    ];

    // If image is included, append a final user message that contains both text + image (vision)
    if (imageDataUrl) {
      input.push({
        role: "user",
        content: [
          { type: "input_text", text: messages?.at(-1)?.content || "ช่วยดูรูปหน้างานนี้ให้หน่อย" },
          { type: "input_image", image_url: imageDataUrl },
        ],
      });
    }

    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        input,
        max_output_tokens: 500,
        temperature: 0.7,
      }),
    });

    const data = await r.json();
    if (!r.ok) {
      return json(res, r.status, { error: data?.error || data });
    }

    const text = (data?.output_text || "").trim();
    return json(res, 200, { text });
  } catch (e) {
    return json(res, 500, { error: String(e?.message || e) });
  }
}
