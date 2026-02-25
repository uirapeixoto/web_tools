/* global mermaid */

const mermaidInput = document.getElementById('mermaidInput');
const mermaidPreview = document.getElementById('mermaidPreview');
const validationOutput = document.getElementById('validationOutput');
const statusText = document.getElementById('statusText');

const btnValidate = document.getElementById('btnValidate');
const btnAiFix = document.getElementById('btnAiFix');
const btnClear = document.getElementById('btnClear');
const btnExample = document.getElementById('btnExample');

if (window.mermaid) {
  window.mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
  });
}

const EXAMPLE_DIAGRAM = `graph TD
  A[Ideia] --> B[Protótipo];
  B --> C{Funciona?};
  C -->|Sim| D[Lançar];
  C -->|Não| E[Iterar];
`;

function setStatus(text, type = 'idle') {
  if (!statusText) return;
  statusText.textContent = text;
  statusText.style.color =
    type === 'error' ? 'var(--danger)' : type === 'success' ? 'var(--success)' : '';
}

function setValidation(message, type = 'info') {
  if (!validationOutput) return;
  validationOutput.textContent = message;
  validationOutput.classList.remove('success', 'error');
  if (type === 'success') validationOutput.classList.add('success');
  if (type === 'error') validationOutput.classList.add('error');
}

async function renderMermaid(code) {
  if (!window.mermaid || !mermaidPreview) return;
  mermaidPreview.innerHTML = '';

  if (!code.trim()) {
    setStatus('Aguardando diagrama...', 'idle');
    return;
  }

  setStatus('Renderizando diagrama...', 'idle');
  const id = `mermaid-diagram-${Date.now()}`;

  try {
    const { svg } = await window.mermaid.render(id, code);
    mermaidPreview.innerHTML = svg;
    setStatus('Diagrama válido e renderizado.', 'success');
  } catch (err) {
    setStatus('Erro ao renderizar diagrama.', 'error');
    setValidation(String(err), 'error');
  }
}

async function validateMermaid() {
  const code = mermaidInput.value || '';
  if (!code.trim()) {
    setStatus('Nenhum código para validar.', 'error');
    setValidation('Forneça um código Mermaid para validação.', 'error');
    return;
  }

  try {
    // Em versões recentes o parse retorna uma Promise
    if (!window.mermaid?.parse) {
      setValidation(
        'API de validação indisponível nesta versão do Mermaid, mas tentaremos renderizar o diagrama.',
        'error',
      );
      await renderMermaid(code);
      return;
    }

    await window.mermaid.parse(code);
    setValidation('Sintaxe válida para Mermaid.', 'success');
    await renderMermaid(code);
  } catch (err) {
    setValidation(`Erro de sintaxe Mermaid:\n\n${String(err)}`, 'error');
    setStatus('Diagrama inválido. Veja detalhes na área de validação.', 'error');
  }
}

async function requestAiFix() {
  const code = mermaidInput.value || '';
  const currentError = validationOutput.classList.contains('error')
    ? validationOutput.textContent
    : '';

  if (!code.trim()) {
    setStatus('Nenhum código para corrigir.', 'error');
    setValidation('Escreva primeiro um diagrama para solicitar correção.', 'error');
    return;
  }

  setStatus('Enviando para IA...', 'idle');
  setValidation('Aguardando resposta da IA...', 'info');

  try {
    const response = await fetch('/api/mermaid/ai-fix', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        error: currentError,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      setStatus('Erro ao usar a IA para correção.', 'error');
      setValidation(
        `${data.message || 'Erro ao chamar o endpoint de IA.'}\n\nDetalhes: ${
          data.details || ''
        }`,
        'error',
      );
      return;
    }

    if (data.fixedCode) {
      mermaidInput.value = data.fixedCode;
      setStatus('Código atualizado com a sugestão da IA. Validando...', 'idle');
      await validateMermaid();
    } else {
      setStatus('Resposta inesperada da IA.', 'error');
      setValidation(data.message || 'Resposta inesperada da IA.', 'error');
    }
  } catch (err) {
    setStatus('Erro ao se comunicar com a IA.', 'error');
    setValidation(`Falha de comunicação com o servidor:\n\n${String(err)}`, 'error');
  }
}

function clearAll() {
  mermaidInput.value = '';
  mermaidPreview.innerHTML = '';
  setStatus('Aguardando diagrama...', 'idle');
  setValidation('Nenhum resultado de validação ainda.', 'info');
}

function insertExample() {
  mermaidInput.value = EXAMPLE_DIAGRAM;
  setValidation('Exemplo carregado. Clique em Validar para conferir.', 'info');
  setStatus('Exemplo pronto para validação.', 'idle');
}

if (mermaidInput) {
  setValidation('Nenhum resultado de validação ainda.', 'info');
  setStatus('Aguardando diagrama...', 'idle');

  btnValidate?.addEventListener('click', () => {
    validateMermaid();
  });

  btnAiFix?.addEventListener('click', () => {
    requestAiFix();
  });

  btnClear?.addEventListener('click', () => {
    clearAll();
  });

  btnExample?.addEventListener('click', () => {
    insertExample();
    renderMermaid(mermaidInput.value);
  });

  mermaidInput.addEventListener('input', () => {
    // feedback rápido sem renderização completa
    setStatus('Texto alterado. Clique em Validar para conferir a sintaxe.', 'idle');
  });
}

