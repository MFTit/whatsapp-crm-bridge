export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    const { to, template } = req.body || {};
    if (!to || !template?.name) {
      return res.status(400).json({ ok: false, message: "Missing 'to' or template.name" });
    }

    const token = process.env.WHATSAPP_TOKEN;          // system user token
    const phoneNumberId = process.env.PHONE_NUMBER_ID; // from WhatsApp > API Setup

    const r = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: template.name,                    // e.g., "quote_link_update"
          language: { code: template.lang || "pt_BR" },
          components: template.components || []   // body/header/button params
        }
      })
    });

    const data = await r.json();
    if (!r.ok) return res.status(400).json({ ok: false, error: data });
    return res.status(200).json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message });
  }
}
