export default async function handler(req, res) {
  // 1. POSTAVLJANJE CORS ZAGLAVLJA
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 2. PREUZIMANJE PARAMETARA
  const jelo = req.query.jelo || req.body?.jelo;
  const restoran = req.query.restoran || req.body?.restoran || 'Moj Kućni Svet';
  const sastojci = req.query.sastojci || req.body?.sastojci || 'standardni sastojci';
  const kreativnost = req.query.kreativnost || req.body?.kreativnost || 'visoka';

  if (!jelo) {
    return res.status(400).json({ success: false, error: "Parametar 'jelo' je obavezan." });
  }

  // 3. KREIRANJE PROMPTA ZA DEEPSEEK
  const prompt = `Ti si Vlada, profesionalni kuvar sa 24 godine iskustva i autor AI sistema "Meni Inženjer". 
  Kreiraj profesionalni, primamljivi, prodajni opis jela za meni restorana na srpskom jeziku.
  
  Detalji o jelu:
  - Naziv jela: ${jelo}
  - Naziv restorana: ${restoran}
  - Ključni sastojci: ${sastojci}
  - Nivo kreativnosti: ${kreativnost}
  
  Opis mora biti sočan, da budi apetit, napisan u stilu vrhunskih restorana. Vrati samo gotov opis jela, bez dodatnog teksta ili uvoda.`;

  try {
    // 4. POZIVANJE DEEPSEEK API-JA
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer sk-7f035e02050b4bd38cd319a5a4703917`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "Ti si stručnjak za pisanje jelovnika i opisa hrane." },
          { role: "user", content: prompt }
        ],
        temperature: kreativnost === 'visoka' ? 0.9 : 0.5,
        max_tokens: 1000
      })
    });

    const data = await response.json();
    
    if (data.choices && data.choices.length > 0) {
      const opisJela = data.choices[0].message.content.trim();
      return res.status(200).json({ success: true, opis: opisJela });
    } else {
      return res.status(500).json({ success: false, error: "DeepSeek nije vratio validan odgovor.", raw: data });
    }

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
