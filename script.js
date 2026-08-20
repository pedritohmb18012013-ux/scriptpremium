const PLATFORM_URL = "https://platformdestroyer.fun";

let selectedAmount = null;
let selectedDays = null;
let requestId = null;
let statusTimer = null;

function openAccess() {
  document.getElementById("modal").classList.remove("hidden");
}

function closeAccess() {
  document.getElementById("modal").classList.add("hidden");

  if (statusTimer) {
    clearInterval(statusTimer);
    statusTimer = null;
  }

  const paymentArea = document.getElementById("paymentArea");
  const message = document.getElementById("message");
  const receipt = document.getElementById("receipt");
  const fileName = document.getElementById("fileName");
  const sendButton = document.getElementById("sendReceipt");

  paymentArea.classList.add("hidden");
  message.innerHTML = "";
  fileName.innerHTML = "";

  if (receipt) receipt.value = "";
  if (sendButton) sendButton.disabled = true;

  selectedAmount = null;
  selectedDays = null;
  requestId = null;
}

function selectPlan(amount, days) {
  selectedAmount = amount;
  selectedDays = days;

  document.getElementById("paymentArea").classList.remove("hidden");

  document.getElementById("selectedPlan").innerHTML =
    `Você escolheu <strong>R$ ${amount.toFixed(2).replace(".", ",")}</strong> por <strong>${days} dia${days > 1 ? "s" : ""}</strong>.`;

  document.getElementById("message").innerHTML = "";

  document.getElementById("paymentArea").scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}

async function copyPix() {
  const pix = "57593231801";

  try {
    await navigator.clipboard.writeText(pix);

    document.getElementById("message").innerHTML =
      '<div class="success">Chave Pix copiada!</div>';

  } catch {
    document.getElementById("message").innerHTML =
      '<div class="error">Não foi possível copiar. Copie a chave manualmente.</div>';
  }
}

function receiptSelected() {
  const input = document.getElementById("receipt");
  const fileName = document.getElementById("fileName");
  const sendButton = document.getElementById("sendReceipt");

  if (!input.files || !input.files[0]) {
    sendButton.disabled = true;
    fileName.innerHTML = "";
    return;
  }

  const file = input.files[0];

  if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
    sendButton.disabled = true;
    fileName.innerHTML =
      '<div class="error">Selecione uma imagem ou PDF.</div>';
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    sendButton.disabled = true;
    fileName.innerHTML =
      '<div class="error">O arquivo deve ter no máximo 2 MB.</div>';
    return;
  }

  fileName.innerHTML =
    `<div class="success">Comprovante selecionado: ${file.name}</div>`;

  sendButton.disabled = false;
}

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () =>
      reject(new Error("Não foi possível ler o arquivo."));

    reader.readAsDataURL(file);
  });
}

async function sendReceipt() {
  const input = document.getElementById("receipt");
  const msg = document.getElementById("message");
  const sendButton = document.getElementById("sendReceipt");

  if (!selectedAmount || !selectedDays) {
    msg.innerHTML =
      '<div class="error">Escolha um plano primeiro.</div>';
    return;
  }

  if (!input.files || !input.files[0]) {
    msg.innerHTML =
      '<div class="error">Selecione o comprovante.</div>';
    return;
  }

  const file = input.files[0];

  if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
    msg.innerHTML =
      '<div class="error">Selecione uma imagem ou PDF.</div>';
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    msg.innerHTML =
      '<div class="error">O arquivo deve ter no máximo 2 MB.</div>';
    return;
  }

  sendButton.disabled = true;
  msg.innerHTML = "<div>Enviando comprovante...</div>";

  try {
    const proof = await fileToDataURL(file);

    const response = await fetch("/api/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: "Cliente",
        code: `PIX-${Date.now()}`,
        proof: proof
      })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      msg.innerHTML =
        `<div class="error">${data.error || "Não foi possível enviar o comprovante."}</div>`;

      sendButton.disabled = false;
      return;
    }

    requestId = data.comprovante.id;

    msg.innerHTML = `
      <div class="success">
        Comprovante enviado com sucesso!<br>
        Aguarde a aprovação...
      </div>
    `;

    verificarAprovacao();

  } catch (error) {
    console.error(error);

    msg.innerHTML =
      '<div class="error">Erro ao enviar o comprovante.</div>';

    sendButton.disabled = false;
  }
}

function verificarAprovacao() {
  if (!requestId) return;

  if (statusTimer) {
    clearInterval(statusTimer);
  }

  statusTimer = setInterval(async () => {
    try {
      const response = await fetch(
        `/api/status?id=${encodeURIComponent(requestId)}`
      );

      const data = await response.json();

      if (data.status === "aprovado") {
        clearInterval(statusTimer);
        statusTimer = null;

        document.getElementById("message").innerHTML = `
          <div class="success">
            Pagamento aprovado!<br>
            Liberando acesso...
          </div>
        `;

        setTimeout(() => {
          window.location.href = PLATFORM_URL;
        }, 1000);
      }

      if (data.status === "rejeitado") {
        clearInterval(statusTimer);
        statusTimer = null;

        document.getElementById("message").innerHTML = `
          <div class="error">
            O comprovante foi rejeitado.
          </div>
        `;

        document.getElementById("sendReceipt").disabled = false;
      }

    } catch (error) {
      console.error("Erro ao verificar aprovação:", error);
    }
  }, 3000);
}
