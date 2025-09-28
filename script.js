
const somFundo = new Audio("sounds/gam-sound.mp3");
somFundo.loop = true;

const somCorreto = new Audio("sounds/correct-answer.wav");
const somErrado = new Audio("sounds/wrong-answer.mp3");

const telaIniciar = document.getElementById("tela-iniciar");
const telaLogin = document.getElementById("tela-login");
const telaJogo = document.getElementById("tela-jogo");
const telaMenu = document.getElementById("tela-menu")
const telaResultado = document.getElementById("tela-resultado");
const telaRanking = document.getElementById("tela-ranking");

const btnSair = document.getElementById("btn-sair");
const btnProximo = document.getElementById("btn-proximo");
const btnComecar = document.getElementById("btn-comecar");
const btnSalvarNome = document.getElementById("btn-salvar-nome");
const voltarBoasVindas = document.getElementById("voltar-boas-vindas");
const mudarNome = document.getElementById("mudar-nome");
const voltarBoasVindasMenu = document.getElementById("voltar-boas-vindas-menu");
const btnJogarNovamente = document.getElementById("jogar-novamente");
const btnVoltarMenu = document.getElementById("voltar-menu");

const preenchimentoProgresso = document.getElementById("preenchimento-progresso");
const exibicaoPontuacao = document.getElementById("exibicao-pontuacao");
const textoQuestao = document.getElementById("texto-questao");
const modoJogo = document.getElementById("modo-jogo");
const btnModoNormal = document.getElementById("modo-normal");
const btnModoRanking = document.getElementById("modo-ranking");
const miniRanking = document.getElementById("mini-ranking");

const containerOpcoes = document.getElementById("container-opcoes");
const nomeJogador = document.getElementById("nome-jogador");
const inputNomeUsuario = document.getElementById("input-nome-usuario");
const pontuacaoResultado = document.getElementById("pontuacao-resultado");
const listaRanking = document.getElementById("lista-ranking");
const btnLimparRanking = document.getElementById("limpar-ranking");
const btnVoltarRanking = document.getElementById("voltar-ranking");

const btnModoRanking2 = document.getElementById("modo-rankingDois");
const telaRanking2 = document.getElementById("tela-ranking2");
const listaRanking2 = document.getElementById("lista-ranking2");
const btnLimparRanking2 = document.getElementById("limpar-ranking2");
const btnVoltarRanking2 = document.getElementById("voltar-ranking2");


/* ---------- Variaveis ---------- */

let nomeUsuario = "";
let modoAtual = "";
let perguntas = [];
let listaPerguntas = [];
let pontuacaoAtual = 0;
let indiceQuestao = 0;
let permitirProximo = false;


/* ---------- Chave do Armazenamento ---------- */
const listaJogadores = "rank_Jogadores";

/* ---------- Integração com Admin ---------- */
const CHAVE_PERGUNTAS = "qm_perguntas_v1";

function carregarPerguntasAdmin() {
  const raw = localStorage.getItem(CHAVE_PERGUNTAS);
  if (!raw) return null;

  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return null;

    // converter formato admin -> formato jogo
    return arr.map(p => ({
      id: p.id,
      questao: p.texto,
      opcoes: p.opcoes,
      correto: p.resposta
    }));
  } catch (e) {
    console.error("Erro ao ler perguntas do painel:", e);
    return null;
  }
}

// Tenta carregar perguntas do painel Admin
const perguntasAdmin = carregarPerguntasAdmin();

/* ---------- Manipulação do armazenamento ---------- */
function carregarJogadores() {
    const rank = localStorage.getItem(listaJogadores);
    return rank ? JSON.parse(rank) : {};
}

function salvarJogadores(obj) {
    localStorage.setItem(listaJogadores, JSON.stringify(obj));
}


/* ---------- Alternar Telas  Inicio / Login ---------- */
function mostrarTela(t) {
    document.querySelectorAll(".tela").forEach(s => s.classList.remove("ativo"));
    t.classList.add("ativo");
}


btnComecar.addEventListener("click", () => mostrarTela(telaLogin));
voltarBoasVindas.addEventListener("click", () => mostrarTela(telaIniciar));

btnSalvarNome.addEventListener("click", () => {
    const v = inputNomeUsuario.value.trim();
    if (!v) return alert("Por favor, digite o seu nome.");
    nomeUsuario = v;
    nomeJogador.textContent = nomeUsuario;
    inputNomeUsuario.value = "";
    atualizarMiniRanking(); // atualiza a pequena visualização do ranking
    mostrarTela(telaMenu);
});

voltarBoasVindasMenu.addEventListener("click", () => {
    // "logout" rápido para boas-vindas
    nomeUsuario = "";
    nomeJogador.textContent = "—";
    mostrarTela(telaIniciar);
});

