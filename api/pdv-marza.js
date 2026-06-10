export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Samo POST zahtevi.' });

  try {
    const { nabavnaCena, cenaSadrziPDV, marza, pdvStopa } = req.body || {};

    if (!nabavnaCena || !marza) {
      return res.status(400).json({ error: 'Unesite nabavnu cenu i maržu.' });
    }

    const nabavna = parseFloat(nabavnaCena);
    const marzaP = parseFloat(marza);
    const pdvP = parseFloat(pdvStopa) || 20;
    const sadrziPDV = cenaSadrziPDV === true;

    // Ako nabavna cena sadrži PDV, izvuci osnovicu
    const osnovica = sadrziPDV ? nabavna / (1 + pdvP / 100) : nabavna;

    // Prodajna cena bez PDV-a
    const prodajnaBezPDV = osnovica * (1 + marzaP / 100);

    // PDV iznos
    const pdvIznos = prodajnaBezPDV * (pdvP / 100);

    // Konačna cena sa PDV-om
    const konacnaCena = prodajnaBezPDV + pdvIznos;

    // Neto profit
    const profit = konacnaCena - nabavna;

    return res.status(200).json({
      osnovica: osnovica.toFixed(2),
      prodajnaBezPDV: prodajnaBezPDV.toFixed(2),
      pdvIznos: pdvIznos.toFixed(2),
      konacnaCena: konacnaCena.toFixed(2),
      profit: profit.toFixed(2),
      marzaProcenat: marzaP,
      pdvProcenat: pdvP
    });

  } catch (error) {
    return res.status(500).json({ error: 'Greška: ' + error.message });
  }
}
