import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  const adminKey = req.headers["x-admin-key"];

  if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({
      success: false,
      error: "Não autorizado"
    });
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    // LISTAR COMPROVANTES
    if (req.method === "GET") {
      const comprovantes = await sql`
        SELECT id, nome, codigo, comprovante_url, status, criado_em
        FROM comprovantes
        ORDER BY criado_em DESC
      `;

      return res.status(200).json({
        success: true,
        comprovantes
      });
    }

    // APROVAR OU REJEITAR
    if (req.method === "PATCH") {
      const { id, status } = req.body || {};

      if (!id || !["aprovado", "rejeitado"].includes(status)) {
        return res.status(400).json({
          success: false,
          error: "Dados inválidos"
        });
      }

      const result = await sql`
        UPDATE comprovantes
        SET status = ${status}
        WHERE id = ${id}
        RETURNING id, nome, codigo, status
      `;

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Comprovante não encontrado"
        });
      }

      return res.status(200).json({
        success: true,
        comprovante: result[0]
      });
    }

    return res.status(405).json({
      success: false,
      error: "Método não permitido"
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      error: "Erro interno"
    });
  }
}
