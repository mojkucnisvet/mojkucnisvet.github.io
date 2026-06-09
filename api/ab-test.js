export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Samo POST zahtevi.' });

  try {
    const { jelo, opisA, opisB } = req.body || {};

    if (!jelo) return res.status(400).json({ error: 'Unesite naziv jela.' });
    if (!opisA || !opisB) return res.status(400).json({ error: 'Unesite oba opisa (A i B).' });

    const prompt = `Ti si ekspert za prodajnu psihologiju i copywriting u ugostiteljstvu. Uporedi dve verzije opisa za ISTO jelo i reci koja ce se bolje prodavati.

Jelo: ${jelo}
Opis A: "${opisA}"
Opis B: "${opisB}"

Analiziraj na osnovu:
- Dužine (kraće je obično bolje za meni)
- Senzualnih reči (mirisi, ukusi, teksture)
- Konkretnosti (što manje praznih reči)
- Emotivnog uticaja (da li tera vodu na usta)
- Prodajne psihologije (da li podstiče na kupovinu)

Vrati SAMO čist JSON, bez markdown-a, bez \`\`\`, bez dodatnog teksta:
{
  "pobednik": "A" ili "B",
  "procenat": "35%",
  "zasto": "Kratko objasnjenje zasto je bolja (1-2 recenice)",
  "savet": "Kako poboljsati slabiju verziju (1 recenica)",
  "uticaj": "Ocekivano povecanje prodaje: 15-20%"
}`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer sk-7f035e02050b4bd38cd319a5a4703917' },
      body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: prompt }], temperature: 0.5, max_tokens: 400 })
    });

    const data = await response.json();
    if (!data.choices || data.choices.length === 0) return res.status(500).json({ error: 'AI nije vratio odgovor.' });

    let raw = data.choices[0].message.content.trim();
    raw = raw.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      const parsed = JSON.parse(raw);
      return res.status(200).json(parsed);
    } catch (e) {
      return res.status(200).json({ pobednik: 'B', procenat: 'N/A', zasto: raw, savet: '', uticaj: '' });
    }

  } catch (error) {
    return res.status(500).json({ error: 'Greška: ' + error.message });
  }
}
