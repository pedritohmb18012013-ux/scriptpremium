import { neon } from "@neondatabase/serverless";
import crypto from "crypto";

function gerarCodigo() {
  const parte = crypto.randomBytes(6).toString("hex").toUpperCase();
  return `SP-${parte}`;
}

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

    // CRIAR CÓDIGO
    if (req.method === "POST") {
      const { nome, days } = req.body || {};

      if (!nome || ![1, 7, 30].includes(Number(days))) {
        return res.status(400).json({
          success: false,
          error: "Nome ou período inválido."
        });
      }

      const codigo = gerarCodigo();

      const result = await sql`
        INSERT INTO comprovantes
          (
            nome,
            codigo,
            comprovante_url,
            status,
            amount,
            days,
            access_token,
            expires_at
          )
        VALUES
          (
            ${nome},
            ${codigo},
            'ADMIN',
            'aprovado',
            0,
            ${Number(days)},
            ${codigo},
            NOW() + (${Number(days)} * INTERVAL '1 day')
          )
        RETURNING
          id,
          nome,
          codigo,
          days,
          expires_at,
          status
      `;

      return res.status(201).json({
        success: true,
        message: "Código criado com sucesso.",
        codigo: result[0]
      });
    }

    // LISTAR
    if (req.method === "GET") {
      const comprovantes = await sql`
        SELECT
          id,
          nome,
          codigo,
          comprovante_url,
          status,
          criado_em,
          amount,
          days,
          expires_at
        FROM comprovantes
        ORDER BY criado_em DESC
      `;

      return res.status(200).json({
        success: true,
        comprovantes
      });
    }

    // APROVAR / REJEITAR
    if (req.method === "PATCH") {
      const { id, status } = req.body || {};

      if (!id || !["aprovado", "rejeitado"].includes(status)) {
        return res.status(400).json({
          success: false,
          error: "Dados inválidos"
        });
      }

      if (status === "rejeitado") {
        const result = await sql`
          UPDATE comprovantes
          SET status = 'rejeitado'
          WHERE id = ${id}
          RETURNING id, nome, codigo, status
        `;

        return res.status(200).json({
          success: true,
          comprovante: result[0]
        });
      }

      const atual = await sql`
        SELECT id, days
        FROM comprovantes
        WHERE id = ${id}
        LIMIT 1
      `;

      if (!atual.length) {
        return res.status(404).json({
          success: false,
          error: "Comprovante não encontrado"
        });
      }

      const days = Number(atual[0].days);

      if (![1, 7, 30].includes(days)) {
        return res.status(400).json({
          success: false,
          error: "Período inválido."
        });
      }

      const result = await sql`
        UPDATE comprovantes
        SET
          status = 'aprovado',
          expires_at = NOW() + (${days} * INTERVAL '1 day')
        WHERE id = ${id}
        RETURNING id, nome, codigo, status, expires_at
      `;

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
    console.error("ADMIN ERROR:", error);

    return res.status(500).json({
      success: false,
      error: "Erro interno"
    });
  }
}