/* ---------- Ações do MENU ---------- */
btnModoNormal.addEventListener("click", () => iniciarJogo("normal"));

btnModoRanking.addEventListener("click", () => {
  renderizarRanking();
  mostrarTela(telaRanking);
});

btnModoRanking2.addEventListener("click", () => {
  renderizarRanking();
  mostrarTela(telaRanking2);
});

mudarNome && mudarNome.addEventListener("click", () => mostrarTela(telaLogin));
voltarBoasVindasMenu && voltarBoasVindasMenu.addEventListener("click", () => mostrarTela(telaIniciar));


/* ---------- Embaralhar as questoes ---------- */
function embaralharArray(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
  }

/* ---------- INICIAR JOGO ---------- */
function iniciarJogo(){
    if(!nomeUsuario) return alert("O Campo nome não pode estar vázio.");
    pontuacaoAtual = 0;
    registroRespostas = [];
    indiceQuestao = 0;
    permitirProximo = false;

    listaPerguntas = perguntasAdmin.map(q => ({...q}));

    embaralharArray(listaPerguntas);
    modoJogo.textContent = "Jogo Normal";
    atualizarPontuacao();
    renderizarQuestao();
    mostrarTela(telaJogo);
    atualizarMiniRanking(); // manter o mini ranking sincronizado
}

function renderizarQuestao() {

    permitirProximo = false;
    btnProximo.classList.add("escondido");
    const total = listaPerguntas.length;
    const restante = total - indiceQuestao;
    const q = listaPerguntas[indiceQuestao];
    if (!q) { finalizarJogo(); return; }
    
    //barra de progresso
    const porcentagemPreenchimento = Math.round(((indiceQuestao) / total) * 100);
    preenchimentoProgresso.style.width = porcentagemPreenchimento + "%";

    //mostrar pergunta
    textoQuestao.textContent = q.questao;

    //colocar aleatorio a ordem das perguntas
    const quest = q.opcoes.map((text, idx) => ({text, idx}));
    embaralharArray(quest);

    containerOpcoes.textContent = "";
    quest.forEach(op => {
        const botao = document.createElement("button");
        botao.className = "btn-opcao";
        botao.textContent = op.text;
        botao.dataset.idx = op.idx;
        botao.addEventListener("click", aoClicarResposta);
        containerOpcoes.appendChild(botao);
    });

}

/* ---------- Manipulando o som ---------- */
//iniciar o som logo que começar o jogo
function iniciarSomFundo(){
    somFundo.play().catch(erro => console.log("O Autoplay está bloqueado.", erro));
}

//parar o som
function pararSomFundo(){
    somFundo.pause();
    somFundo.currentTime = 0;
}

//tocar som da resposta
function tocarSomResposta(tipo){
    pararSomFundo();

    let som = tipo === "correto" ? somCorreto : somErrado;

    som.play().then(() => {
        som.onended = () => {
            iniciarSomFundo();
        };
    });
}

/* ---------- Manipulando as Respostas ---------- */
function aoClicarResposta(res){
    if(permitirProximo) return; //previne toques duplos
    permitirProximo = true;

    const clicado = res.currentTarget;
    const indiceEscolhido = Number(clicado.dataset.idx);
    const q = listaPerguntas[indiceQuestao];

    //manipulando resposta correta e errada
    const botoes = containerOpcoes.querySelectorAll(".btn-opcao");
    botoes.forEach(b => {
        b.disabled = true;
        const indiceOriginal = Number(b.dataset.idx);
        if(indiceOriginal === q.correto){
            b.classList.add("correto");
        }
        else if(b === clicado){
            b.classList.add("incorreto");
        }
    });

    const estaCorreto = indiceEscolhido === q.correto;
    if (estaCorreto) {
      pontuacaoAtual += 10; // +10 por acertar
      atualizarPontuacao(true);
      tocarSomResposta("correto");
    } 
    else {
      atualizarPontuacao(false);
      tocarSomResposta("errado");
    }

    // pequena pausa de 2s para próxima questão (ou fim)
    setTimeout(() => {
        indiceQuestao++;
        if (indiceQuestao < listaPerguntas.length) {
          renderizarQuestao();
        } 
        else {
          finalizarJogo();
        }
    }, 2000);

}

/* ---------- Finalizar o Jogo ---------- */
function finalizarJogo() {
    
    // atualiza os totais dos jogadores armazenados (persiste os pontos da sessão)
    const jogadores = carregarJogadores();
    if (!jogadores[nomeUsuario]) jogadores[nomeUsuario] = 0;
    jogadores[nomeUsuario] = jogadores[nomeUsuario] + pontuacaoAtual;
    salvarJogadores(jogadores);
  
    // mostra a tela de resultados
    pontuacaoResultado.textContent = `Você conseguiu ${pontuacaoAtual} pontos`;
    atualizarMiniRanking();
    mostrarTela(telaResultado);
}

