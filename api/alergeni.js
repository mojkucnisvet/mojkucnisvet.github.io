export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Samo POST zahtevi.' });

  try {
    const { jelo, sastojci } = req.body || {};

    if (!jelo) return res.status(400).json({ error: 'Unesite naziv jela.' });
    if (!sastojci) return res.status(400).json({ error: 'Unesite bar nekoliko sastojaka.' });

    const prompt = `Analiziraj jelo. Vrati SAMO čist JSON, bez markdown-a, bez \`\`\`, bez zvezdica, bez dodatnog teksta. Samo JSON objekat.

Jelo: ${jelo}
Sastojci: ${sastojci}

Format:
{
  "alergeni": [{"naziv":"Gluten","prisutan":true,"sastojak":"brašno"},{"naziv":"Laktoza","prisutan":true,"sastojak":"pavlaka"},{"naziv":"Jaja","prisutan":false,"sastojak":""}],
  "nutritivneVrednosti":{"kalorije":"450 kcal","proteini":"35g","masti":"18g","ugljeniHidrati":"30g"},
  "oznaka":"Sadrži gluten i mlečne proizvode."
}

Proveri ovih 11 alergena: gluten, laktoza, jaja, orasasti plodovi, soja, riba, skoljke, susam, celer, senf, sulfiti.
Za svaki navedi "prisutan": true ili false. Ako je prisutan, navedi i koji sastojak ga sadrzi.
Oznaka neka bude jedna kratka recenica, spremna za stampu na meniju.`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer sk-7f035e02050b4bd38cd319a5a4703917' },
      body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: prompt }], temperature: 0.2, max_tokens: 500 })
    });

    const data = await response.json();
    if (!data.choices || data.choices.length === 0) return res.status(500).json({ error: 'AI nije vratio odgovor.' });

    let raw = data.choices[0].message.content.trim();
    // Ukloni markdown ako ga ima
    raw = raw.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      const parsed = JSON.parse(raw);
      return res.status(200).json(parsed);
    } catch (e) {
      return res.status(200).json({ oznaka: raw, alergeni: [], nutritivneVrednosti: {} });
    }

  } catch (error) {
    return res.status(500).json({ error: 'Greška: ' + error.message });
  }
}
