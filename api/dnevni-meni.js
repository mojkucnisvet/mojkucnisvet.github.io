export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Samo POST zahtevi.' });

  try {
    const { restoran, brojJela, budzet, zahtevi } = req.body || {};

    if (!restoran) {
      return res.status(400).json({ error: 'Odaberite vrstu restorana.' });
    }

    const broj = parseInt(brojJela) || 4;
    const kategorije = broj === 3 ? 'predjelo, glavno jelo, desert' :
                       broj === 4 ? 'predjelo, supa, glavno jelo, desert' :
                       broj === 5 ? 'predjelo, supa, glavno jelo, desert, piće' :
                       'predjelo, supa, glavno jelo, salata, desert, piće';

    const prompt = `Ti si profesionalni kuvar sa 24 godine iskustva. KREIRAJ DNEVNI MENI za restoran.

Vrsta restorana: ${restoran}
Broj jela: ${broj} (kategorije: ${kategorije})
Budžet: ${budzet || 'nije ograničen'}
Posebni zahtevi: ${zahtevi || 'nema'}

Vrati JSON:
{
  "meni": [
    {
      "kategorija": "Predjelo/Supa/Glavno jelo/Desert/Salata/Piće",
      "jelo": "Naziv jela",
      "opis": "Kratak opis (1 rečenica, do 15 reči)",
      "cena": "Predlog cene u RSD"
    }
  ],
  "napomena": "Kratka napomena o meniju (opciono, 1 rečenica)"
}

Jela neka budu realna za ovu vrstu restorana. Cene realne za Srbiju (500-2500 RSD po jelu). Opisi kratki i primamljivi.`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sk-7f035e02050b4bd38cd319a5a4703917'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 600
      })
    });

    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
      return res.status(500).json({ error: 'AI nije vratio odgovor.' });
    }

    const raw = data.choices[0].message.content.trim();

    try {
      const parsed = JSON.parse(raw);
      return res.status(200).json(parsed);
    } catch (e) {
      return res.status(200).json({ 
        meni: [{ kategorija: 'Meni', jelo: raw, opis: '', cena: '' }],
        napomena: ''
      });
    }

  } catch (error) {
    return res.status(500).json({ error: 'Greška: ' + error.message });
  }
}
