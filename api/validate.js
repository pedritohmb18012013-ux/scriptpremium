import Busboy from "busboy";
import { neon } from "@neondatabase/serverless";

export const config = {
  api: {
    bodyParser: false
  }
};

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      valid: false,
      error: "Método não permitido."
    });
  }

  const contentType = req.headers["content-type"] || "";

  if (!contentType.startsWith("multipart/form-data")) {
    return res.status(400).json({
      valid: false,
      error: "Envie o comprovante como imagem."
    });
  }

  const busboy = Busboy({
    headers: req.headers,
    limits: {
      files: 1,
      fileSize: 4 * 1024 * 1024
    }
  });

  let amount = null;
  let days = null;
  let fileReceived = false;
  let fileTooLarge = false;
  let invalidFile = false;

  let fileType = "";
  let fileData = [];

  busboy.on("field", (name, value) => {
    if (name === "amount") {
      amount = Number(value);
    }

    if (name === "days") {
      days = Number(value);
    }
  });

  busboy.on("file", (name, file, info) => {
    fileReceived = true;

    const { mimeType } = info;

    if (
      ![
        "image/jpeg",
        "image/png",
        "image/webp"
      ].includes(mimeType)
    ) {
      invalidFile = true;
      file.resume();
      return;
    }

    fileType = mimeType;

    file.on("limit", () => {
      fileTooLarge = true;
    });

    file.on("data", (chunk) => {
      fileData.push(chunk);
    });
  });

  busboy.on("finish", async () => {
    try {
      if (fileTooLarge) {
        return res.status(413).json({
          valid: false,
          error: "O comprovante é muito grande. Envie uma imagem de até 4 MB."
        });
      }

      if (invalidFile) {
        return res.status(400).json({
          valid: false,
          error: "Formato inválido. Envie JPG, PNG ou WebP."
        });
      }

      if (!fileReceived || fileData.length === 0) {
        return res.status(400).json({
          valid: false,
          error: "Nenhum comprovante foi enviado."
        });
      }

      const plans = {
        1: 1,
        5: 7,
        10: 30
      };

      if (!plans[amount] || plans[amount] !== days) {
        return res.status(400).json({
          valid: false,
          error: "Plano de pagamento inválido."
        });
      }

      const buffer = Buffer.concat(fileData);

      const proof = `data:${fileType};base64,${buffer.toString("base64")}`;

      const sql = neon(process.env.DATABASE_URL);

      const codigo = `PENDENTE-${Date.now()}-${Math.floor(
        Math.random() * 10000
      )}`;

      const result = await sql`
        INSERT INTO comprovantes
          (nome, codigo, comprovante_url, status)
        VALUES
          ('Cliente', ${codigo}, ${proof}, 'pendente')
        RETURNING
          id,
          nome,
          codigo,
          status,
          criado_em
      `;

      return res.status(202).json({
        valid: false,
        pending: true,
        requestId: result[0].id,
        amount,
        days,
        message:
          "Comprovante recebido. O pagamento está aguardando confirmação."
      });

    } catch (error) {
      console.error("VALIDATE ERROR:", error);

      return res.status(500).json({
        valid: false,
        error: "Não foi possível registrar o comprovante."
      });
    }
  });

  busboy.on("error", (error) => {
    console.error("BUSBOY ERROR:", error);

    return res.status(500).json({
      valid: false,
      error: "Não foi possível processar o comprovante."
    });
  });

  req.pipe(busboy);
}
