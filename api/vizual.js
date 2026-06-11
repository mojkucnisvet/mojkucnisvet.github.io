export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Samo POST zahtevi.' });

  try {
    const { tekst } = req.body || {};

    if (!tekst) return res.status(400).json({ error: 'Unesite tekst menija.' });

    const prompt = `Unapredi ovaj meni. Za svako jelo napiši novi, primamljiv opis i predloži cenu u RSD. Vrati SAMO čist JSON, bez markdown-a, bez \`\`\`:

{
  "meni": [
    {"jelo": "Naziv jela", "opis": "Novi opis", "cena": "Cena u RSD"}
  ]
}

Stari meni:
${tekst}`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer sk-7f035e02050b4bd38cd319a5a4703917' },
      body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 500 })
    });

    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      return res.status(200).json({ meni: [], napomena: 'DeepSeek nije vratio odgovor. Raw: ' + JSON.stringify(data) });
    }

    let raw = data.choices[0].message.content.trim();
    raw = raw.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      const parsed = JSON.parse(raw);
      return res.status(200).json(parsed);
    } catch (e) {
      return res.status(200).json({ meni: [], napomena: 'Nije uspeo parse JSON-a. Raw: ' + raw });
    }

  } catch (error) {
    return res.status(500).json({ error: 'Greška: ' + error.message });
  }
}
