export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Samo POST zahtevi.' });

  try {
    const { tekst, imageBase64 } = req.body || {};
    let meniTekst = tekst;

    // Ako je poslata slika, prvo uradi OCR preko Google Vision API
    if (imageBase64 && !tekst) {
      const ocrResponse = await fetch('https://vision.googleapis.com/v1/images:annotate?key=AIzaSyD8AjfFweKkZsj1eKqdJ1UQBHT__klS5AE', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: imageBase64 },
            features: [{ type: 'TEXT_DETECTION' }]
          }]
        })
      });

      const ocrData = await ocrResponse.json();
      
      if (ocrData.responses && ocrData.responses[0].fullTextAnnotation) {
        meniTekst = ocrData.responses[0].fullTextAnnotation.text;
      } else {
        return res.status(400).json({ error: 'Nije uspelo čitanje teksta sa slike. Pokušajte ponovo ili unesite tekst ručno.' });
      }
    }

    if (!meniTekst) return res.status(400).json({ error: 'Unesite tekst menija ili otpremite sliku.' });

    // DeepSeek prompt
    const prompt = `Unapredi ovaj meni. Za svako jelo napiši novi, primamljiv opis i predloži cenu u RSD. Vrati SAMO čist JSON, bez markdown-a, bez \`\`\`:
{
  "meni": [
    {"jelo": "Naziv jela", "opis": "Novi opis", "cena": "Cena u RSD"}
  ],
  "napomena": "Kratka napomena o meniju (1 rečenica)"
}

Stari meni:
${meniTekst}`;

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
      return res.status(200).json({ meni: [], napomena: raw });
    }

  } catch (error) {
    return res.status(500).json({ error: 'Greška: ' + error.message });
  }
}
