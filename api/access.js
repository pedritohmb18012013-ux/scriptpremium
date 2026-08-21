import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Método não permitido"
    });
  }

  const token = String(req.query.token || "").trim();

  if (!token) {
    return res.status(400).json({
      success: false,
      valid: false,
      error: "Token não informado"
    });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

    const result = await sql`
      SELECT
        id,
        status,
        expires_at
      FROM comprovantes
      WHERE access_token = ${token}
      LIMIT 1
    `;

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        valid: false,
        error: "Acesso não encontrado"
      });
    }

    const acesso = result[0];

    if (acesso.status !== "aprovado") {
      return res.status(403).json({
        success: false,
        valid: false,
        error: "Acesso ainda não aprovado"
      });
    }

    if (!acesso.expires_at) {
      return res.status(403).json({
        success: false,
        valid: false,
        error: "Acesso sem data de expiração"
      });
    }

    const expirado = new Date(acesso.expires_at) <= new Date();

    if (expirado) {
      return res.status(403).json({
        success: false,
        valid: false,
        expired: true,
        error: "Seu acesso expirou"
      });
    }

    return res.status(200).json({
      success: true,
      valid: true,
      expires: acesso.expires_at
    });

  } catch (error) {
    console.error("ACCESS ERROR:", error);

    return res.status(500).json({
      success: false,
      valid: false,
      error: "Erro ao verificar acesso"
    });
  }
}
