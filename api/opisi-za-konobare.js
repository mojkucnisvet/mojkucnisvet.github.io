export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Samo POST zahtevi.' });

  try {
    const { jelo, opis, tip, kontekst } = req.body || {};

    if (!jelo) return res.status(400).json({ error: 'Unesite naziv jela.' });

    const prompt = `Ti si trener prodaje za ugostiteljsko osoblje. Tvoj zadatak je da smisliš kratke, ubedljive rečenice koje ${tip || 'Konobar'} može da kaže gostu da bi prodao jelo/piće.

Jelo/Piće: ${jelo}
Opis: ${opis || 'Nema opisa'}
Tip osoblja: ${tip || 'Konobar'}
Kontekst: ${kontekst || 'Standardna preporuka'}

Pravila za tip osoblja:
- Ako je Konobar - fokusiraj se na hranu, ukus, način pripreme
- Ako je Somelijer - fokusiraj se na vino, sparivanje sa hranom, aromu, godinu berbe
- Ako je Barmen - fokusiraj se na koktele, sastojke, način pripreme, vizuelni izgled

Smisli TRI različite rečenice. Svaka neka bude za drugačiju situaciju. Vrati SAMO čist JSON, bez markdown-a, bez \`\`\`:

{
  "recenice": [
    {"situacija": "Kada gost pita za preporuku", "recenica": "Kratka, prodajna rečenica (max 15 reči)"},
    {"situacija": "Kada gost okleva", "recenica": "Kratka, prodajna rečenica"},
    {"situacija": "Kada nudiš kao specijalitet", "recenica": "Kratka, prodajna rečenica"}
  ],
  "savet": "Kratak savet kako da izgovori ove rečenice (ton, kontakt očima, osmeh) - 1 rečenica"
}`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer sk-7f035e02050b4bd38cd319a5a4703917' },
      body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: prompt }], temperature: 0.8, max_tokens: 500 })
    });

    const data = await response.json();
    if (!data.choices || data.choices.length === 0) return res.status(500).json({ error: 'AI nije vratio odgovor.' });

    let raw = data.choices[0].message.content.trim();
    raw = raw.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      const parsed = JSON.parse(raw);
      return res.status(200).json(parsed);
    } catch (e) {
      return res.status(200).json({ savet: raw, recenice: [] });
    }

  } catch (error) {
    return res.status(500).json({ error: 'Greška: ' + error.message });
  }
}
