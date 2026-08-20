export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Método não permitido"
    });
  }

  try {
    const { name, code, proof } = req.body || {};

    if (!name || !code || !proof) {
      return res.status(400).json({
        success: false,
        error: "Dados incompletos"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Comprovante recebido",
      data: {
        name,
        code,
        proof
      }
    });
  } catch {
    return res.status(500).json({
      success: false,
      error: "Erro interno"
    });
  }
}
