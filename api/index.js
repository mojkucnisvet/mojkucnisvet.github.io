export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const modul = req.query?.modul || req.body?.modul || 'meni';

  try {
    let result;

    switch (modul) {
      case 'meni':
        result = await handleMeniInzenjer(req.body);
        break;
      case 'kalkulator':
        result = await handleKalkulator(req.body);
        break;
      case 'sparivac':
        result = await handleSparivac(req.body);
        break;
      case 'dnevni-meni':
        result = await handleDnevniMeni(req.body);
        break;
      case 'alergeni':
        result = await handleAlergeni(req.body);
        break;
      case 'ab-test':
        result = await handleABTest(req.body);
        break;
      case 'pdv-marza':
        result = await handlePDVMarza(req.body);
        break;
      case 'cenovna-strategija':
        result = await handleCenovnaStrategija(req.body);
        break;
      case 'wolt-opisi':
        result = await handleWoltOpisi(req.body);
        break;
      case 'generator-naziva':
        result = await handleGeneratorNaziva(req.body);
        break;
      case 'opisi-za-konobare':
        result = await handleOpisiZaKonobare(req.body);
        break;
      case 'vizual':
        result = await handleVizual(req.body);
        break;
      case 'agent':
        result = await handleAgent(req.body);
        break;
        case 'knjiga-normativa':
        result = await handleKnjigaNormativa(req.body);
        break;
      default:
        return res.status(400).json({ error: 'Nepoznat modul: ' + modul });
    }

    return res.status(200).json(result);

  } catch (error) {
    return res.status(500).json({ error: 'Greška: ' + error.message });
  }
}

// ========== HANDLERI ==========

async function callDeepSeek(prompt, temp = 0.7, tokens = 500) {
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer sk-7f035e02050b4bd38cd319a5a4703917' },
    body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: prompt }], temperature: temp, max_tokens: tokens })
  });
  const data = await response.json();
  if (!data.choices || data.choices.length === 0) throw new Error('AI nije vratio odgovor.');
  let raw = data.choices[0].message.content.trim();
  raw = raw.replace(/```json/g, '').replace(/```/g, '').trim();
  try { return JSON.parse(raw); } catch (e) { return { opis: raw }; }
}

async function handleMeniInzenjer(body) {
  const { jelo, restoran, sastojci, kreativnost } = body || {};
  if (!jelo && !sastojci) throw new Error('Unesite naziv jela ili sastojke.');
  const nivo = parseInt(kreativnost) || 2;
  let pravila = '', temp = 0.7;
  if (nivo === 1) { pravila = 'KRATAK opis. Maks 10 reči.'; temp = 0.3; }
  else if (nivo === 2) { pravila = 'PRIMAMLJIV opis. Maks 20 reči. Koristi senzualne reči.'; temp = 0.7; }
  else { pravila = 'EKSPRESIVAN i ATMOSFERIČAN opis. Maks 25 reči.'; temp = 0.9; }
  let prompt;
  if (!jelo && sastojci) {
    prompt = `Na osnovu ovih sastojaka: "${sastojci}", odredi koje je jelo u pitanju i vrati JSON: {"detected_jelo":"IME","opis":"OPIS"}. ${pravila} Vrsta restorana: ${restoran || 'tradicionalni'}.`;
  } else {
    prompt = `Napiši opis za jelo "${jelo || 'nepoznato'}". ${pravila} Vrsta restorana: ${restoran || 'tradicionalni'}. Vrati SAMO opis.`;
  }
  return await callDeepSeek(prompt, temp, nivo === 1 ? 80 : nivo === 3 ? 180 : 140);
}