/* ---------- Atualizar exibição da pontuação e mini ranking ---------- */
function atualizarPontuacao(acabouDePontuar=false) {
    exibicaoPontuacao.textContent = pontuacaoAtual;
}

function atualizarMiniRanking() {
    const jogadores = carregarJogadores();
    // calcular totais combinados para exibição (para o jogador atual adicionar pontuacaoSessao)
    const entradas = [];

    for (let nome in jogadores) entradas.push({ nome, pontuacao: jogadores[nome] });
    if (nomeUsuario && !jogadores[nomeUsuario]) entradas.push({ nome: nomeUsuario, pontuacao: 0 });
    // para exibição, adicione pontuacaoAtual ao total mostrado do usuário atual (ainda não armazenado até o fim)
    const decorado = entradas.map(e => {
      if (e.nome === nomeUsuario) return { ...e, exibir: e.pontuacao};
      return { ...e, exibir: e.pontuacao };
    });
    // ordenar descendente
    decorado.sort((a,b) => b.exibir - a.exibir);
    // visualização mini: os 2 primeiros pequenos
    const topo = decorado.slice(0,2).map(d => `${d.nome}: ${d.exibir}`).join(" • ");
    miniRanking.textContent = topo || "Sem jogadores ainda";
}

/* ---------- RENDERIZAR RANKING ---------- */
function renderizarRanking() {
  const jogadores = carregarJogadores();
  const arr = Object.keys(jogadores).map((n) => ({
    nome: n,
    pontuacao: jogadores[n],
  }));

  // Se o usuário atual ainda não estiver armazenado, inclua-o com 0
  if (nomeUsuario && !jogadores[nomeUsuario])
    arr.push({ nome: nomeUsuario, pontuacao: 0 });

  // ordenar desc
  arr.sort((a, b) => b.pontuacao - a.pontuacao);

  listaRanking.innerHTML = "";
  listaRanking2.innerHTML = "";

  if (arr.length === 0) {
    listaRanking.innerHTML =
      "<div class='suave'>Sem jogadores no ranking.</div>";
    return;
  }

  arr.forEach((p, i) => {
    const item = document.createElement("div");
    item.className = "item-ranking" + (i === 0 ? " topo" : "");
    item.innerHTML = `
        <div style="display:flex;gap:12px;align-items:center">
          <div class="pos-ranking">${i + 1}</div>
          <div>
            <div class="nome-ranking">${p.nome}</div>
            <div class="suave pequeno">${i === 0 ? "Líder" : ""}</div>
          </div>
        </div>
        <div class="pontuacao-ranking">${p.pontuacao} pts</div>
      `;
    listaRanking.appendChild(item);
  });

  
  arr.forEach((p, i) => {
    const item = document.createElement("div");
    item.className = "item-ranking" + (i === 0 ? " topo" : "");
    item.innerHTML = `
        <div style="display:flex;gap:12px;align-items:center">
          <div class="pos-ranking">${i + 1}</div>
          <div>
            <div class="nome-ranking">${p.nome}</div>
            <div class="suave pequeno">${i === 0 ? "Líder" : ""}</div>
          </div>
        </div>
        <div class="pontuacao-ranking">${p.pontuacao} pts</div>
      `;
    listaRanking2.appendChild(item);
  });
}

/* ---------- Manipulando elementos de finalização / navegação ---------- */
btnSair.addEventListener("click", () => {
    if (!confirm("Sair da partida?")) return;
    finalizarJogo();
    mostrarTela(telaMenu);
});

btnProximo.addEventListener("click", () => {
    // Botão Próximo exposto (geralmente não usado porque avançamos automaticamente após a seleção)
    if (indiceQuestao + 1 >= listaPerguntas.length){
        finalizarJogo();
    } 
    else {
      indiceQuestao++;
      renderizarQuestao();
    }
});

btnJogarNovamente.addEventListener("click", () => {
    iniciarJogo();
});

btnVoltarMenu.addEventListener("click", () => {
    atualizarMiniRanking();
    mostrarTela(telaMenu);
});
  
btnLimparRanking.addEventListener("click", () => {
    if (!confirm("Limpar ranking e histórico de pontos?")) return;
    localStorage.removeItem(listaJogadores);
    renderizarRanking();
    atualizarMiniRanking();
});

btnLimparRanking2.addEventListener("click", () => {
  if (!confirm("Limpar ranking e histórico de pontos?")) return;
  localStorage.removeItem(listaJogadores);
  renderizarRanking();
  atualizarMiniRanking();
});

btnVoltarRanking2.addEventListener("click", () => mostrarTela(telaMenu));

btnVoltarRanking.addEventListener("click", () => mostrarTela(telaIniciar));

/* ---------- atualização inicial do ranking ---------- */
atualizarMiniRanking();