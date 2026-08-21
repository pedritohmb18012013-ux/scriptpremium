import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Método não permitido"
    });
  }

  try {
    const { nome, codigo } = req.body || {};

    if (!nome || !codigo) {
      return res.status(400).json({
        success: false,
        error: "Digite o nome e o código."
      });
    }

    const sql = neon(process.env.DATABASE_URL);

    const result = await sql`
      SELECT
        id,
        nome,
        codigo,
        status,
        expires_at
      FROM comprovantes
      WHERE LOWER(TRIM(nome)) = LOWER(TRIM(${nome}))
        AND UPPER(TRIM(codigo)) = UPPER(TRIM(${codigo}))
      LIMIT 1
    `;

    if (result.length === 0) {
      return res.status(401).json({
        success: false,
        error: "Nome ou código inválido."
      });
    }

    const acesso = result[0];

    if (acesso.status !== "aprovado") {
      return res.status(403).json({
        success: false,
        error: "Este código ainda não está aprovado."
      });
    }

    if (!acesso.expires_at) {
      return res.status(403).json({
        success: false,
        error: "Este acesso não possui validade."
      });
    }

    if (new Date(acesso.expires_at) <= new Date()) {
      return res.status(403).json({
        success: false,
        error: "Este código expirou."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Acesso liberado!",
      codigo: acesso.codigo,
      expires_at: acesso.expires_at
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      success: false,
      error: "Erro ao verificar o acesso."
    });
  }
}