async function handleKalkulator(body) {
  const { namirnice, radnici, troskovi, nepredvidjeni, pdv, ambalaza, dostavaProcenat, dostavaFiksno, porcije, valuta } = body || {};
  if (!porcije || porcije <= 0) throw new Error('Unesite broj porcija.');
  let ukupnoNamirnice = 0;
  if (namirnice) namirnice.forEach(n => ukupnoNamirnice += (parseFloat(n.kolicina)||0)/1000 * (parseFloat(n.cenaPoKg)||0));
  let ukupnoPlate = 0; if (radnici) radnici.forEach(r => ukupnoPlate += parseFloat(r.plata)||0);
  let ukupniTroskovi = 0; if (troskovi) troskovi.forEach(t => ukupniTroskovi += parseFloat(t.iznos)||0);
  let ukupnoNepredvidjeni = 0; if (nepredvidjeni) nepredvidjeni.forEach(n => ukupnoNepredvidjeni += parseFloat(n.iznos)||0);
  const mesecni = ukupnoPlate + ukupniTroskovi + ukupnoNepredvidjeni;
  const trosakPoPorciji = mesecni / porcije;
  const amb = parseFloat(ambalaza) || 0;
  const cenaKostanja = ukupnoNamirnice + trosakPoPorciji + amb;
  const marza150 = cenaKostanja * 2.5, marza200 = cenaKostanja * 3, marza250 = cenaKostanja * 3.5;
  const dp = parseFloat(dostavaProcenat)||0, df = parseFloat(dostavaFiksno)||0;
  const sd150 = marza150*(1+dp/100)+df, sd200 = marza200*(1+dp/100)+df, sd250 = marza250*(1+dp/100)+df;
  const pp = parseFloat(pdv)||0;
  const c150 = sd150*(1+pp/100), c200 = sd200*(1+pp/100), c250 = sd250*(1+pp/100);
  const z150 = c150-cenaKostanja, z200 = c200-cenaKostanja, z250 = c250-cenaKostanja;
  const pokrice = mesecni > 0 && z200 > 0 ? Math.ceil(mesecni/z200) : 0;
  const kurs = valuta === 'RSD' ? 117 : 1;
  const s = valuta === 'RSD' ? ' RSD' : ' €';
  return {
    cenaKostanja: (cenaKostanja*kurs).toFixed(2), cena150: (c150*kurs).toFixed(2), cena200: (c200*kurs).toFixed(2),
    cena250: (c250*kurs).toFixed(2), zarada150: (z150*kurs).toFixed(2), zarada200: (z200*kurs).toFixed(2),
    zarada250: (z250*kurs).toFixed(2), tackaPokrica: pokrice, ukupniMesecniTrosak: (mesecni*kurs).toFixed(2), simbol: s
  };
}

async function handleSparivac(body) {
  const { jelo, sastojci, tipPica, listaPica } = body || {};
  if (!jelo) throw new Error('Unesite naziv jela.');
  let inst = '';
  if (listaPica && listaPica.length > 0) inst = `Restoran ima OVU listu pića: ${listaPica.join(', ')}. Izaberi 1-2 pića iz ove liste koja se NAJBOLJE slažu.`;
  const prompt = `Profesionalni somelijer. Jelo: "${jelo}". ${inst} Vrati JSON: {"preporuke":[{"pice":"Naziv","zasto":"Objašnjenje","temperatura":"Temp","opisZaKonobara":"Rečenica","cena":"Cena u RSD"}]}. Daj 1-2 preporuke.`;
  return await callDeepSeek(prompt, 0.7, 400);
}

async function handleDnevniMeni(body) {
  const { restoran, brojJela, budzet, zahtevi } = body || {};
  if (!restoran) throw new Error('Odaberite vrstu restorana.');
  const broj = parseInt(brojJela) || 4;
  const kat = broj===3?'predjelo,glavno,desert':broj===4?'predjelo,supa,glavno,desert':broj===5?'predjelo,supa,glavno,desert,piće':'predjelo,supa,glavno,salata,desert,piće';
  const bi = budzet ? `UKUPNA CENA MORA BITI DO ${budzet} RSD. Zbir NE SME preći ${budzet}.` : 'Cene realne za Srbiju.';
  const prompt = `Kreiraj DNEVNI MENI. Vrsta: ${restoran}. Kategorije: ${kat}. ${bi} Zahtevi: ${zahtevi||'nema'}. Vrati JSON: {"meni":[{"kategorija":"...","jelo":"...","opis":"Kratak opis","cena":"Cena u RSD"}],"ukupno":"Ukupno RSD","napomena":"Kratka napomena"}`;
  return await callDeepSeek(prompt, 0.6, 600);
}

