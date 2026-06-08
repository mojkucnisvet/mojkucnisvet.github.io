export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Samo POST zahtevi su dozvoljeni.' });

  try {
    const { jelo, restoran, sastojci, kreativnost } = req.body || {};

    if (!jelo && !sastojci) {
      return res.status(400).json({ error: 'Unesite naziv jela ili sastojke.' });
    }

    let prompt;
    if (!jelo && sastojci) {
      prompt = `Na osnovu ovih sastojaka: "${sastojci}", odredi koje je jelo u pitanju i vrati JSON: {"detected_jelo":"IME JELA","opis":"OPIS JELA"}. Vrsta restorana: ${restoran || 'tradicionalni restoran'}.`;
    } else {
      prompt = `Napiši kratak, primamljiv opis za jelo "${jelo || 'nepoznato jelo'}". Sastojci: ${sastojci || 'standardni'}. Prilagodi ton vrsti restorana: ${restoran || 'tradicionalni restoran'}. Vrati SAMO opis (2-3 rečenice, maks 40 reči).`;
    }

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sk-7f035e02050b4bd38cd319a5a4703917'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 200
      })
    });

    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
      return res.status(500).json({ error: 'AI nije vratio odgovor. Pokušajte ponovo.' });
    }

    const raw = data.choices[0].message.content.trim();

    if (!jelo && sastojci) {
      try {
        const parsed = JSON.parse(raw);
        return res.status(200).json(parsed);
      } catch (e) {
        return res.status(200).json({ detected_jelo: 'Nepoznato jelo', opis: raw });
      }
    }

    return res.status(200).json({ opis: raw });

  } catch (error) {
    return res.status(500).json({ error: 'Greška na serveru: ' + error.message });
  }
}
