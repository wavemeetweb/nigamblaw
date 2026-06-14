// api/search.js – uses reliable public SearXNG instances
export default async function handler(req, res) {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Missing ?q=' });

  // List of public SearXNG servers (you can add more from https://searx.space)
  const instances = [
    'https://search.sapti.me',
    'https://searx.tiekoetter.com',
    'https://searx.be'
  ];

  for (const baseUrl of instances) {
    try {
      const searxUrl = `${baseUrl}/search?q=${encodeURIComponent(q)}&format=json&categories=general,videos,images&language=auto`;
      const response = await fetch(searxUrl, {
        headers: { 'User-Agent': 'CyberBrowser/1.0' }
      });
      const data = await response.json();

      if (!data.results) continue;   // some instances may not return results for certain queries

      // Split results by category
      const web = [];
      const videos = [];
      const images = [];

      data.results.forEach(result => {
        if (result.category === 'videos') {
          videos.push({
            title: result.title,
            url: result.url,
            thumbnail: result.thumbnail || '',
            duration: result.duration || ''
          });
        } else if (result.category === 'images') {
          images.push({
            title: result.title,
            url: result.url,
            thumbnail: result.thumbnail || '',
            source: result.source || result.img_src || ''
          });
        } else {
          web.push({
            title: result.title,
            url: result.url,
            description: result.content || ''
          });
        }
      });

      // If we got at least some results, return them
      if (web.length > 0 || videos.length > 0 || images.length > 0) {
        return res.status(200).json({ results: { web, videos, images } });
      }
    } catch (err) {
      console.error(`Instance ${baseUrl} failed:`, err.message);
      // continue to next instance
    }
  }

  // All instances failed
  return res.status(500).json({ error: 'Search failed – no SearXNG instance available' });
}
