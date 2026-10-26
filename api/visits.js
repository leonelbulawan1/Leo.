module.exports = async (req, res) => {
  try {
    const r = await fetch('https://leonelbulawan.goatcounter.com/counter/TOTAL.json', { headers: { 'Accept': 'application/json' } });
    const text = await r.text();
    if (!r.ok) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(502).json({ error: 'GoatCounter returned ' + r.status, detail: text.slice(0, 200) });
    }
    const data = JSON.parse(text);
    const count = parseInt(String(data.count || '0').replace(/[^0-9]/g, ''), 10) || 0;
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({ count });
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).json({ error: 'Could not reach GoatCounter', detail: String(e && e.message || e) });
  }
};
