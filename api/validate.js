export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      valid: false,
      error: "Método não permitido"
    });
  }

  const { code } = req.body || {};

  const expected = process.env.ACCESS_CODE;
  const expires = process.env.ACCESS_EXPIRES;

  if (!expected || !expires) {
    return res.status(500).json({
      valid: false,
      error: "Sistema ainda não configurado."
    });
  }

  const today = new Date().toISOString().slice(0, 10);

  if (String(code || "").trim().toUpperCase() !== expected.toUpperCase()) {
    return res.status(401).json({
      valid: false,
      error: "Código inválido."
    });
  }

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
