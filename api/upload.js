import { neon } from "@neondatabase/serverless";
import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Método não permitido"
    });
  }

  try {
    const { name, code, proof, amount, days } = req.body || {};

    if (!name || !code || !proof) {
      return res.status(400).json({
        success: false,
        error: "Dados incompletos"
      });
    }

    const sql = neon(process.env.DATABASE_URL);

    const accessToken = crypto.randomBytes(32).toString("hex");

    const valor = Number(amount) || 0;
    const periodo = Number(days) || 0;

    const result = await sql`
      INSERT INTO comprovantes
        (
          nome,
          codigo,
          comprovante_url,
          status,
          amount,
          days,
          access_token
        )
      VALUES
        (
          ${name},
          ${code},
          ${proof},
          'pendente',
          ${valor},
          ${periodo},
          ${accessToken}
        )
      RETURNING
        id,
        nome,
        codigo,
        status,
        criado_em,
        access_token
    `;

    return res.status(200).json({
      success: true,
      message: "Comprovante registrado",
      comprovante: result[0]
    });

  } catch (error) {
    console.error("UPLOAD ERROR:", error);

    return res.status(500).json({
      success: false,
      error: "Erro ao salvar comprovante"
    });
  }
}
