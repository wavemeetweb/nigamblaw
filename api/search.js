// api/search.js – fetches from SearXNG and splits into web/video/image
export default async function handler(req, res) {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Missing ?q=' });

  try {
    // Use a public SearXNG instance (you can change this to any searx server)
    const searxUrl = `https://searx.be/search?q=${encodeURIComponent(q)}&format=json&categories=general,videos,images&language=auto`;
    const response = await fetch(searxUrl, {
      headers: { 'User-Agent': 'CyberBrowser/1.0' }
    });
    const data = await response.json();

    // Split results by category
    const web = [];
    const videos = [];
    const images = [];

    (data.results || []).forEach(result => {
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

    res.status(200).json({ results: { web, videos, images } });
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
}
