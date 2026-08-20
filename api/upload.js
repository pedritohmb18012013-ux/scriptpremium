import { sql } from "@vercel/postgres";

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

    const result = await sql`
      INSERT INTO comprovantes
        (nome, codigo, comprovante_url, status)
      VALUES
        (${name}, ${code}, ${proof}, 'pendente')
      RETURNING id, nome, codigo, status, criado_em;
    `;

    return res.status(200).json({
      success: true,
      message: "Comprovante registrado",
      comprovante: result.rows[0]
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      error: "Erro ao salvar comprovante"
    });
  }
}
