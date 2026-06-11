export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Samo POST zahtevi.' });

  try {
    const { tekst } = req.body || {};

    if (!tekst) return res.status(400).json({ error: 'Unesite tekst menija ili otpremite sliku.' });

    const prompt = `Ti si profesionalni Meni Inženjer. Dobio si tekst starog menija koji treba da unaprediš.

Stari meni:
${tekst}

Za SVAKO jelo uradi sledeće:
1. Zadrži originalni naziv jela (nemoj ga menjati)
2. Napiši NOVI, primamljiv opis (2-3 rečenice, maks 25 reči)
3. Predloži cenu u RSD (ako već nema cenu, proceni realnu cenu za Srbiju)

Vrati SAMO čist JSON, bez markdown-a, bez \`\`\`:
{
  "meni": [
    {"jelo": "Originalni naziv jela", "opis": "Novi primamljiv opis", "cena": "Cena u RSD"}
  ],
  "napomena": "Kratka napomena o meniju (1 rečenica)"
}`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer sk-7f035e02050b4bd38cd319a5a4703917' },
      body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 1000 })
    });

    const data = await response.json();
    if (!data.choices || data.choices.length === 0) return res.status(500).json({ error: 'AI nije vratio odgovor.' });

    let raw = data.choices[0].message.content.trim();
    raw = raw.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      const parsed = JSON.parse(raw);
      return res.status(200).json(parsed);
    } catch (e) {
      return res.status(200).json({ napomena: raw, meni: [] });
    }

  } catch (error) {
    return res.status(500).json({ error: 'Greška: ' + error.message });
  }
}
