export default async function handler(req, res) {
  // Postavljanje CORS zaglavlja za stabilnu vezu
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Preuzimanje unosa iz forme
  const jelo = req.query.jelo || req.body?.jelo;
  const restoran = req.query.restoran || req.body?.restoran || 'Nacionalni/Tradicionalni';
  const sastojci = req.query.sastojci || req.body?.sastojci || 'standardni sastojci';
  const kreativnost = req.query.kreativnost || req.body?.kreativnost || 'visoka';

  if (!jelo) {
    return res.status(200).json({ success: false, error: "Molimo unesi naziv jela." });
  }

  // Određivanje stila za 19 vrsta restorana
  let stilPisanja = "Napiši primamljiv opis jela.";
  if (restoran === "Nacionalni/Tradicionalni") stilPisanja = "Koristi tradicionalan, domaćinski ton, duh tradicije i bakinu kuhinju.";
  else if (restoran === "Italijanski") stilPisanja = "Fokusiraj se na svežinu, harmoniju mediteranskog bilja, reči poput al dente i svilenkasti sos.";
  else if (restoran === "Francuski") stilPisanja = "Ton mora biti izuzetno prefinjen, klasičan, sofisticiran i luksuzan.";
  else if (restoran === "Grčki/Mediteranski") stilPisanja = "Opis treba da miriše na more, maslinovo ulje, limun i sunce.";
  else if (restoran === "Picerija") stilPisanja = "Naglasi hrskavost tankog testa, miris šamota iz kamene peći i topljenje prave mocarele.";
  else if (restoran === "Japanski/Sushi") stilPisanja = "Stil je minimalistički, čist, elegantan. Naglasi vrhunski kvalitet i balans ukusa.";
  else if (restoran === "Kineski") stilPisanja = "Istakni dinamiku voka, balans slatko-kiselog sosa i bogatstvo umami ukusa.";
  else if (restoran === "Indijski") stilPisanja = "Naglasi bogatstvo začina, tandoor peć, raskošne kari sosove i aromatični miris.";
  else if (restoran === "Tajlandski/Vijetnamski") stilPisanja = "Naglasi kontrast ukusa: balans slatkog, kiselog, slanog i ljutog, uz limunovu travu i kokos.";
  else if (restoran === "Street & Fast Food") stilPisanja = "Ton je urban, moderan i opušten. Fokusiraj se na ekstremnu sočnost i bogate prelive.";
  else if (restoran === "Pekara") stilPisanja = "Istakni hrskavu koricu, lisnato testo, toplu sredinu i miris sveže pečenog hleba.";
  else if (restoran === "Kafić") stilPisanja = "Lagan, prijatan, neobavezan ton. Savršen balans za doručak ili brzu pauzu.";
  else if (restoran === "Poslastičarnica") stilPisanja = "Sladak, opisan, magičan ton. Fokusiraj se na kremastu teksturu i čokoladne note.";
  else if (restoran === "Bar/Koktel bar") stilPisanja = "Ton je noćni i šik. Istakni kako se jelo savršeno uklapa uz piće ili koktel.";
  else if (restoran === "Steakhouse") stilPisanja = "Moćan i mesni ton. Naglasi mramorisanost mesa, odležavanje i usijani roštilj.";
  else if (restoran === "Hotelski restoran") stilPisanja = "Maksimalno luksuzan, diplomatski i otmen stil za goste visoke klase.";
  else if (restoran === "Meksički") stilPisanja = "Vatren i dinamičan ton. Istakni korijander, limetu, gvakamole i pikantnost.";
  else if (restoran === "Moderni fjužn") stilPisanja = "Kreativan i avangardan stil. Naglasi hrabar spoj nespojivih kultura na tanjiru.";
  else if (restoran === "Vegan/Vegetarijanski") stilPisanja = "Fokus je na čistoti, zdravlju, prirodi, organskom poreklu i održivosti biljaka.";

  const prompt = `Ti si Vlada, profesionalni kuvar sa 24 godine iskustva. Kreiraj primamljiv opis jela za meni.
  Naziv: ${jelo}
  Kuhinja: ${restoran}
  Sastojci: ${sastojci}
  Stil: ${stilPisanja}
  Vrati SAMO gotov opis jela, bez ikakvog uvoda ili odjave.`;

  try {
    // Pozivamo DeepSeek preko njihovog zvaničnog zamenskog API-ja koji ne blokira Vercel
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY || 'sk-7f035e02050b4bd38cd319a5a4703917'}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "Ti si vrhunski svetski gastronomski pisac." },
          { role: "user", content: prompt }
        ],
        temperature: kreativnost === 'visoka' ? 0.9 : 0.6,
        max_tokens: 600
      })
    });

    const data = await response.json();
    
    if (data.choices && data.choices.length > 0) {
      const opisJela = data.choices[0].message.content.trim();
      return res.status(200).json({ success: true, opis: opisJela });
    } else {
      return res.status(200).json({ success: false, error: "DeepSeek trenutno ne odgovara." });
    }

  } catch (error) {
    // Sprečavamo iskakanje sistemskog prozora i vraćamo grešku kulturno u aplikaciju
    return res.status(200).json({ success: false, error: "Greška na serveru: " + error.message });
  }
}
