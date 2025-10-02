// Minimal sender for WhatsApp Cloud API
// Supports POST (preferred) and a temporary GET mode so you can test from the browser.
// We'll lock this down later.

export default async function handler(req, res) {
  try {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.PHONE_NUMBER_ID;
    if (!token || !phoneNumberId) {
      return res.status(500).json({ ok: false, message: "Missing env: WHATSAPP_TOKEN or PHONE_NUMBER_ID" });
    }

    // Allow quick GET testing: /api/send-template?to=55XXXXXXXXXX&tpl=hello_world
    if (req.method === "GET") {
      const to = req.query.to;
      const tpl = req.query.tpl || "hello_world";
      if (!to) return res.status(400).json({ ok: false, message: "Missing 'to' in query" });

      const r = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: { name: tpl, language: { code: "pt_BR" } }
        })
      });

      const data = await r.json();
      return res.status(r.ok ? 200 : 400).json({ ok: r.ok, data });
    }

    // POST mode (for later, from CRM)
    if (req.method === "POST") {
      const { to, template } = req.body || {};
      if (!to || !template?.name) {
        return res.status(400).json({ ok: false, message: "Missing 'to' or template.name" });
      }

      const r = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: template.name,
            language: { code: template.lang || "pt_BR" },
            components: template.components || []
          }
        })
      });

      const data = await r.json();
      return res.status(r.ok ? 200 : 400).json({ ok: r.ok, data });
    }

    return res.status(405).send("Method Not Allowed");
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message });
  }
}
