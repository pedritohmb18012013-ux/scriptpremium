/*
  VERSÃO INICIAL.
  Os códigos ainda serão colocados em um backend seguro da Vercel.
  NÃO coloque códigos reais aqui, pois este arquivo ficará no GitHub.
*/
const PLATFORM_URL = "https://platformdestroyer.fun";

function openAccess(){document.getElementById("modal").classList.remove("hidden");document.getElementById("code").focus()}
function closeAccess(){document.getElementById("modal").classList.add("hidden");document.getElementById("message").innerHTML=""}

/*
  Por enquanto o formulário está preparado.
  Na próxima etapa vamos trocar esta função por uma consulta
  ao backend, onde os códigos mensais ficarão protegidos.
*/
async function validateCode(){
  const msg = document.getElementById("message");
  const code = document.getElementById("code").value.trim();

  if (!code) {
    msg.innerHTML = '<div class="error">Digite o código de acesso.</div>';
    return;
  }

  msg.innerHTML = '<div>Verificando...</div>';

  try {
    const response = await fetch("https://scriptpremium.vercel.app/api/validate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ code })
    });

    const data = await response.json();

    if (data.valid) {
      msg.innerHTML = `
        <div class="success">
          Código válido! Acesso liberado até ${data.expires}.
        </div>
      `;

      window.location.href = PLATFORM_URL;
    } else {
      msg.innerHTML = `
        <div class="error">${data.error || "Código inválido."}</div>
      `;
    }
  } catch (error) {
    msg.innerHTML = `
      <div class="error">
        Não foi possível conectar ao servidor.
      </div>
    `;
  }
}
