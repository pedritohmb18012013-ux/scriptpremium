import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Método não permitido"
    });
  }

  const adminKey = req.headers["x-admin-key"];

  if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({
      success: false,
      error: "Não autorizado"
    });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

    const comprovantes = await sql`
      SELECT id, nome, codigo, comprovante_url, status, criado_em
      FROM comprovantes
      ORDER BY criado_em DESC
    `;

    return res.status(200).json({
      success: true,
      comprovantes
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      error: "Erro ao consultar comprovantes"
    });
  }
}
