// api/send-template.js
// Minimal WhatsApp Cloud API sender for Vercel (Node 20).
// Supports:
//  - GET  /api/send-template?to=55XXXXXXXXXX&tpl=template_name&lang=pt_BR
//  - POST /api/send-template  (with JSON body including template components)
//  - GET  /api/send-template?debug=1  (prints which env vars the server is using)

export default async function handler(req, res) {
  try {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.PHONE_NUMBER_ID;

    if (!token || !phoneNumberId) {
      return res.status(500).json({
        ok: false,
        message: "Missing env: WHATSAPP_TOKEN or PHONE_NUMBER_ID"
      });
    }

    // ✅ DEBUG endpoint: shows which Phone Number ID & token prefix the server is using
    if (req.method === "GET" && req.query.debug === "1") {
      const tokenPrefix = token.slice(0, 12);
      return res.status(200).json({
        usingPhoneNumberId: phoneNumberId,
        tokenStartsWith: tokenPrefix
      });
    }

    // ✅ Simple GET send (no variables) — good for smoke tests from the browser
    if (req.method === "GET") {
      const to = req.query.to;
      const tpl = req.query.tpl || "hello_world";
      const lang = req.query.lang || "en_US"; // hello_world exists in en_US

      if (!to) {
        return res.status(400).json({ ok: false, message: "Missing 'to' in query" });
      }

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
          template: { name: tpl, language: { code: lang } }
        })
      });

      const data = await r.json();
      return res.status(r.ok ? 200 : 400).json({ ok: r.ok, data });
    }

    // ✅ POST send (use this for templates with variables/components)
    if (req.method === "POST") {
      const { to, template } = req.body || {};
      if (!to || !template?.name) {
        return res.status(400).json({ ok: false, message: "Missing 'to' or template.name" });
      }

      const lang = template.lang || "en_US";

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
            name: template.name,
            language: { code: lang },
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
