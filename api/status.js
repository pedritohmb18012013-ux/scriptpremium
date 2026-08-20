import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Método não permitido"
    });
  }

  const id = req.query.id;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: "ID não informado"
    });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

    const result = await sql`
      SELECT id, status
      FROM comprovantes
      WHERE id = ${id}
      LIMIT 1
    `;

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Comprovante não encontrado"
      });
    }

    return res.status(200).json({
      success: true,
      id: result[0].id,
      status: result[0].status
    });

  } catch (error) {
    console.error("STATUS ERROR:", error);

    return res.status(500).json({
      success: false,
      error: "Erro ao consultar o comprovante"
    });
  }
}
