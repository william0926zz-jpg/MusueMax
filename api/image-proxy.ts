export const config = {
  maxDuration: 30,
};

export default async function handler(req: any, res: any) {
  const rawUrl = typeof req.query?.url === 'string' ? req.query.url : '';
  if (!rawUrl) {
    res.status(400).json({ error: 'Missing image url' });
    return;
  }

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    res.status(400).json({ error: 'Invalid image url' });
    return;
  }

  const allowedHosts = [
    'collections.louvre.fr',
    'iiif.micr.io',
    'www.rijksmuseum.nl',
    'images.rijksmuseum.nl',
    'lh3.googleusercontent.com',
    'upload.wikimedia.org',
  ];

  if (!allowedHosts.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))) {
    res.status(403).json({ error: 'Image host is not allowed' });
    return;
  }

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'User-Agent': 'Museumax/1.0 (+https://github.com/william0926zz-jpg/MusueMax)',
      },
    });

    if (!response.ok || !response.body) {
      res.status(502).json({ error: 'Image upstream unavailable' });
      return;
    }

    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg');
    const buffer = Buffer.from(await response.arrayBuffer());
    res.status(200).send(buffer);
  } catch {
    res.status(502).json({ error: 'Image proxy failed' });
  }
}
