export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Samo POST zahtevi.' });

  try {
    const { jelo, sastojci, tipPica, listaPica } = req.body || {};

    if (!jelo) {
      return res.status(400).json({ error: 'Unesite naziv jela.' });
    }

    const tip = tipPica || 'Sve';
    const lista = listaPica || [];

    let instrukcijaListe = '';
    if (lista.length > 0) {
      instrukcijaListe = `Restoran ima OVU listu pića: ${lista.join(', ')}.`;
    }

    const prompt = `Ti si profesionalni somelijer i ekspert za sparivanje hrane i pića. 
Gost je naručio: "${jelo}". Sastojci: ${sastojci || 'standardni'}. 
Želi preporuku za: ${tip}.
${instrukcijaListe}

Vrati JSON u formatu:
{
  "najbolje": [
    {
      "pice": "Naziv pića",
      "zasto": "Kratko objašnjenje zašto se NAJBOLJE slaže (1 rečenica)",
      "temperatura": "Temperatura serviranja",
      "opisZaKonobara": "Kratka rečenica koju konobar može da kaže gostu (1 rečenica)",
      "cena": "Predlog prodajne cene u RSD po čaši/flaši"
    }
  ],
  "ostale": [
    {
      "pice": "Naziv pića",
      "zasto": "Objašnjenje zašto se slaže",
      "temperatura": "Temperatura serviranja",
      "opisZaKonobara": "Kratka rečenica za konobara",
      "cena": "Predlog cene u RSD"
    }
  ]
}

U "najbolje" stavi SAMO 1 ili 2 pića koja se APSOLUTNO NAJBOLJE slažu uz jelo.
U "ostale" stavi ostala pića koja se takođe dobro slažu (može i 5, 8, 10 - koliko ima smisla).
Ako je lista pića data, biraj SAMO iz te liste. Ako nema liste, predloži šta god je najbolje.
Cene neka budu realne za Srbiju (300-800 RSD za čašu vina, 200-400 RSD za pivo, 400-700 RSD za koktel).`;

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
        max_tokens: 800
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
        najbolje: [],
        ostale: [{
          pice: raw,
          zasto: '',
          temperatura: '',
          opisZaKonobara: '',
          cena: ''
        }]
      });
    }

  } catch (error) {
    return res.status(500).json({ error: 'Greška: ' + error.message });
  }
}
