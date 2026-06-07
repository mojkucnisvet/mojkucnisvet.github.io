export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const jelo = req.query.jelo || req.body?.jelo;
  const restoran = req.query.restoran || req.body?.restoran || 'Nacionalni/Tradicionalni';
  const sastojci = req.query.sastojci || req.body?.sastojci || 'standardni sastojci';
  const kreativnost = req.query.kreativnost || req.body?.kreativnost || 'visoka';

  if (!jelo) {
    return res.status(200).json({ success: false, error: "Molimo unesi naziv jela." });
  }

  // 1. STROGO DEFINISANJE DUŽINE NA OSNOVU IZBORA KORISNIKA
  let praviloDuzine = "";
  if (kreativnost === "ekonomičan") {
    praviloDuzine = "Opis mora biti KRATAK, DIREKTAN i KONCISAN za klasičan štampani meni. Maksimalno 15 do 25 reči (2-3 kratke linije teksta). Bez preteranog filozofiranja.";
  } else if (kreativnost === "standardan") {
    praviloDuzine = "Opis treba da bude umerene dužine, balansiran i privlačan. Oko 30 do 40 reči. Elegantan ugostiteljski stil.";
  } else {
    praviloDuzine = "Opis može biti malo bogatiji, ekspresivan i gurmanski sofisticiran, ali i dalje pogodan za meni. Maksimalno 50 reči.";
  }

  // 2. STIL ZA 19 VRSTA RESTORANA
  let stilPisanja = "Napiši primamljiv opis jela.";
  if (restoran === "Nacionalni/Tradicionalni") stilPisanja = "Domaćinski ton, duh tradicije, ukus bakine kuhinje.";
  else if (restoran === "Italijanski") stilPisanja = "Mediteranska svežina, lagani tonovi, reči poput al dente, svilenkasti sos, maslinovo ulje.";
  else if (restoran === "Francuski") stilPisanja = "Prefinjen, sofisticiran, luksuzan i gastronomski tačan ton.";
  else if (restoran === "Grčki/Mediteranski") stilPisanja = "Miris mora, limuna, maslinovog ulja i sunčanih ukusa.";
  else if (restoran === "Picerija") stilPisanja = "Naglasi hrskavost tankog testa, miris šamota iz kamene peći i topljenje sira.";
  else if (restoran === "Japanski/Sushi") stilPisanja = "Minimalistički, čist, elegantan ton. Fokus na svežinu i preciznost.";
  else if (restoran === "Kineski") stilPisanja = "Dinamika voka, balans slatko-kiselog sosa i umami efekat.";
  else if (restoran === "Indijski") stilPisanja = "Egzotičan ton, bogatstvo začina, tandoor aromatične note.";
  else if (restoran === "Tajlandski/Vijetnamski") stilPisanja = "Kontrast ukusa: balans slatkog, kiselog i ljutog, đumbir, kokos.";
  else if (restoran === "Street & Fast Food") stilPisanja = "Urban, moderan, opušten stil. Naglasi sočnost i bogate sosove.";
  else if (restoran === "Pekara") stilPisanja = "Toplo pecivo, hrskava korica, miris sveže pečenog testa.";
  else if (restoran === "Kafić") stilPisanja = "Lagan, neobavezan ton doručka ili brze, ukusne pauze.";
  else if (restoran === "Poslastičarnica") stilPisanja = "Sladak, kremast, magičan ton koji mami na dezert.";
  else if (restoran === "Bar/Koktel bar") stilPisanja = "Šik ton, naglasi kako se jelo sjajno uparuje sa pićem ili koktelom.";
  else if (restoran === "Steakhouse") stilPisanja = "Moćan, mesni ton. Mramorisanost, odležavanje, vreli roštilj.";
  else if (restoran === "Hotelski restoran") stilPisanja = "Maksimalno luksuzan, otmen i internacionalni ugostiteljski standard.";
  else if (restoran === "Meksički") stilPisanja = "Vatren, svež i dinamičan ton: limeta, korijander, pikantno.";
  else if (restoran === "Moderni fjužn") stilPisanja = "Hrabar i kreativan spoj različitih kulinarskih kultura na tanjiru.";
  else if (restoran === "Vegan/Vegetarijanski") stilPisanja = "Svežina prirode, hranljivost, organsko poreklo i čisti biljni ukusi.";

  const prompt = `Ti si Vlada, profesionalni kuvar sa 24 godine iskustva i ekspert za pisanje jelovnika. 
  Kreiraj profesionalni opis jela za meni na srpskom jeziku.
  
  Podaci o jelu:
  - Naziv: ${jelo}
  - Vrsta kuhinje: ${restoran}
  - Sastojci: ${sastojci}
  
  Stroga pravila formata:
  1. ${praviloDuzine}
  2. Stil mora biti: ${stilPisanja}
  3. Nemoj stavljati naslov jela u odgovor (korisnik već zna koje je jelo).
  4. Vrati SAMO tekst opisa spreman za štampu, bez ikakvih uvodnih rečenica, navodnika ili objašnjenja.`;

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
          { role: "system", content: "Ti si profesionalni pisac jelovnika za vrhunske restorane koji piše kratke, jasne i komercijalno privlačne opise." },
          { role: "user", content: prompt }
        ],
        temperature: kreativnost === 'visoka' ? 0.8 : (kreativnost === 'standardan' ? 0.6 : 0.3),
        max_tokens: 200
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
    return res.status(200).json({ success: false, error: "Greška na serveru: " + error.message });
  }
}
