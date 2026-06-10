export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Samo POST zahtevi.' });

  try {
    const { naziv, cena, kategorija, dodatno } = req.body || {};

    if (!cena) return res.status(400).json({ error: 'Unesite prodajnu cenu.' });

    const prompt = `Ti si ekspert za psihologiju cena u ugostiteljstvu.

Jelo: ${naziv || 'Nepoznato jelo'}
Trenutna cena: ${cena}
Kategorija: ${kategorija || 'Nije navedeno'}
Dodatne informacije: ${dodatno || 'Nema'}

Daj TRI predloga psiholoških cena sa kratkim objašnjenjem za svaki. Vrati SAMO čist JSON, bez markdown-a, bez \`\`\`:

{
  "predlozi": [
    {"cena": "1150", "strategija": "Zaokružena cena", "zasto": "Deluje uredno i profesionalno. Gosti ne razmišljaju o ceni."},
    {"cena": "1149", "strategija": "Psihološka cena", "zasto": "Deluje jeftinije iako je razlika samo 1 RSD. Odlično za brze odluke."},
    {"cena": "1190", "strategija": "Premijum cena", "zasto": "Deluje kvalitetnije. Gost misli da dobija više za svoj novac."}
  ],
  "savet": "Koju cenu izabrati i zašto (1-2 rečenice)",
  "objasnjenje": "Kratko objašnjenje psihologije cena za ovu kategoriju (1-2 rečenice)"
}`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer sk-7f035e02050b4bd38cd319a5a4703917' },
      body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 500 })
    });

    const data = await response.json();
    if (!data.choices || data.choices.length === 0) return res.status(500).json({ error: 'AI nije vratio odgovor.' });

    let raw = data.choices[0].message.content.trim();
    raw = raw.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      const parsed = JSON.parse(raw);
      return res.status(200).json(parsed);
    } catch (e) {
      return res.status(200).json({ savet: raw, objasnjenje: '', predlozi: [] });
    }

  } catch (error) {
    return res.status(500).json({ error: 'Greška: ' + error.message });
  }
}
