const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

// Helper: fetch with fallback to node-fetch if needed
let fetchFn = global.fetch;
if (!fetchFn) {
  // Lazy-load node-fetch only when necessário
  // eslint-disable-next-line global-require
  const nodeFetch = require('node-fetch');
  fetchFn = nodeFetch;
}

// AI endpoint para correção de diagramas Mermaid
app.post('/api/mermaid/ai-fix', async (req, res) => {
  const { code, error } = req.body || {};

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ message: 'Código Mermaid inválido ou ausente.' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      message:
        'IA não configurada. Defina a variável de ambiente OPENAI_API_KEY para habilitar a correção automática.',
      fixedCode: code,
    });
  }

  try {
    const prompt = [
      'Você é um assistente especializado em diagramas Mermaid.',
      'Receba um código Mermaid que pode estar com erro de sintaxe e um erro de parser.',
      'Analise o código e retorne apenas uma versão corrigida, válida para o Mermaid.',
      'Não explique nada, não adicione comentários – responda apenas com o código Mermaid final.',
      '',
      'Código Mermaid original:',
      code,
      '',
      'Erro reportado (se houver):',
      error || 'desconhecido',
    ].join('\n');

    const response = await fetchFn('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Você é um assistente que corrige exclusivamente código de diagramas Mermaid. Sempre responda apenas com código Mermaid válido.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      // Não expor detalhes sensíveis; apenas uma mensagem genérica
      return res.status(502).json({
        message: 'Falha ao contatar o serviço de IA para correção.',
        details: text.slice(0, 500),
        fixedCode: code,
      });
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content?.trim();

    if (!aiMessage) {
      return res.status(500).json({
        message: 'Resposta inesperada do serviço de IA.',
        fixedCode: code,
      });
    }

    return res.json({
      message: 'Código Mermaid corrigido com IA.',
      fixedCode: aiMessage,
    });
  } catch (e) {
    return res.status(500).json({
      message: 'Erro ao processar a correção com IA.',
      error: e.message,
      fixedCode: code,
    });
  }
});

// Fallback para SPA simples (pode servir index.html por padrão)
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

