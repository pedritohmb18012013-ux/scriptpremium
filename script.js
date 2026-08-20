const PLATFORM_URL = "https://platformdestroyer.fun";

let selectedAmount = null;
let selectedDays = null;

function openAccess() {
  document.getElementById("modal").classList.remove("hidden");
}

function closeAccess() {
  document.getElementById("modal").classList.add("hidden");

  const paymentArea = document.getElementById("paymentArea");
  const message = document.getElementById("message");

  paymentArea.classList.add("hidden");
  message.innerHTML = "";

  selectedAmount = null;
  selectedDays = null;
}

function selectPlan(amount, days) {
  selectedAmount = amount;
  selectedDays = days;

  const paymentArea = document.getElementById("paymentArea");
  const selectedPlan = document.getElementById("selectedPlan");

  paymentArea.classList.remove("hidden");

  selectedPlan.innerHTML =
    `Você escolheu <strong>R$ ${amount.toFixed(2).replace(".", ",")}</strong> 
     por <strong>${days} dia${days > 1 ? "s" : ""}</strong>.`;

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
  } catch (error) {
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

  if (!file.type.startsWith("image/")) {
    sendButton.disabled = true;
    fileName.innerHTML =
      '<div class="error">Selecione uma imagem.</div>';
    return;
  }

  fileName.innerHTML =
    `<div class="success">Comprovante selecionado: ${file.name}</div>`;

  sendButton.disabled = false;
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

  sendButton.disabled = true;

  msg.innerHTML =
    '<div>Enviando comprovante...</div>';

  try {
    const formData = new FormData();

    formData.append("receipt", file);
    formData.append("amount", selectedAmount);
    formData.append("days", selectedDays);

    const response = await fetch(
      "https://scriptpremium.vercel.app/api/validate",
      {
        method: "POST",
        body: formData
      }
    );

    const data = await response.json();

    if (data.valid) {
      msg.innerHTML = `
        <div class="success">
          Pagamento confirmado!<br>
          Acesso liberado até ${data.expires}.
        </div>
      `;

      setTimeout(() => {
        window.location.href = PLATFORM_URL;
      }, 1500);

    } else {
      msg.innerHTML = `
        <div class="error">
          ${data.error || "Pagamento não confirmado."}
        </div>
      `;

      sendButton.disabled = false;
    }

  } catch (error) {

    msg
