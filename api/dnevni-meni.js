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

    const budzetInstrukcija = budzet 
      ? `UKUPNA CENA SVIH JELA MORA BITI DO ${budzet} RSD. Zbir cena svih jela NE SME preći ${budzet} RSD. Pojedinačne cene prilagodi tako da ukupan zbir bude ispod ${budzet} RSD. Ovo je NAJVAŽNIJE pravilo.`
      : 'Cene neka budu realne za ovu vrstu restorana u Srbiji.';

    const prompt = `Ti si profesionalni kuvar. KREIRAJ DNEVNI MENI.

Vrsta restorana: ${restoran}
Broj jela: ${broj} (kategorije: ${kategorije})
Posebni zahtevi: ${zahtevi || 'nema'}

PRAVILO BUDŽETA: ${budzetInstrukcija}

Vrati JSON:
{
  "meni": [
    {
      "kategorija": "Predjelo/Supa/Glavno jelo/Desert/Salata/Piće",
      "jelo": "Naziv jela",
      "opis": "Kratak opis (1 rečenica, do 15 reči)",
      "cena": "Cena u RSD (broj, bez tekst)"
    }
  ],
  "ukupno": "Ukupna cena svih jela u RSD (samo broj)",
  "napomena": "Kratka napomena (1 rečenica)"
}

VAŽNO: Ako je zadat budžet, cene MORAŠ da prilagodiš tako da ukupan zbir svih jela NE PREĐE zadati budžet. Smanji cene pojedinačnih jela ako treba. Ovo je najvažniji zahtev.`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sk-7f035e02050b4bd38cd319a5a4703917'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
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
        ukupno: '',
        napomena: ''
      });
    }

  } catch (error) {
    return res.status(500).json({ error: 'Greška: ' + error.message });
  }
}
