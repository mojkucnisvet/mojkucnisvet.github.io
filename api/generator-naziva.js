export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Samo POST zahtevi.' });

  try {
    const { sastojci, restoran, stil, dodatno } = req.body || {};

    if (!sastojci) return res.status(400).json({ error: 'Unesite sastojke jela.' });

    const prompt = `Ti si kreativni direktor restorana i ekspert za imenovanje jela.

Sastojci: ${sastojci}
Vrsta restorana: ${restoran || 'Nije navedeno'}
Stil naziva: ${stil || 'Kreativan'}
Dodatne informacije: ${dodatno || 'Nema'}

Smisli TRI originalna naziva za ovo jelo. Svaki naziv neka bude u drugom stilu. Vrati SAMO čist JSON, bez markdown-a, bez \`\`\`:

{
  "predlozi": [
    {"naziv": "Ime jela", "stil": "Klasičan/Moderan/Šaljiv/Elegantan", "zasto": "Kratko objašnjenje zašto je ovaj naziv dobar (1 rečenica)"},
    {"naziv": "Ime jela", "stil": "Klasičan/Moderan/Šaljiv/Elegantan", "zasto": "Kratko objašnjenje"},
    {"naziv": "Ime jela", "stil": "Klasičan/Moderan/Šaljiv/Elegantan", "zasto": "Kratko objašnjenje"}
  ],
  "preporuka": "Koji naziv izabrati i zašto (1-2 rečenice)"
}`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer sk-7f035e02050b4bd38cd319a5a4703917' },
      body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: prompt }], temperature: 0.9, max_tokens: 500 })
    });

    const data = await response.json();
    if (!data.choices || data.choices.length === 0) return res.status(500).json({ error: 'AI nije vratio odgovor.' });

    let raw = data.choices[0].message.content.trim();
    raw = raw.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      const parsed = JSON.parse(raw);
      return res.status(200).json(parsed);
    } catch (e) {
      return res.status(200).json({ preporuka: raw, predlozi: [] });
    }

  } catch (error) {
    return res.status(500).json({ error: 'Greška: ' + error.message });
  }
}
