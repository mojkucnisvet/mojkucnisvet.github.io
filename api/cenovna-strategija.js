export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Samo POST zahtevi.' });

  try {
    const { naziv, cena, kategorija, zvezdice, dodatno } = req.body || {};

    if (!cena) return res.status(400).json({ error: 'Unesite prodajnu cenu.' });

    const zvezdiceMap = {
      '1': 'Brza hrana, kiosk, pekara',
      '2': 'Kafana, bistro, picerija',
      '3': 'Restoran srednje klase',
      '4': 'Premium restoran, hotel',
      '5': 'Lux, fine dining, Mišelin nivo'
    };

    const nivoObjekta = zvezdiceMap[zvezdice] || 'Nije navedeno';

    const prompt = `Ti si ekspert za psihologiju cena u ugostiteljstvu.

Jelo: ${naziv || 'Nepoznato jelo'}
Trenutna cena: ${cena}
Kategorija jela: ${kategorija || 'Nije navedeno'}
Nivo objekta: ${nivoObjekta} (${zvezdice || '?'} zvezdica)
Dodatne informacije: ${dodatno || 'Nema'}

VAŽNO: Uzmi u obzir NAZIV jela, KATEGORIJU jela (predjelo, glavno, desert, piće) i NIVO OBJEKTA (zvezdice). Ista corba u kafani (2 zvezdice) kosta 300 RSD, u premium restoranu (4 zvezdice) 800 RSD. Predlozi moraju biti realni za taj nivo objekta. Varijacije neka budu ±20% od trenutne cene.

Daj TRI predloga psiholoških cena sa kratkim objašnjenjem za svaki. Vrati SAMO čist JSON, bez markdown-a, bez \`\`\`:

{
  "predlozi": [
    {"cena": "290", "strategija": "Zaokružena cena", "zasto": "Deluje uredno i profesionalno."},
    {"cena": "285", "strategija": "Psihološka cena", "zasto": "Deluje jeftinije iako je razlika mala."},
    {"cena": "350", "strategija": "Premijum cena", "zasto": "Deluje kvalitetnije."}
  ],
  "savet": "Koju cenu izabrati i zašto (1-2 rečenice)",
  "objasnjenje": "Kratko objašnjenje psihologije cena za ovu vrstu jela i nivo objekta (1-2 rečenice)"
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
