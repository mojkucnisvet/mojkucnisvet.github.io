export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Samo POST zahtevi.' });

  try {
    const { jelo, sastojci } = req.body || {};

    if (!jelo) {
      return res.status(400).json({ error: 'Unesite naziv jela.' });
    }
    if (!sastojci) {
      return res.status(400).json({ error: 'Unesite bar nekoliko sastojaka.' });
    }

    const prompt = `Ti si nutricionista i ekspert za alergene. Analiziraj jelo.

Jelo: "${jelo}"
Sastojci: ${sastojci}

Neki sastojci možda imaju navedenu gramažu (npr. "pileći file 200g"). Ako nema gramaže, proceni prosečnu porciju za ugostiteljski objekat u Srbiji.

Vrati JSON u ovom formatu:
{
  "alergeni": [
    { "naziv": "Gluten", "alergen": "da", "sastojak": "brašno" },
    { "naziv": "Laktoza", "alergen": "da", "sastojak": "pavlaka" }
  ],
  "nutritivneVrednosti": {
    "kalorije": "450 kcal",
    "proteini": "35g",
    "masti": "18g",
    "ugljeniHidrati": "30g"
  },
  "oznaka": "Sadrži gluten i mlečne proizvode.",
  "napomena": "Nutritivne vrednosti su približne i izračunate na osnovu prosečne porcije."
}

Alergeni koje treba da proveriš: gluten, laktoza, jaja, orašasti plodovi, soja, riba, školjke, susam, celer, senf, sulfiti.
U polju "alergen" piši "da" ili "ne".
Oznaka neka bude kratka, spremna za meni (1 rečenica).`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sk-7f035e02050b4bd38cd319a5a4703917'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 500
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
        alergeni: [],
        nutritivneVrednosti: {},
        oznaka: raw,
        napomena: ''
      });
    }

  } catch (error) {
    return res.status(500).json({ error: 'Greška: ' + error.message });
  }
}
