export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Samo POST zahtevi.' });

  try {
    const { poruka, istorija } = req.body || {};

    if (!poruka) return res.status(400).json({ error: 'Unesite poruku.' });

    const prompt = `Ti si Ugostiteljski AI Agent — kompletan asistent za vođenje restorana, kafića, hotela i pekare. Tvoj tvorac je Vlada, profesionalni kuvar sa 24 godine iskustva u restoranima, hotelima i street food-u.

Možeš da pomažeš sa:
- Pisanjem opisa jela (Meni Inženjer)
- Kalkulacijom cena i marže
- Sparivanjem hrane i pića
- Generisanjem dnevnih menija
- Prepoznavanjem alergena i nutritivnih vrednosti
- A/B testiranjem opisa
- PDV-om i maržom
- Cenovnom strategijom
- Opisima za Wolt/Glovo
- Generisanjem naziva jela
- Prodajnim rečenicama za konobare, somelijere i barmene
- Digitalizacijom menija
- Optimizacijom zaliha i nabavkom
- Planiranjem osoblja i smena
- HACCP standardima
- Marketingom i društvenim mrežama
- Analitikom prodaje
- Prevođenjem menija na druge jezike
- I svim ostalim pitanjima vezanim za ugostiteljstvo

Tvoj stil: direktan, koristan, konkretan. Kao iskusan kuvar koji pomaže kolegi. Ako te neko pita nešto što ne znaš, reci iskreno i predloži gde može da nađe informacije.

Korisnik pita: ${poruka}

Prethodna istorija razgovora: ${istorija || 'Nema'}

Odgovori kratko i korisno. Ako je pitanje kompleksno, ponudi da razložiš na korake.`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer sk-7f035e02050b4bd38cd319a5a4703917' },
      body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 800 })
    });

    const data = await response.json();
    if (!data.choices || data.choices.length === 0) return res.status(500).json({ error: 'AI nije vratio odgovor.' });

    const odgovor = data.choices[0].message.content.trim();

    return res.status(200).json({ odgovor });

  } catch (error) {
    return res.status(500).json({ error: 'Greška: ' + error.message });
  }
}
