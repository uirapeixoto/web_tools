/* global marked, mermaid */

// Configura o Mermaid e o Marked assim que o script carregar
if (window.mermaid) {
  window.mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
  });
}

if (window.marked) {
  const renderer = new marked.Renderer();

  // Renderização especial para blocos de código Mermaid
  renderer.code = (code, language) => {
    if (language === 'mermaid') {
      return `<pre class="mermaid">${code}</pre>`;
    }
    const escaped = marked.parseInline(code);
    return `<pre><code>${escaped}</code></pre>`;
  };

  marked.setOptions({
    breaks: true,
    gfm: true,
    renderer,
  });
}

const markdownInput = document.getElementById('markdownInput');
const markdownPreview = document.getElementById('markdownPreview');
const fileNameInput = document.getElementById('fileName');
const btnNew = document.getElementById('btnNew');
const btnDownload = document.getElementById('btnDownload');
const fileInput = document.getElementById('fileInput');

const DEFAULT_CONTENT = `# Bem-vindo ao Editor Markdown + Mermaid

Este espaço permite criar documentos **Markdown** com suporte a diagramas Mermaid.

## Exemplo de lista

- Item 1
- Item 2
- Item 3

## Exemplo de código Mermaid

\`\`\`mermaid
graph TD
  A[Início] --> B{Decisão};
  B -->|Sim| C[Opção 1];
  B -->|Não| D[Opção 2];
\`\`\`
`;

function renderMarkdownPreview() {
  if (!window.marked) return;
  const text = markdownInput.value || '';

  const html = window.marked.parse(text);
  markdownPreview.innerHTML = html;

  // Renderiza blocos Mermaid depois que o HTML é injetado
  if (window.mermaid) {
    try {
      window.mermaid.init(undefined, markdownPreview.querySelectorAll('.mermaid'));
    } catch (e) {
      // Deixa o bloco como está se der erro
      // eslint-disable-next-line no-console
      console.error('Erro ao renderizar Mermaid no preview:', e);
    }
  }
}

function newDocument() {
  markdownInput.value = DEFAULT_CONTENT;
  if (!fileNameInput.value) {
    fileNameInput.value = 'novo-documento.md';
  }
  renderMarkdownPreview();
}

function downloadMarkdown() {
  const content = markdownInput.value || '';
  const fileName = (fileNameInput.value || 'documento.md').trim() || 'documento.md';

  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

function handleFileChosen(event) {
  const [file] = event.target.files || [];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    markdownInput.value = reader.result || '';
    fileNameInput.value = file.name || 'arquivo.md';
    renderMarkdownPreview();
  };
  reader.readAsText(file);
}

if (markdownInput && markdownPreview) {
  markdownInput.addEventListener('input', renderMarkdownPreview);
  btnNew?.addEventListener('click', newDocument);
  btnDownload?.addEventListener('click', downloadMarkdown);
  fileInput?.addEventListener('change', handleFileChosen);

  // Inicializa com um conteúdo de exemplo
  if (!markdownInput.value) {
    newDocument();
  } else {
    renderMarkdownPreview();
  }
}