async function handleAlergeni(body) {
  const { jelo, sastojci } = body || {};
  if (!jelo || !sastojci) throw new Error('Unesite jelo i sastojke.');
  const prompt = `Analiziraj jelo "${jelo}". Sastojci: ${sastojci}. Vrati JSON: {"alergeni":[{"naziv":"...","prisutan":true/false,"sastojak":"..."}],"nutritivneVrednosti":{"kalorije":"...","proteini":"...","masti":"...","ugljeniHidrati":"..."},"oznaka":"Kratka oznaka"}. Proveri 11 alergena.`;
  return await callDeepSeek(prompt, 0.2, 500);
}

async function handleABTest(body) {
  const { jelo, opisA, opisB } = body || {};
  if (!jelo || !opisA || !opisB) throw new Error('Unesite oba opisa.');
  const prompt = `Uporedi dve verzije opisa za "${jelo}". A: "${opisA}" B: "${opisB}". Vrati JSON: {"pobednik":"A/B","procenat":"...","zasto":"...","savet":"...","uticaj":"..."}`;
  return await callDeepSeek(prompt, 0.5, 400);
}

async function handlePDVMarza(body) {
  const { nabavnaCena, cenaSadrziPDV, marza, pdvStopa } = body || {};
  if (!nabavnaCena || !marza) throw new Error('Unesite nabavnu cenu i maržu.');
  const n = parseFloat(nabavnaCena), mp = parseFloat(marza), pp = parseFloat(pdvStopa)||20;
  const osnovica = cenaSadrziPDV ? n/(1+pp/100) : n;
  const bezPDV = osnovica*(1+mp/100), pdvIznos = bezPDV*(pp/100), konacna = bezPDV+pdvIznos, profit = konacna-n;
  return { osnovica:osnovica.toFixed(2), prodajnaBezPDV:bezPDV.toFixed(2), pdvIznos:pdvIznos.toFixed(2), konacnaCena:konacna.toFixed(2), profit:profit.toFixed(2), marzaProcenat:mp, pdvProcenat:pp };
}

async function handleCenovnaStrategija(body) {
  const { naziv, cena, kategorija, zvezdice, dodatno } = body || {};
  if (!cena) throw new Error('Unesite prodajnu cenu.');
  const zm = {'1':'Brza hrana','2':'Kafana','3':'Restoran srednje klase','4':'Premium','5':'Lux'};
  const prompt = `Ekspert za psihologiju cena. Jelo: ${naziv||'Nepoznato'}. Cena: ${cena}. Kat: ${kategorija||'?'}. Nivo: ${zm[zvezdice]||'?'}. ${dodatno||''}. Vrati JSON: {"predlozi":[{"cena":"...","strategija":"...","zasto":"..."}],"savet":"...","objasnjenje":"..."}. Varijacije ±20%.`;
  return await callDeepSeek(prompt, 0.7, 500);
}

async function handleWoltOpisi(body) {
  const { jelo, sastojci, velicina } = body || {};
  if (!jelo) throw new Error('Unesite naziv jela.');
  const prompt = `Copywriter za Wolt/Glovo. Jelo: ${jelo}. Sastojci: ${sastojci||'Nema'}. Veličina: ${velicina||'Nema'}. Vrati JSON: {"opis":"Kratak opis max 15 reči","velicinaPorcije":"...","alergeni":"..."}`;
  return await callDeepSeek(prompt, 0.7, 300);
}

async function handleGeneratorNaziva(body) {
  const { sastojci, restoran, stil, dodatno } = body || {};
  if (!sastojci) throw new Error('Unesite sastojke.');
  const prompt = `Kreativni direktor. Sastojci: ${sastojci}. Vrsta: ${restoran||'?'}. Stil: ${stil||'Kreativan'}. ${dodatno||''}. Vrati JSON: {"predlozi":[{"naziv":"...","stil":"...","zasto":"..."}],"preporuka":"..."}`;
  return await callDeepSeek(prompt, 0.9, 500);
}

async function handleOpisiZaKonobare(body) {
  const { jelo, opis, tip, kontekst } = body || {};
  if (!jelo) throw new Error('Unesite naziv jela.');
  const prompt = `Trener prodaje. ${tip||'Konobar'} preporučuje "${jelo}". Opis: ${opis||'Nema'}. Kontekst: ${kontekst||'Standardno'}. Vrati JSON: {"recenice":[{"situacija":"...","recenica":"..."}],"savet":"..."}`;
  return await callDeepSeek(prompt, 0.8, 500);
}

