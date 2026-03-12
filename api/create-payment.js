export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const fedapaySecretKey = process.env.FEDAPAY_SECRET_KEY;
    const fedapayPublicKey = process.env.FEDAPAY_PUBLIC_KEY;
    const fedapayEnv = process.env.FEDAPAY_ENV || "test";

    if (!fedapaySecretKey || !fedapayPublicKey) {
      return res.status(500).json({
        error: "FedaPay keys are missing in Vercel environment variables",
      });
    }

    const { amount, customerName, customerPhone, description, bookingData } = req.body || {};

    if (!amount || !customerPhone) {
      return res.status(400).json({
        error: "Missing required fields: amount and customerPhone",
      });
    }

    return res.status(200).json({
      message: "create-payment endpoint is working",
      mode: fedapayEnv,
      payment_provider: "FedaPay",
      public_key_loaded: !!fedapayPublicKey,
      secret_key_loaded: !!fedapaySecretKey,
      amount,
      customerName: customerName || null,
      customerPhone,
      description: description || "Jeux Dia booking payment",
      bookingData: bookingData || null,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Server error",
    });
  }
}