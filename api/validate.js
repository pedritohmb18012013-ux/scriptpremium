import Busboy from "busboy";

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

    if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
      invalidFile = true;
      file.resume();
      return;
    }

    file.on("limit", () => {
      fileTooLarge = true;
    });

    // Etapa 1:
    // Não armazenamos nem analisamos o comprovante aqui.
    // Apenas consumimos o arquivo para concluir a requisição.
    file.on("data", () => {});
  });

  busboy.on("finish", () => {
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

    if (!fileReceived) {
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

    /*
      IMPORTANTE:

      Neste momento NÃO liberamos o acesso.

      O comprovante será considerado:
      PENDENTE DE ANÁLISE

      Na próxima etapa podemos:
      1. armazenar a imagem com segurança;
      2. registrar a solicitação;
      3. analisar o comprovante;
      4. confirmar o pagamento através do Pix;
      5. somente então liberar o período.
    */

    return res.status(202).json({
      valid: false,
      pending: true,
      amount,
      days,
      message:
        "Comprovante recebido. O pagamento está aguardando confirmação."
    });
  });

  busboy.on("error", () => {
    return res.status(500).json({
      valid: false,
      error: "Não foi possível processar o comprovante."
    });
  });

  req.pipe(busboy);
}
