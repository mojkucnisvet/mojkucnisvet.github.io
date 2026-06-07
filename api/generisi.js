export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const jelo = req.query.jelo || req.body?.jelo || '';
  const restoran = req.query.restoran || req.body?.restoran || 'Nacionalni/Tradicionalni';
  const sastojci = req.query.sastojci || req.body?.sastojci || '';
  const kreativnost = req.query.kreativnost || req.body?.kreativnost || 'visoka';

  // Validacija: Korisnik mora uneti ILI naziv jela ILI sastojke
  if (!jelo && !sastojci) {
    return res.status(200).json({ success: false, error: "Molimo unesi naziv jela ili barem ključne sastojke." });
  }

  // 1. DEFINISANJE DUŽINE NA OSNOVU IZBORA KORISNIKA
  let praviloDuzine = "";
  if (kreativnost === "ekonomičan") {
    praviloDuzine = "Opis mora biti KRATAK, DIREKTAN i KONCISAN za štampani meni. Maksimalno 15 do 25 reči (2-3 kratke linije teksta).";
  } else if (kreativnost === "standardan") {
    praviloDuzine = "Opis treba da bude umerene dužine, balansiran i privlačan. Oko 30 do 40 reči.";
  } else {
    praviloDuzine = "Opis može biti bogatiji, ekspresivan i gurmanski sofisticiran. Maksimalno 50 reči.";
  }

  // 2. STIL ZA VRSTE RESTORANA
  let stilPisanja = "Domaćinski ton, duh tradicije, ukus bakine kuhinje.";
  if (restoran === "Italijanski") stilPisanja = "Mediteranska svežina, lagani tonovi, reči poput al dente, svilenkasti sos, maslinovo ulje.";
  else if (restoran === "Francuski") stilPisanja = "Prefinjen, sofisticiran, luksuzan i gastronomski tačan ton.";
  else if (restoran === "Grčki/Mediteranski") stilPisanja = "Miris mora, limuna, maslinovog ulja i sunčanih ukusa.";
  else if (restoran === "Picerija") stilPisanja = "Naglasi hrskavost tankog testa, miris šamota iz kamene peći i topljenje sira.";
  else if (restoran === "Japanski/Sushi") stilPisanja = "Minimalistički, čist, elegantan ton. Fokus na svežinu i preciznost.";
  else if (restoran === "Kineski") stilPisanja = "Dinamika voka, balans slatko-kiselog sosa i umami efekat.";
  else if (restoran === "Street & Fast Food") stilPisanja = "Urban, moderan, opušten stil. Naglasi sočnost i bogate sosove.";
  else if (restoran === "Steakhouse") stilPisanja = "Moćan, mesni ton. Mramorisanost, odležavanje, vreli roštilj.";
  else if (restoran === "Vegan/Vegetarijanski") stilPisanja = "Svežina prirode, hranljivost, organsko poreklo i čisti biljni ukusi.";

  // 3. KREIRANJE SPECIFIČNOG PROMPTA AKO NAZIV JELA FALI
  let instrukcijaZadatka = "";
  if (!jelo && sastojci) {
    instrukcijaZadatka = `Korisnik NIJE uneo naziv jela, već samo listu namirnica: "${sastojci}".
    Tvoj zadatak je da na osnovu ovih namirnica zaključiš koje je to jelo. 
    Odgovor MORA biti u sledećem formatu (i nikako drugačije!):
    Naziv jela: [Ovde upiši prepoznati komercijalni naziv jela]
    Opis: [Ovde napiši opis jela prateći stilska pravila ispod]`;
  } else {
    instrukcijaZadatka = `Korisnik je uneo naziv jela: "${jelo}" i sastojke: "${sastojci}".
    Napiši profesionalni opis za to jelo. Odgovor vrati direktno kao čist tekst opisa, bez ikakvih naslova ili uvodnih reči.`;
  }

  const prompt = `Ti si Vlada, profesionalni kuvar sa 24 godine iskustva i vrhunski Meni Inženjer.
  Radiš u kontekstu sledeće kuhinje: ${restoran}.
  
  ${instrukcijaZadatka}
  
  Stroga pravila za pisanje opisa:
  1. ${praviloDuzine}
  2. Stil pisanja: ${stilPisanja}
  3. Tekst mora biti na srpskom jeziku, privlačan za goste restorana i spreman za štampu.`;

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY || 'sk-7f035e02050b4bd38cd319a5a4703917'}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "Ti si profesionalni kulinarski AI sistem koji precizno prepoznaje jela na osnovu namirnica i piše vrhunske opise za jelovnike." },
          { role: "user", content: prompt }
        ],
        temperature: kreativnost === 'visoka' ? 0.7 : 0.4,
        max_tokens: 250
      })
    });

    const data = await response.json();
    
    if (data.choices && data.choices.length > 0) {
      const odgovor AI = data.choices[0].message.content.trim();
      return res.status(200).json({ success: true, opis: odgovorAI });
    } else {
      return res.status(200).json({ success: false, error: "DeepSeek trenutno ne odgovara." });
    }

  } catch (error) {
    return res.status(200).json({ success: false, error: "Greška na serveru: " + error.message });
  }
}
