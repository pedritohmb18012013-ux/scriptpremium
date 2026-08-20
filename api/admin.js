function mostrarComprovante(url) {
  if (!url) {
    return "<p>Nenhum comprovante enviado.</p>";
  }

  if (typeof url === "string" && url.startsWith("data:image/")) {
    return `
      <div class="comprovante">
        <strong>Comprovante:</strong>
        <br><br>

        <img
          src="${url}"
          alt="Comprovante de pagamento"
          style="
            display:block;
            width:100%;
            max-width:500px;
            max-height:600px;
            object-fit:contain;
            border-radius:10px;
            background:#000;
          "
        >
      </div>
    `;
  }

  if (
    typeof url === "string" &&
    url.startsWith("data:application/pdf")
  ) {
    return `
      <div class="comprovante">
        <strong>Comprovante PDF:</strong>
        <br><br>

        <a
          href="${url}"
          target="_blank"
          rel="noopener noreferrer"
        >
          📄 Abrir comprovante PDF
        </a>
      </div>
    `;
  }

  return `
    <div class="comprovante">
      <strong>Comprovante:</strong>
      <p>Formato não reconhecido.</p>
    </div>
  `;
}
