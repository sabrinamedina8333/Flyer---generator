export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: 'API key no configurada' });

  try {
    const { product, format } = req.body;
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `Eres experto en marketing. Devuelve SOLO un JSON válido sin markdown con:
- "titulo": nombre del producto en mayúsculas, máximo 2 líneas (usa \\n para separar)
- "tagline": frase de impacto corta máximo 6 palabras en mayúsculas
- "specs": array de strings con las características, máximo ${format === '45' ? 9 : 7} ítems

Producto: ${JSON.stringify(product)}

Responde SOLO el JSON.`
        }]
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Error API');

    const text = data.content[0].text.trim();
    let parsed;
    try { parsed = JSON.parse(text); }
    catch { parsed = { titulo: product.modelo, tagline: 'OFERTA ESPECIAL', specs: product.specs }; }

    return res.status(200).json(parsed);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
