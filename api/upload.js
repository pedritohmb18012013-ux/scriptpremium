import { neon } from "@neondatabase/serverless";

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

    // Verifica se realmente recebemos um arquivo em Base64
    if (
      typeof proof !== "string" ||
      !proof.startsWith("data:")
    ) {
      return res.status(400).json({
        success: false,
        error: "Comprovante inválido"
      });
    }

    // Limite de aproximadamente 2 MB
    if (proof.length > 3_000_000) {
      return res.status(400).json({
        success: false,
        error: "Comprovante muito grande"
      });
    }

    const sql = neon(process.env.DATABASE_URL);

    const result = await sql`
      INSERT INTO comprovantes
        (nome, codigo, comprovante_url, status)
      VALUES
        (${name}, ${code}, ${proof}, 'pendente')
      RETURNING id, nome, codigo, comprovante_url, status, criado_em
    `;

    return res.status(200).json({
      success: true,
      message: "Comprovante registrado",
      comprovante: result[0]
    });

  } catch (error) {
    console.error("Erro no upload:", error);

    return res.status(500).json({
      success: false,
      error: "Erro ao salvar comprovante"
    });
  }
}
