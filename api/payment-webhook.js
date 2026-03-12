export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const webhookSecret = process.env.FEDAPAY_WEBHOOK_SECRET || null;
    const signature = req.headers["x-fedapay-signature"] || null;
    const body = req.body || {};

    console.log("FedaPay webhook received:", {
      hasWebhookSecret: !!webhookSecret,
      hasSignature: !!signature,
      eventName: body?.name || body?.event || null,
      eventData: body?.data || null,
    });

    return res.status(200).json({
      ok: true,
      message: "Webhook received",
      hasWebhookSecret: !!webhookSecret,
      hasSignature: !!signature,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message || "Webhook server error",
    });
  }
}