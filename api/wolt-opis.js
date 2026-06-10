export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Samo POST zahtevi.' });

  try {
    const { jelo, sastojci, velicina } = req.body || {};

    if (!jelo) return res.status(400).json({ error: 'Unesite naziv jela.' });

    const prompt = `Ti si copywriter za aplikacije za dostavu hrane (Wolt, Glovo).

Jelo: ${jelo}
Sastojci: ${sastojci || 'Nisu navedeni'}
Veličina porcije: ${velicina || 'Nije navedena'}

PRAVILA za opise za dostavu:
- MAKSIMALNO 15 reči (ljudi brzo skroluju)
- Prodajno, primamljivo, konkretno
- Ako su navedeni alergeni (mleko, gluten, jaja, orasi), obavezno ih spomeni na kraju

Vrati SAMO čist JSON, bez markdown-a, bez \`\`\`:
{
  "opis": "Kratak prodajni opis (max 15 reči)",
  "velicinaPorcije": "Veličina porcije (ako je navedena)",
  "alergeni": "Lista prisutnih alergena (ako ih ima) ili 'Nema poznatih alergena'"
}`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer sk-7f035e02050b4bd38cd319a5a4703917' },
      body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 300 })
    });

    const data = await response.json();
    if (!data.choices || data.choices.length === 0) return res.status(500).json({ error: 'AI nije vratio odgovor.' });

    let raw = data.choices[0].message.content.trim();
    raw = raw.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      const parsed = JSON.parse(raw);
      return res.status(200).json(parsed);
    } catch (e) {
      return res.status(200).json({ opis: raw, velicinaPorcije: '', alergeni: '' });
    }

  } catch (error) {
    return res.status(500).json({ error: 'Greška: ' + error.message });
  }
}
