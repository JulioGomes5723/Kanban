// =====================================================
// KANBAN – adicionar, editar, apagar, comentar e arrastar
// =====================================================

const USUARIO = localStorage.getItem("kanban-sessao") || "";
const CHAVE = "kanban-v1-" + USUARIO; // mude para "kanban-v2" se quiser descartar os dados salvos
const AVATAR = document.querySelector(".user img")?.getAttribute("src") || "";

// ---------- Salvar / carregar (localStorage) ----------
function salvar() {
  const dados = {};
  document.querySelectorAll(".kanban-column").forEach((col) => {
    const clone = col.querySelector(".kanban-cards").cloneNode(true);

    // limpa estados temporários antes de salvar
    clone.classList.remove("cards-hover");
    clone
      .querySelectorAll(".dragging")
      .forEach((c) => c.classList.remove("dragging"));
    clone
      .querySelectorAll(".editando")
      .forEach((c) => c.classList.remove("editando"));
    clone
      .querySelectorAll("[contenteditable]")
      .forEach((e) => e.removeAttribute("contenteditable"));
    clone
      .querySelectorAll(".btn-edit i")
      .forEach((i) => (i.className = "fa-solid fa-pen"));
    clone.querySelectorAll(".kanban-card").forEach((c) => (c.draggable = true));

    dados[col.dataset.id] = clone.innerHTML;
  });
  try {
    localStorage.setItem(CHAVE, JSON.stringify(dados));
  } catch {}
}

function carregar() {
  let dados = null;
  try {
    dados = JSON.parse(localStorage.getItem(CHAVE));
  } catch {}
  if (!dados) return;
  document.querySelectorAll(".kanban-column").forEach((col) => {
    if (dados[col.dataset.id] !== undefined) {
      col.querySelector(".kanban-cards").innerHTML = dados[col.dataset.id];
    }
  });
}

// ---------- Montagem dos cards ----------
function criarCard(texto) {
  const card = document.createElement("div");
  card.className = "kanban-card";
  card.innerHTML = `
    <p class="card-title"></p>
    <div class="card-infos">
      <div class="card-icons">
        <p><i class="fa-regular fa-comment"></i> 0</p>
        <p><i class="fa-solid fa-paperclip"></i> 0</p>
      </div>
      ${AVATAR ? `<div class="user"><img src="${AVATAR}" alt="avatar" /></div>` : ""}
    </div>`;
  card.querySelector(".card-title").textContent = texto;
  prepararCard(card);
  return card;
}

// Deixa qualquer card (novo ou já existente no HTML) com os botões e a caixa de comentários.
// Pode ser chamada várias vezes: só adiciona o que estiver faltando.
function prepararCard(card) {
  card.draggable = true;

  // ícone de comentário vira um botão com contador
  const pComentario = card.querySelector(".fa-comment")?.closest("p");
  if (pComentario && !pComentario.classList.contains("btn-comments")) {
    pComentario.classList.add("btn-comments");
    pComentario.title = "Comentários";
    [...pComentario.childNodes].forEach((n) => {
      if (n.nodeType === Node.TEXT_NODE) n.remove();
    });
    const contador = document.createElement("span");
    contador.className = "comment-count";
    pComentario.append(" ", contador);
  }

  // botões de editar e apagar
  if (!card.querySelector(".card-actions")) {
    const acoes = document.createElement("div");
    acoes.className = "card-actions";
    acoes.innerHTML = `
      <button type="button" class="btn-edit" title="Editar"><i class="fa-solid fa-pen"></i></button>
      <button type="button" class="btn-delete" title="Apagar"><i class="fa-solid fa-trash"></i></button>`;
    card.append(acoes);
  }

  // caixa de comentários
  if (!card.querySelector(".card-comments")) {
    const caixa = document.createElement("div");
    caixa.className = "card-comments";
    caixa.hidden = true;
    caixa.innerHTML = `
      <ul class="comment-list"></ul>
      <form class="comment-form">
        <input type="text" placeholder="Escreva um comentário..." maxlength="200" />
        <button type="submit" title="Enviar"><i class="fa-solid fa-paper-plane"></i></button>
      </form>`;
    card.append(caixa);
  }

  atualizarContador(card);
}

function atualizarContador(card) {
  const total = card.querySelectorAll(".comment-list li").length;
  const contador = card.querySelector(".comment-count");
  if (contador) contador.textContent = total;
}

// ---------- Edição do texto (parágrafo .card-title) ----------
function iniciarEdicao(card) {
  const titulo = card.querySelector(".card-title");
  titulo.dataset.original = titulo.textContent;
  titulo.contentEditable = "true";
  card.draggable = false; // não deixa arrastar enquanto edita
  card.classList.add("editando");
  card.querySelector(".btn-edit i").className = "fa-solid fa-check";

  titulo.focus();
  const selecao = window.getSelection();
  const faixa = document.createRange();
  faixa.selectNodeContents(titulo);
  selecao.removeAllRanges();
  selecao.addRange(faixa);
}

function finalizarEdicao(card, confirmar = true) {
  if (!card.classList.contains("editando")) return;
  card.classList.remove("editando");

  const titulo = card.querySelector(".card-title");
  const novo = titulo.textContent.trim();
  titulo.textContent = confirmar && novo ? novo : titulo.dataset.original; // vazio = volta ao texto anterior
  titulo.removeAttribute("contenteditable");
  delete titulo.dataset.original;

  card.draggable = true;
  card.querySelector(".btn-edit i").className = "fa-solid fa-pen";
  salvar();
}

