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
      instrukcijaListe = `Restoran ima OVU listu pića: ${lista.join(', ')}. Izaberi SAMO 1 ili 2 pića iz ove liste koja se NAJBOLJE slažu uz jelo.`;
    }

    const prompt = `Ti si profesionalni somelijer. Gost je naručio: "${jelo}". Sastojci: ${sastojci || 'standardni'}. Želi preporuku za: ${tip}. ${instrukcijaListe}

Vrati JSON:
{
  "preporuke": [
    {
      "pice": "Naziv pića",
      "zasto": "Kratko objašnjenje (1 rečenica)",
      "temperatura": "Temperatura serviranja",
      "opisZaKonobara": "Kratka rečenica za konobara",
      "cena": "Cena u RSD po čaši/flaši"
    }
  ]
}

Daj 1 ili 2 preporuke. Prva neka bude NAJBOLJA. Ako nema liste pića, slobodno predloži šta god je najbolje. Cene realne za Srbiju (300-800 RSD vino, 200-400 RSD pivo, 400-700 RSD koktel).`;

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
        max_tokens: 400
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
        preporuke: [{
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
