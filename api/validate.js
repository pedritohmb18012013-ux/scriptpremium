export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      valid: false,
      error: "Método não permitido"
    });
  }

  const { code } = req.body || {};

  const codes = process.env.ACCESS_CODES;
  const expires = process.env.ACCESS_EXPIRES;

  if (!codes || !expires) {
    return res.status(500).json({
      valid: false,
      error: "Sistema ainda não configurado."
    });
  }

  const validCodes = codes
    .split(",")
    .map(item => item.trim().toUpperCase())
    .filter(Boolean);

  const enteredCode = String(code || "").trim().toUpperCase();

  if (!validCodes.includes(enteredCode)) {
    return res.status(401).json({
      valid: false,
      error: "Código inválido."
    });
  }

  const today = new Date().toISOString().slice(0, 10);

  if (today > expires) {
    return res.status(401).json({
      valid: false,
      error: "Código expirado."
    });
  }

  return res.status(200).json({
    valid: true,
    expires: expires
  });
}
