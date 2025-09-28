/* admin.js - Gerir perguntas e persistir em localStorage (pt) */

const CHAVE_PERGUNTAS = "qm_perguntas_v1";

/* ---------- array local (fallback) ---------- */
let perguntas = [
  { id: 1, 
    texto: "Qual a capital de Angola?", 
    opcoes: ["Luanda","Benguela","Lubango","Cabinda"], 
    resposta: 0 
  },

  { id: 2, 
    texto: "Quem criou o JavaScript?", 
    opcoes: ["Brendan Eich","Bill Gates","Dennis Ritchie","Bjarne Stroustrup"], 
    resposta: 0 
  }
];

/* ---------- seletores ---------- */
const listaPerguntas = document.getElementById("lista-perguntas");
const btnAdicionar = document.getElementById("btn-adicionar");
const btnExportar = document.getElementById("btn-exportar");
const inputImport = document.getElementById("input-import"); // se adicionares input no HTML
// Modal e campos do formulário
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modal-title");
const form = document.getElementById("form-pergunta");
const btnCancelar = document.getElementById("btn-cancelar");
const textoInput = document.getElementById("texto");
const opcao1 = document.getElementById("opcao1");
const opcao2 = document.getElementById("opcao2");
const opcao3 = document.getElementById("opcao3");
const opcao4 = document.getElementById("opcao4");
const respostaInput = document.getElementById("resposta");

let editIndex = null;

/* ---------- util: escape para evitar XSS ao inserir texto no DOM ---------- */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ---------- carregar do localStorage (se houver) ---------- */
function carregarPerguntasDoStorage() {
  const raw = localStorage.getItem(CHAVE_PERGUNTAS);
  if (!raw) return; // usa array local se não houver
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) perguntas = arr;
  } catch (e) {
    console.error("Erro ao ler perguntas do storage:", e);
  }
}

/* ---------- salvar no localStorage ---------- */
function salvarPerguntasNoStorage() {
  try {
    localStorage.setItem(CHAVE_PERGUNTAS, JSON.stringify(perguntas));
  } catch (e) {
    console.error("Erro ao salvar perguntas:", e);
  }
}

/* ---------- renderizar lista com botões Editar/Remover por item ---------- */
function renderizarPerguntas() {
  listaPerguntas.innerHTML = "";
  if (perguntas.length === 0) {
    listaPerguntas.innerHTML = "<div class='pergunta-item'>Nenhuma pergunta encontrada.</div>";
    return;
  }

  perguntas.forEach((p, i) => {
    const item = document.createElement("div");
    item.className = "pergunta-item";

    // texto e opcoes
    const opcoesHtml = p.opcoes.map(o => `<span class="opcao-chip">${escapeHtml(o)}</span>`).join(" ");
    item.innerHTML = `
      <div class="pergunta-texto"><strong>${i+1}. ${escapeHtml(p.texto)}</strong></div>
      <div class="pergunta-opcoes">${opcoesHtml}</div>
      <div class="acoes-item">
        <button class="btn-pequeno editar" data-idx="${i}">Editar</button>
        <button class="btn-pequeno remover" data-idx="${i}">Remover</button>
      </div>
    `;
    listaPerguntas.appendChild(item);
  });

  // ligar eventos Editar/Remover
  listaPerguntas.querySelectorAll(".editar").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const idx = Number(e.currentTarget.dataset.idx);
      abrirModal("editar", idx);
    });
  });
  listaPerguntas.querySelectorAll(".remover").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const idx = Number(e.currentTarget.dataset.idx);
      removerPergunta(idx);
    });
  });
}

/* ---------- abrir modal (adicionar/editar) ---------- */
function abrirModal(modo, index = null) {
  modal.style.display = "flex";
  if (modo === "adicionar") {
    modalTitle.textContent = "Adicionar Pergunta";
    form.reset();
    editIndex = null;
  } else {
    modalTitle.textContent = "Editar Pergunta";
    const p = perguntas[index];
    if (!p) return;
    textoInput.value = p.texto;
    opcao1.value = p.opcoes[0] || "";
    opcao2.value = p.opcoes[1] || "";
    opcao3.value = p.opcoes[2] || "";
    opcao4.value = p.opcoes[3] || "";
    respostaInput.value = (typeof p.resposta === "number") ? String(p.resposta) : "0";
    editIndex = index;
  }
}

/* ---------- fechar modal ---------- */
function fecharModal() {
  modal.style.display = "none";
}

/* ---------- salvar (adicionar ou editar) ---------- */
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const novo = {
    id: editIndex === null ? (perguntas.length > 0 ? Math.max(...perguntas.map(p => p.id)) + 1 : 1) : perguntas[editIndex].id,
    texto: textoInput.value.trim(),
    opcoes: [
      opcao1.value.trim(),
      opcao2.value.trim(),
      opcao3.value.trim(),
      opcao4.value.trim()
    ],
    resposta: parseInt(respostaInput.value, 10)
  };

  // validação simples
  if (!novo.texto || novo.opcoes.some(o => !o) || isNaN(novo.resposta)) {
    alert("Preencha todos os campos corretamente.");
    return;
  }

  if (editIndex === null) {
    perguntas.push(novo);
  } else {
    perguntas[editIndex] = novo;
  }

  salvarPerguntasNoStorage();
  renderizarPerguntas();
  fecharModal();
});

/* ---------- remover pergunta ---------- */
function removerPergunta(index) {
  if (!confirm("Tem certeza que deseja remover esta pergunta?")) return;
  perguntas.splice(index, 1);
  salvarPerguntasNoStorage();
  renderizarPerguntas();
}

/* ---------- exportar perguntas para ficheiro JSON ---------- */
function exportarPerguntas() {
  const data = JSON.stringify(perguntas, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "perguntas.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ---------- importar perguntas a partir de ficheiro JSON ---------- */
function importarPerguntas(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const arr = JSON.parse(reader.result);
      if (!Array.isArray(arr)) throw new Error("Formato inválido");
      // valida cada item minimamente
      const validos = arr.filter(item =>
        item && typeof item.texto === "string" && Array.isArray(item.opcoes) && typeof item.resposta === "number"
      );
      if (validos.length === 0) throw new Error("Nenhuma pergunta válida encontrada");
      // atribui ids se faltarem
      validos.forEach((v, i) => { if (!v.id) v.id = i + 1; });
      perguntas = validos;
      salvarPerguntasNoStorage();
      renderizarPerguntas();
      alert("Importação concluída.");
    } catch (err) {
      alert("Erro ao importar: " + err.message);
    }
  };
  reader.readAsText(file);
}

/* ---------- eventos dos botões principais ---------- */
btnAdicionar && btnAdicionar.addEventListener("click", () => abrirModal("adicionar"));

// exportar/import input
btnExportar && btnExportar.addEventListener("click", exportarPerguntas);
inputImport && inputImport.addEventListener("change", (e) => {
  const f = e.target.files[0];
  if (f) importarPerguntas(f);
});

/* ---------- inicialização ---------- */
carregarPerguntasDoStorage();
renderizarPerguntas();

/* ---------- opcional: quando outra aba/página alterar storage -> atualizar automaticamente (estará no jogo também) ---------- */
window.addEventListener("storage", (e) => {
  if (e.key === CHAVE_PERGUNTAS) {
    carregarPerguntasDoStorage();
    renderizarPerguntas();
  }
});
