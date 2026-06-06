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
  const restoran = req.query.restoran || req.body?.restoran || 'Nacionalni/Tradicionalni';
  const sastojci = req.query.sastojci || req.body?.sastojci || 'standardni sastojci';
  const kreativnost = req.query.kreativnost || req.body?.kreativnost || 'visoka';

  if (!jelo) {
    return res.status(400).json({ success: false, error: "Parametar 'jelo' je obavezan." });
  }

  // 3. PRILAGOĐAVANJE STILA PISANJA NA OSNOVU VRSTE RESTORANA (19 STILOVA)
  let stilPisanja = "Napiši primamljiv i sočan opis jela.";
  
  if (restoran === "Nacionalni/Tradicionalni") {
    stilPisanja = "Koristi tradicionalan, domaćinski ton. Istakni duh tradicije, domaće ognjište, bakinu kuhinju i autentične lokalne ukuse.";
  } else if (restoran === "Italijanski") {
    stilPisanja = "Koristi italijanske kulinarske izreke ili stil. Fokusiraj se na svežinu, harmoniju mediteranskog bilja, reči poput 'al dente', svilenkasti sos.";
  } else if (restoran === "Francuski") {
    stilPisanja = "Ton mora biti izuzetno prefinjen, klasičan, sofisticiran i luksuzan. Fokusiraj se na teksturu, tehnike kuvanja i vrhunsku estetiku.";
  } else if (restoran === "Grčki/Mediteranski") {
    stilPisanja = "Opis treba da miriše na more, maslinovo ulje, limun i sunce. Ton je svež, lagan i letnji.";
  } else if (restoran === "Picerija") {
    stilPisanja = "Naglasi hrskavost tankog testa, miris šamota iz kamene peći, topljenje prave mocarele i sočnost sosa od paradajza.";
  } else if (restoran === "Japanski/Sushi") {
    stilPisanja = "Stil je minimalistički, čist, elegantan. Naglasi vrhunski kvalitet i svežinu sirovina, preciznost sečenja i balans ukusa.";
  } else if (restoran === "Kineski") {
    stilPisanja = "Istakni dinamiku voka, balans slatko-kiselog sosa, bogatstvo umami ukusa i brzu termičku obradu koja čuva svežinu.";
  } else if (restoran === "Indijski") {
    stilPisanja = "Opis mora biti pun topline i egzotike. Naglasi bogatstvo začina, tandoor peć, raskošne kari sosove i aromatični miris.";
  } else if (restoran === "Tajlandski/Vijetnamski") {
    stilPisanja = "Naglasi kontrast ukusa: balans slatkog, kiselog, slanog i ljutog, svežinu limunove trave, đumbira i bogatstvo kokosovog mleka.";
  } else if (restoran === "Street & Fast Food") {
    stilPisanja = "Ton je urban, moderan, opušten i "street". Fokusiraj se na ekstremnu sočnost, bogate prelive, 'comfort food' efekat koji mami na sledeći zalogaj.";
  } else if (restoran === "Pekara") {
    stilPisanja = "Miriše na rano jutro i toplo pecivo. Istakni hrskavu koricu, lisnato testo, toplu sredinu i miris sveže pečenog hleba.";
  } else if (restoran === "Kafić") {
    stilPisanja = "Lagan, prijatan, neobavezan ton. Savršen balans za doručak, brzu pauzu ili užitak uz šoljicu omiljenog napitka.";
  } else if (restoran === "Poslastičarnica") {
    stilPisanja = "Sladak, opisan, magičan ton. Fokusiraj se na kremastu teksturu, čokoladne note, voćnu svežinu i vrhunski užitak za nepce.";
  } else if (restoran === "Bar/Koktel bar") {
    stilPisanja = "Ton je noćni, šarmantan i šik. Istakni kako se jelo savršeno uklapa uz čašu dobrog vina, kraft pivo ili autentični koktel.";
  } else if (restoran === "Steakhouse") {
    stilPisanja = "Moćan, prefinjen i mesni ton. Naglasi mramorisanost mesa, odležavanje (dry/wet aged), usijani roštilj i vrhunski sočan rez.";
  } else if (restoran === "Hotelski restoran") {
    stilPisanja = "Maksimalno luksuzan, diplomatski i otmen stil. Pisanje za goste visoke klase, naglašavajući internacionalni standard i vrhunsku prezentaciju.";
  } else if (restoran === "Meksički") {
    stilPisanja = "Vatren, šaren i dinamičan ton. Istakni svežinu korijandera, limete, gvakamole sosa i prepoznatljivu meksičku pikantnost.";
  } else if (restoran === "Moderni fjužn") {
    stilPisanja = "Kreativan, avangardan i neočekivan stil. Naglasi hrabar spoj nespojivih kultura i ukusa na jednom tanjiru.";
  } else if (restoran === "Vegan/Vegetarijanski") {
    stilPisanja = "Fokus je na čistoti, zdravlju, svežini i prirodi. Koristi reči koje naglašavaju hranljivost, organsko poreklo i održivost biljnih namirnica.";
  }

  // 4. KREIRANJE PROMPTA ZA AI
  const prompt = `Ti si Vlada, profesionalni kuvar sa 24 godine iskustva i autor AI sistema "Meni Inženjer". 
  Kreiraj profesionalni, primamljivi, prodajni opis jela za meni restorana na srpskom jeziku.
  
  Detalji o jelu:
  - Naziv jela: ${jelo}
  - Vrsta restorana/kuhinje: ${restoran}
  - Ključni sastojci: ${sastojci}
  
  Uputstvo za stil pisanja:
  ${stilPisanja}
  
  Opis mora biti napisan u skladu sa zadatim stilom restorana. Vrati SAMO gotov opis jela, bez ikakvog dodatnog teksta, uvoda (npr. "Evo opisa:"), ili odjavnih rečenica.`;

  try {
    // 5. POZIVANJE DEEPSEEK API-JA
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer sk-7f035e02050b4bd38cd319a5a4703917`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "Ti si vrhunski svetski gastronomski pisac i stručnjak za marketing jelovnika." },
          { role: "user", content: prompt }
        ],
        temperature: kreativnost === 'visoka' ? 0.95 : (kreativnost === 'standardan' ? 0.7 : 0.4),
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