async function handleVizual(body) {
  const { tekst, imageBase64 } = body || {};
  let meniTekst = tekst;
  if (imageBase64 && !tekst) {
    const ocr = await fetch('https://vision.googleapis.com/v1/images:annotate?key=AIzaSyD8AjfFweKkZsj1eKqdJ1UQBHT__klS5AE', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({requests:[{image:{content:imageBase64},features:[{type:'TEXT_DETECTION'}]}]})
    });
    const d = await ocr.json();
    if (d.responses?.[0]?.fullTextAnnotation) meniTekst = d.responses[0].fullTextAnnotation.text;
    else throw new Error('Nije uspelo čitanje sa slike.');
  }
  if (!meniTekst) throw new Error('Unesite tekst menija.');
  const prompt = `Unapredi meni: ${meniTekst}. Vrati JSON: {"meni":[{"jelo":"...","opis":"Novi opis","cena":"Cena u RSD"}],"napomena":"..."}`;
  return await callDeepSeek(prompt, 0.7, 500);
}
async function handleKnjigaNormativa(body) {
  const { jelo, sastojci, ukupneKolicine, rezim } = body || {};

  if (!jelo) throw new Error('Unesite naziv jela.');

  if (rezim === 'lonac' && ukupneKolicine) {
    const prompt = `Ti si ekspert za normative u ugostiteljstvu. Kuvar je skuvao "${jelo}" i stavio sledece ukupne kolicine u lonac: ${ukupneKolicine}. Izracunaj koliko porcija moze da se dobije, i koliko ide svake namirnice PO JEDNOJ PORCIJI. Vrati SAMO cist JSON: {"brojPorcija": "13-15", "normativ":[{"namirnica":"...","kolicinaPoPorciji":"...","jedinica":"g/ml/kom"}]}`;
    const r = await fetch('https://api.deepseek.com/v1/chat/completions', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer sk-7f035e02050b4bd38cd319a5a4703917'},body:JSON.stringify({model:'deepseek-chat',messages:[{role:'user',content:prompt}],temperature:0.5,max_tokens:600})});
    const d = await r.json();
    if (!d.choices?.length) throw new Error('AI nije vratio odgovor.');
    let raw = d.choices[0].message.content.trim();
    raw = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    try { return JSON.parse(raw); } catch (e) { return { brojPorcija: 'Nije izracunato', normativ: [] }; }
  }

  if (!sastojci) throw new Error('Unesite sastojke.');

  const prompt = `Ti si ekspert za normative u ugostiteljstvu. Za jelo "${jelo}" sa ovim sastojcima: ${sastojci}, napisi normativ za JEDNU PORCIJU. Vrati SAMO cist JSON: {"normativ":[{"namirnica":"...","kolicinaPoPorciji":"...","jedinica":"g/ml/kom"}]}. Kolicine neka budu realne za ugostiteljstvo u Srbiji.`;
  const r = await fetch('https://api.deepseek.com/v1/chat/completions', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer sk-7f035e02050b4bd38cd319a5a4703917'},body:JSON.stringify({model:'deepseek-chat',messages:[{role:'user',content:prompt}],temperature:0.5,max_tokens:600})});
  const d = await r.json();
  if (!d.choices?.length) throw new Error('AI nije vratio odgovor.');
  let raw = d.choices[0].message.content.trim();
  raw = raw.replace(/```json/g, '').replace(/```/g, '').trim();
  try { return JSON.parse(raw); } catch (e) { return { normativ: [] }; }
}
async function handleAgent(body) {
  const { poruka } = body || {};
  if (!poruka) throw new Error('Unesite poruku.');
  const prompt = `Ugostiteljski AI Agent. Tvorac: Vlada, kuvar sa 24 god iskustva. Pomaže sa menijima, cenama, nabavkom, osobljem, alergenima, marketingom. Pitanje: ${poruka}. Odgovori kratko i korisno.`;
  const r = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST', headers: {'Content-Type':'application/json', 'Authorization':'Bearer sk-7f035e02050b4bd38cd319a5a4703917'},
    body: JSON.stringify({model:'deepseek-chat',messages:[{role:'user',content:prompt}],temperature:0.7,max_tokens:800})
  });
  const d = await r.json();
  if (!d.choices?.length) throw new Error('AI nije vratio odgovor.');
  return { odgovor: d.choices[0].message.content.trim() };
}
