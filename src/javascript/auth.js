// =====================================================
// LOGIN – versão simples, só no navegador (para estudo/demonstração)
// Os dados ficam no localStorage; NÃO é segurança de verdade.
// =====================================================

const CHAVE_USUARIOS = "kanban-usuarios";
const CHAVE_SESSAO = "kanban-sessao";
const PAGINA_KANBAN = "/index.html";

// Se já estiver logado, vai direto para o kanban
if (localStorage.getItem(CHAVE_SESSAO)) {
  location.replace(PAGINA_KANBAN);
}

const form = document.getElementById("form-login");
const abaEntrar = document.getElementById("aba-entrar");
const abaCriar = document.getElementById("aba-criar");
const campoNome = document.getElementById("campo-nome");
const botao = document.getElementById("botao-enviar");
const mensagem = document.getElementById("mensagem");

let modo = "entrar"; // "entrar" ou "criar"

function trocarModo(novo) {
  modo = novo;
  const criar = novo === "criar";
  abaEntrar.classList.toggle("ativa", !criar);
  abaCriar.classList.toggle("ativa", criar);
  campoNome.hidden = !criar;
  botao.textContent = criar ? "Criar conta" : "Entrar";
  form.senha.autocomplete = criar ? "new-password" : "current-password";
  avisar("");
}
abaEntrar.onclick = () => trocarModo("entrar");
abaCriar.onclick = () => trocarModo("criar");

function avisar(texto, ok = false) {
  mensagem.textContent = texto;
  mensagem.classList.toggle("ok", ok);
}

function lerUsuarios() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_USUARIOS)) || {};
  } catch {
    return {};
  }
}

// transforma a senha em um código (hash) para não guardá-la em texto puro
async function gerarHash(texto) {
  const bytes = new TextEncoder().encode(texto);
  const resultado = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(resultado)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  avisar("");

  const email = form.email.value.trim().toLowerCase();
  const senha = form.senha.value;
  const nome = form.nome.value.trim();

  if (!/^\S+@\S+\.\S+$/.test(email)) return avisar("Digite um e-mail válido.");
  if (senha.length < 6)
    return avisar("A senha precisa ter pelo menos 6 caracteres.");

  botao.disabled = true;
  try {
    const usuarios = lerUsuarios();
    const hash = await gerarHash(senha);

    if (modo === "criar") {
      if (usuarios[email])
        return avisar("Já existe uma conta com esse e-mail.");
      usuarios[email] = { nome: nome || email.split("@")[0], senha: hash };
      localStorage.setItem(CHAVE_USUARIOS, JSON.stringify(usuarios));
    } else {
      if (!usuarios[email] || usuarios[email].senha !== hash) {
        return avisar("E-mail ou senha incorretos.");
      }
    }

    localStorage.setItem(CHAVE_SESSAO, email);
    location.replace(PAGINA_KANBAN);
  } catch {
    avisar(
      "Não foi possível entrar. Abra o site por um servidor local (ex.: Live Server).",
    );
  } finally {
    botao.disabled = false;
  }
});
