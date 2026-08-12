export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      valid: false,
      error: "Método não permitido"
    });
  }

  const { code } = req.body || {};

  const codes = process.env.ACCESS_CODES;

  if (!codes) {
    return res.status(500).json({
      valid: false,
      error: "Sistema ainda não configurado."
    });
  }

  const validCodes = codes
    .split(",")
    .map(item => {
      const [codeValue, expires] = item.split("|");

      return {
        code: codeValue.trim().toUpperCase(),
        expires: expires.trim()
      };
    })
    .filter(item => item.code && item.expires);

  const enteredCode = String(code || "").trim().toUpperCase();

  const found = validCodes.find(item => item.code === enteredCode);

  if (!found) {
    return res.status(401).json({
      valid: false,
      error: "Código inválido."
    });
  }

  const today = new Date().toISOString().slice(0, 10);

  if (today > found.expires) {
    return res.status(401).json({
      valid: false,
      error: "Código expirado."
    });
  }

  return res.status(200).json({
    valid: true,
    expires: found.expires
  });
}
