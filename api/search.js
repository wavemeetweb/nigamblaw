// api/search.js – uses reliable public SearXNG instances
export default async function handler(req, res) {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Missing ?q=' });

  // Try these instances in order (you can add more from https://searx.space)
  const instances = [
    'https://search.sapti.me',
    'https://searx.tiekoetter.com',
    'https://searx.be'
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
        throw new Error(`Server responded with status ${response.status}`);
      }

      const data = await response.json();

      if (!data.results) {
        throw new Error('No results array in response');
      }

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
      // If this is the last instance, return the error so you can see it
      if (baseUrl === instances[instances.length - 1]) {
        return res.status(500).json({ error: `All instances failed. Last error: ${err.message}` });
      }
      // Otherwise, try the next instance
      continue;
    }
  }

  return res.status(500).json({ error: 'Search failed – no SearXNG instance available' });
}
