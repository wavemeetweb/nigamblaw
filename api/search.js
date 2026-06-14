// api/search.js – uses SearXNG instances that allow Vercel requests
export default async function handler(req, res) {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Missing ?q=' });

  // Instances that are known to work from serverless platforms (May 2025)
  const instances = [
    'https://search.bus-hit.me',   // currently working
    'https://search.inetol.net',   // good uptime, allows cloud IPs
    'https://searx.rocks',         // usually friendly
    'https://search.sapti.me'      // fallback
  ];

  for (const baseUrl of instances) {
    try {
      const searxUrl = `${baseUrl}/search?q=${encodeURIComponent(q)}&format=json&categories=general,videos,images&language=auto`;
      const response = await fetch(searxUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }

      const data = await response.json();
      if (!data.results) continue;

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

      if (web.length > 0 || videos.length > 0 || images.length > 0) {
        return res.status(200).json({ results: { web, videos, images } });
      }
    } catch (err) {
      // last instance → report the error
      if (baseUrl === instances[instances.length - 1]) {
        return res.status(500).json({ error: `All instances failed. Last error: ${err.message}` });
      }
    }
  }

  return res.status(500).json({ error: 'Search failed – no SearXNG instance available' });
}
