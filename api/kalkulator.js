export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Samo POST zahtevi.' });

  try {
    const { namirnice, radnici, troskovi, nepredvidjeni, pdv, ambalaza, dostava, porcije } = req.body || {};

    if (!porcije || porcije <= 0) {
      return res.status(400).json({ error: 'Unesite broj porcija mesečno.' });
    }

    // 1. Namirnice po porciji
    let ukupnoNamirnice = 0;
    if (namirnice && Array.isArray(namirnice)) {
      namirnice.forEach(n => {
        const kolicina = parseFloat(n.kolicina) || 0;
        const cenaPoKg = parseFloat(n.cenaPoKg) || 0;
        ukupnoNamirnice += (kolicina / 1000) * cenaPoKg;
      });
    }

    // 2. Plate radnika mesečno
    let ukupnoPlate = 0;
    if (radnici && Array.isArray(radnici)) {
      radnici.forEach(r => {
        ukupnoPlate += parseFloat(r.plata) || 0;
      });
    }

    // 3. Mesečni troškovi
    let ukupniTroskovi = 0;
    if (troskovi && Array.isArray(troskovi)) {
      troskovi.forEach(t => {
        ukupniTroskovi += parseFloat(t.iznos) || 0;
      });
    }

    // 4. Nepredviđeni troškovi
    let ukupnoNepredvidjeni = 0;
    if (nepredvidjeni && Array.isArray(nepredvidjeni)) {
      nepredvidjeni.forEach(n => {
        ukupnoNepredvidjeni += parseFloat(n.iznos) || 0;
      });
    }

    const ukupniMesecniTrosak = ukupnoPlate + ukupniTroskovi + ukupnoNepredvidjeni;
    const trosakPoPorciji = ukupniMesecniTrosak / porcije;
    const ambalazaPoPorciji = parseFloat(ambalaza) || 0;
    const cenaKostanja = ukupnoNamirnice + trosakPoPorciji + ambalazaPoPorciji;

    // Marže
    const marza150 = cenaKostanja * 2.5;
    const marza200 = cenaKostanja * 3;
    const marza250 = cenaKostanja * 3.5;

    // Dostava
    const dostavaProcenat = parseFloat(dostava) || 0;
    const saDostavom150 = marza150 * (1 + dostavaProcenat / 100);
    const saDostavom200 = marza200 * (1 + dostavaProcenat / 100);
    const saDostavom250 = marza250 * (1 + dostavaProcenat / 100);

    // PDV
    const pdvProcenat = parseFloat(pdv) || 0;
    const cena150 = saDostavom150 * (1 + pdvProcenat / 100);
    const cena200 = saDostavom200 * (1 + pdvProcenat / 100);
    const cena250 = saDostavom250 * (1 + pdvProcenat / 100);

    // Zarada
    const zarada150 = cena150 - cenaKostanja;
    const zarada200 = cena200 - cenaKostanja;
    const zarada250 = cena250 - cenaKostanja;

    // Tačka pokrića
    const tackaPokrica = ukupniMesecniTrosak > 0 && zarada200 > 0
      ? Math.ceil(ukupniMesecniTrosak / zarada200)
      : 0;

    return res.status(200).json({
      cenaKostanja: cenaKostanja.toFixed(2),
      cena150: cena150.toFixed(2),
      cena200: cena200.toFixed(2),
      cena250: cena250.toFixed(2),
      zarada150: zarada150.toFixed(2),
      zarada200: zarada200.toFixed(2),
      zarada250: zarada250.toFixed(2),
      tackaPokrica,
      ukupniMesecniTrosak: ukupniMesecniTrosak.toFixed(2)
    });

  } catch (error) {
    return res.status(500).json({ error: 'Greška: ' + error.message });
  }
}