// ---------- Cliques (delegação: funciona também em cards criados depois) ----------
// evita que o botão roube o foco do texto e dispare o "blur" antes do clique
document.addEventListener("mousedown", (e) => {
  if (e.target.closest(".card-actions")) e.preventDefault();
});

document.addEventListener("click", (e) => {
  // + adicionar card
  const botaoAdd = e.target.closest(".add-card");
  if (botaoAdd) {
    const lista = botaoAdd
      .closest(".kanban-column")
      .querySelector(".kanban-cards");
    const card = criarCard("Novo card");
    lista.append(card);
    iniciarEdicao(card);
    return;
  }

  const card = e.target.closest(".kanban-card");
  if (!card) return;

  // editar / salvar edição
  if (e.target.closest(".btn-edit")) {
    card.classList.contains("editando")
      ? finalizarEdicao(card)
      : iniciarEdicao(card);
    return;
  }

  // apagar card
  if (e.target.closest(".btn-delete")) {
    if (confirm("Apagar este card?")) {
      card.remove();
      salvar();
    }
    return;
  }

  // abrir/fechar comentários
  if (e.target.closest(".btn-comments")) {
    const caixa = card.querySelector(".card-comments");
    caixa.hidden = !caixa.hidden;
    if (!caixa.hidden) caixa.querySelector("input").focus();
    salvar();
    return;
  }

  // apagar um comentário
  if (e.target.closest(".btn-del-comment")) {
    e.target.closest("li").remove();
    atualizarContador(card);
    salvar();
  }
});

// duplo clique no texto também edita
document.addEventListener("dblclick", (e) => {
  const titulo = e.target.closest(".card-title");
  if (!titulo) return;
  const card = titulo.closest(".kanban-card");
  if (!card.classList.contains("editando")) iniciarEdicao(card);
});

// Enter salva, Esc cancela
document.addEventListener("keydown", (e) => {
  const titulo = e.target.closest?.(".card-title[contenteditable]");
  if (!titulo) return;
  const card = titulo.closest(".kanban-card");
  if (e.key === "Enter") {
    e.preventDefault();
    finalizarEdicao(card, true);
  } else if (e.key === "Escape") {
    finalizarEdicao(card, false);
  }
});

// clicar fora do texto também salva
document.addEventListener("focusout", (e) => {
  if (e.target.matches?.(".card-title[contenteditable]")) {
    finalizarEdicao(e.target.closest(".kanban-card"), true);
  }
});

// ---------- Adicionar comentário ----------
document.addEventListener("submit", (e) => {
  const form = e.target.closest(".comment-form");
  if (!form) return;
  e.preventDefault();

  const input = form.querySelector("input");
  const texto = input.value.trim();
  if (!texto) return;

  const item = document.createElement("li");
  const span = document.createElement("span");
  span.textContent = texto;
  const apagar = document.createElement("button");
  apagar.type = "button";
  apagar.className = "btn-del-comment";
  apagar.title = "Apagar comentário";
  apagar.innerHTML = '<i class="fa-solid fa-xmark"></i>';
  item.append(span, apagar);

  const card = form.closest(".kanban-card");
  card.querySelector(".comment-list").append(item);
  input.value = "";
  atualizarContador(card);
  salvar();
});

// não deixa o card ser arrastado enquanto você digita um comentário
document.addEventListener("focusin", (e) => {
  if (e.target.matches?.(".comment-form input"))
    e.target.closest(".kanban-card").draggable = false;
});
document.addEventListener("focusout", (e) => {
  if (e.target.matches?.(".comment-form input")) {
    const card = e.target.closest(".kanban-card");
    if (!card.classList.contains("editando")) card.draggable = true;
  }
});

// ---------- Arrastar e soltar ----------
document.addEventListener("dragstart", (e) => {
  const card = e.target.closest?.(".kanban-card");
  if (!card) return;
  card.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", ""); // necessário para funcionar no Firefox
});

document.addEventListener("dragend", (e) => {
  const card = e.target.closest?.(".kanban-card");
  if (!card) return;
  card.classList.remove("dragging");
  salvar();
});

document.querySelectorAll(".kanban-cards").forEach((coluna) => {
  coluna.addEventListener("dragover", (e) => {
    e.preventDefault(); // permite soltar
    coluna.classList.add("cards-hover");
  });

  coluna.addEventListener("dragleave", (e) => {
    if (!coluna.contains(e.relatedTarget))
      coluna.classList.remove("cards-hover");
  });

  coluna.addEventListener("drop", (e) => {
    e.preventDefault();
    coluna.classList.remove("cards-hover");

    const arrastado = document.querySelector(".kanban-card.dragging");
    if (!arrastado) return;

    // descobre antes de qual card ele foi solto (pela posição do mouse)
    const depois = [
      ...coluna.querySelectorAll(".kanban-card:not(.dragging)"),
    ].find((c) => {
      const r = c.getBoundingClientRect();
      return e.clientY < r.top + r.height / 2;
    });

    coluna.insertBefore(arrastado, depois || null);
    salvar();
  });
});

// ---------- Início ----------
carregar();
document.querySelectorAll(".kanban-card").forEach(prepararCard);
document.getElementById("btn-sair")?.addEventListener("click", () => {
  localStorage.removeItem("kanban-sessao");
  location.replace("/login.html");
});
