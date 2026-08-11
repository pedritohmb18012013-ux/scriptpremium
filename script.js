/*
  VERSÃO INICIAL.
  Os códigos ainda serão colocados em um backend seguro da Vercel.
  NÃO coloque códigos reais aqui, pois este arquivo ficará no GitHub.
*/
const PLATFORM_URL = "https://plataformdestroyer.fun";

function openAccess(){document.getElementById("modal").classList.remove("hidden");document.getElementById("code").focus()}
function closeAccess(){document.getElementById("modal").classList.add("hidden");document.getElementById("message").innerHTML=""}

/*
  Por enquanto o formulário está preparado.
  Na próxima etapa vamos trocar esta função por uma consulta
  ao backend, onde os códigos mensais ficarão protegidos.
*/
function validateCode(){
  const msg=document.getElementById("message");
  msg.innerHTML='<div class="error">Sistema de códigos será conectado na próxima etapa.</div>';
}
