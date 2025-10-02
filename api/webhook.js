export default async function handler(req, res) {
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send("Forbidden");
  }

  if (req.method === "POST") {
    try {
      // WhatsApp will POST events here. For now, just acknowledge.
      // We'll parse and log later when we add a DB.
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(200).json({ ok: true }); // Always 200 to avoid retries storm
    }
  }

  return res.status(405).send("Method Not Allowed");
}
