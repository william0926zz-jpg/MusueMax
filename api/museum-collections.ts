type Artifact = {
  id: string;
  name: string;
  era: string;
  gallery: string;
  summary: string;
  educationTags: string[];
  image: string;
  sourceUrl?: string;
  sourceName?: string;
};

declare const process: {
  env: Record<string, string | undefined>;
};

const DEFAULT_LIMIT = 200;
const FETCH_TIMEOUT = 12000;

export const config = {
  maxDuration: 60,
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const museum = String(req.query?.museum || '').toLowerCase();
  const limit = Math.min(Number(req.query?.limit) || DEFAULT_LIMIT, DEFAULT_LIMIT);

  try {
    const artifacts = await fetchMuseumArtifacts(museum, limit);
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json({ artifacts, count: artifacts.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'collection fetch failed';
    res.status(502).json({ error: message });
  }
}

async function fetchMuseumArtifacts(museum: string, limit: number): Promise<Artifact[]> {
  if (museum === 'van-gogh-museum' || museum === 'vangogh') return fetchVanGoghArtifacts(limit);
  if (museum === 'louvre') return fetchLouvreArtifacts(limit);
  if (museum === 'rijksmuseum') return fetchRijksmuseumArtifacts(limit);
  throw new Error('Unsupported museum');
}

async function fetchVanGoghArtifacts(limit: number): Promise<Artifact[]> {
  const pageSize = 24;
  const pages = Math.ceil(limit / pageSize);
  const pageResults = await Promise.allSettled(
    Array.from({ length: pages }, (_, page) => {
      const url = new URL('https://www.vangoghmuseum.nl/en/collection/search');
      url.searchParams.set('from', String(page * pageSize));
      url.searchParams.set('pageSize', String(pageSize));
      return fetchJson<{ resultsHtml?: string }>(url.toString());
    }),
  );

  return mergeArtifacts(
    pageResults.flatMap((result) => result.status === 'fulfilled' ? parseVanGoghHtml(result.value.resultsHtml || '') : []),
  ).slice(0, limit);
}

async function fetchLouvreArtifacts(limit: number): Promise<Artifact[]> {
  const pages = Math.ceil(limit / 100);
  const pageResults = await Promise.allSettled(
    Array.from({ length: pages }, (_, page) => {
      const url = new URL('https://collections.louvre.fr/en/recherche');
      url.searchParams.set('q', '');
      url.searchParams.set('limit', '100');
      url.searchParams.set('page', String(page + 1));
      return fetchText(url.toString());
    }),
  );
  const searchArtifacts = pageResults.flatMap((result) => result.status === 'fulfilled' ? parseLouvreHtml(result.value) : []);
  const jsonIds = ['cl010062370', ...searchArtifacts.map((artifact) => artifact.id.replace(/^louvre-/, ''))]
    .filter((id, index, ids) => /^cl\d+$/.test(id) && ids.indexOf(id) === index)
    .slice(0, 24);
  const jsonResults = await Promise.allSettled(
    jsonIds.map((id) => fetchJson<any>(`https://collections.louvre.fr/ark:/53355/${id}.json`)),
  );
  const jsonArtifacts = jsonResults.flatMap((result, index) => result.status === 'fulfilled' ? [mapLouvreJson(result.value, index)] : []);

  return mergeArtifacts(jsonArtifacts, searchArtifacts).slice(0, limit);
}

async function fetchRijksmuseumArtifacts(limit: number): Promise<Artifact[]> {
  const officialApiArtifacts = await fetchRijksmuseumApiArtifacts(limit).catch(() => []);
  const wikidataArtifacts = await fetchWikidataMuseumArtifacts('Q190804', limit).catch(() => []);
  return mergeArtifacts(officialApiArtifacts, wikidataArtifacts).slice(0, limit);
}

async function fetchRijksmuseumApiArtifacts(limit: number): Promise<Artifact[]> {
  const apiKey = process.env.RIJKSMUSEUM_API_KEY || process.env.VITE_RIJKSMUSEUM_API_KEY || '';
  if (!apiKey) return [];

  const url = new URL('https://www.rijksmuseum.nl/api/en/collection');
  url.searchParams.set('key', apiKey);
  url.searchParams.set('ps', String(Math.min(limit, 100)));
  url.searchParams.set('p', '1');
  url.searchParams.set('imgonly', 'True');

  const payload = await fetchJson<{ artObjects?: any[] }>(url.toString());
  return (payload.artObjects || [])
    .map((object, index) => ({
      id: `rijks-${object.objectNumber || index}`,
      name: cleanText(object.title || `Rijksmuseum item ${index + 1}`),
      era: object.longTitle?.match(/\b\d{3,4}\b/)?.[0] || '年代待确认',
      gallery: 'Rijksmuseum Collection',
      summary: cleanText(object.longTitle || '来自 Rijksmuseum 官方 Collection API 的藏品。'),
      educationTags: inferTags(object.title || '', object.longTitle || ''),
      image: proxyImage(object.webImage?.url || object.headerImage?.url || ''),
      sourceUrl: object.links?.web || `https://www.rijksmuseum.nl/en/collection/${object.objectNumber || ''}`,
      sourceName: 'Rijksmuseum Collection API',
    }))
    .filter((artifact) => artifact.name && artifact.image);
}

async function fetchWikidataMuseumArtifacts(museumWikidataId: string, limit: number): Promise<Artifact[]> {
  const sparql = `
    SELECT DISTINCT ?item ?itemLabel ?image ?inceptionLabel ?creatorLabel ?materialLabel ?description WHERE {
      VALUES ?museum { wd:${museumWikidataId} }
      { ?item wdt:P195 ?museum. } UNION { ?item wdt:P276 ?museum. } UNION { ?item wdt:P127 ?museum. }
      ?item wdt:P18 ?image.
      OPTIONAL { ?item wdt:P571 ?inception. }
      OPTIONAL { ?item wdt:P170 ?creator. }
      OPTIONAL { ?item wdt:P186 ?material. }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "zh,en". }
      OPTIONAL {
        ?item schema:description ?description.
        FILTER(LANG(?description) = "zh" || LANG(?description) = "en")
      }
    }
    LIMIT ${Math.min(limit, 200)}
  `;
  const url = new URL('https://query.wikidata.org/sparql');
  url.searchParams.set('query', sparql);
  url.searchParams.set('format', 'json');
  const payload = await fetchJson<{ results?: { bindings?: any[] } }>(url.toString(), {
    Accept: 'application/sparql-results+json',
  });

  return (payload.results?.bindings || [])
    .map((binding, index) => {
      const itemId = String(binding.item?.value || '').split('/').pop() || `item-${index}`;
      const title = binding.itemLabel?.value || `Rijksmuseum item ${index + 1}`;
      const creator = binding.creatorLabel?.value;
      const material = binding.materialLabel?.value;
      const description = binding.description?.value;
      return {
        id: `rijks-wikidata-${itemId}`,
        name: cleanText(title),
        era: binding.inceptionLabel?.value || '年代待确认',
        gallery: 'Rijksmuseum Collection',
        summary: cleanText([description, creator ? `作者/制作者：${creator}` : '', material ? `材料：${material}` : ''].filter(Boolean).join('。') || '来自公开知识库的 Rijksmuseum 馆藏条目。'),
        educationTags: inferTags(title, `${description || ''} ${creator || ''} ${material || ''}`),
        image: proxyImage(binding.image?.value || ''),
        sourceUrl: `https://www.wikidata.org/wiki/${itemId}`,
        sourceName: 'Wikidata / Rijksmuseum collection',
      };
    })
    .filter((artifact) => artifact.name && artifact.image);
}

function parseVanGoghHtml(html: string): Artifact[] {
  return splitBy(html, /<div role="article"[\s\S]*?(?=<div role="article"|$)/g)
    .map((card, index) => {
      const href = decodeEntities(match(card, /href="([^"]*\/en\/collection\/[^"]+)"/));
      const id = href.split('/').filter(Boolean).pop() || `item-${index}`;
      const title = cleanText(decodeEntities(match(card, /title="([^"]+)"/) || match(card, /aria-label="([^"]+)"/)));
      const creator = cleanText(decodeEntities(match(card, /collection-art-object-item-creator[^>]*>([\s\S]*?)<\/p>/)));
      const image = upgradeIiifPreview(decodeEntities(match(card, /data-src="([^"]+)"/)));
      const era = creator.match(/\b\d{4}\b/)?.[0] || '年代待确认';
      return {
        id: `vgm-${id}`,
        name: title || `Van Gogh Museum item ${index + 1}`,
        era,
        gallery: 'Van Gogh Museum Collection',
        summary: cleanText(['来自 Van Gogh Museum 官方收藏搜索的藏品。', creator ? `作者/年代：${creator}` : ''].filter(Boolean).join('。')),
        educationTags: inferTags(title, creator),
        image: proxyImage(image),
        sourceUrl: absolutize(href, 'https://www.vangoghmuseum.nl'),
        sourceName: 'Van Gogh Museum Collection Search',
      };
    })
    .filter((artifact) => artifact.name && artifact.image);
}

function parseLouvreHtml(html: string): Artifact[] {
  return splitBy(html, /<article class="card--search">[\s\S]*?<\/article>/g)
    .map((card, index) => {
      const href = decodeEntities(match(card, /href="([^"]*\/ark:\/53355\/cl\d+)"/));
      const arkId = href.match(/cl\d+/)?.[0] || `search-${index}`;
      const title = cleanText(decodeEntities(match(card, /<a href="[^"]*" class="h_4">([\s\S]*?)<\/a>/) || match(card, /alt="([^"]+)"/)));
      const date = cleanText(stripTags(decodeEntities(match(card, /<div class="card__date[\s\S]*?<span>([\s\S]*?)<\/span>/))));
      const creator = cleanText(stripTags(decodeEntities(match(card, /<div class="card__author[\s\S]*?<span>([\s\S]*?)<\/span>/))));
      const image = absolutize(decodeEntities(match(card, /data-src="([^"]+)"/) || match(card, /src="([^"]+)"/)), 'https://collections.louvre.fr');
      return {
        id: `louvre-${arkId}`,
        name: title || `Louvre item ${index + 1}`,
        era: date || '年代待确认',
        gallery: 'Louvre Collections',
        summary: cleanText(['来自 Louvre Collections 官方搜索结果的藏品。', creator ? `作者/制作者：${creator}` : ''].filter(Boolean).join('。')),
        educationTags: inferTags(title, `${date} ${creator}`),
        image: proxyImage(image),
        sourceUrl: absolutize(href, 'https://collections.louvre.fr'),
        sourceName: 'Louvre Collections Search',
      };
    })
    .filter((artifact) => artifact.name && artifact.image);
}

function mapLouvreJson(object: any, index: number): Artifact {
  const creator = Array.isArray(object.creator) ? object.creator.map((item) => item.label).filter(Boolean).join('；') : '';
  const image = object.image?.[0]?.urlThumbnail || object.image?.[0]?.urlImage || '';
  const title = object.title || `Louvre item ${index + 1}`;
  const summary = cleanText([object.description, object.materialsAndTechniques ? `材料/技法：${object.materialsAndTechniques}` : '', creator ? `作者/制作者：${creator}` : ''].filter(Boolean).join('。') || '来自 Louvre Collections JSON 的官方馆藏条目。');
  return {
    id: object.arkId ? `louvre-${object.arkId}` : `louvre-json-${index}`,
    name: title,
    era: object.displayDateCreated || '年代待确认',
    gallery: object.currentLocation || object.room || object.collection || 'Louvre Collections',
    summary,
    educationTags: inferTags(title, summary),
    image: proxyImage(image),
    sourceUrl: object.url || '',
    sourceName: 'Louvre Collections JSON',
  };
}

async function fetchJson<T>(url: string, headers: Record<string, string> = {}): Promise<T> {
  const response = await fetchWithTimeout(url, headers);
  if (!response.ok) throw new Error(`request failed: ${url}`);
  return response.json() as Promise<T>;
}

async function fetchText(url: string): Promise<string> {
  const response = await fetchWithTimeout(url);
  if (!response.ok) throw new Error(`request failed: ${url}`);
  return response.text();
}

async function fetchWithTimeout(url: string, headers: Record<string, string> = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Museumax/1.0 (+https://github.com/william0926zz-jpg/MusueMax)',
        ...headers,
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

function mergeArtifacts(...groups: Artifact[][]) {
  const seen = new Set<string>();
  const merged: Artifact[] = [];
  for (const artifact of groups.flat()) {
    const key = artifact.id || `${artifact.name}-${artifact.sourceUrl}`;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(artifact);
  }
  return merged;
}

function splitBy(value: string, pattern: RegExp) {
  return Array.from(value.matchAll(pattern)).map((matchResult) => matchResult[0]);
}

function match(value: string, pattern: RegExp) {
  return value.match(pattern)?.[1] || '';
}

function stripTags(value: string) {
  return value.replace(/<[^>]+>/g, ' ');
}

function cleanText(value: string) {
  return stripTags(value).replace(/\s+/g, ' ').trim();
}

function absolutize(url: string, baseUrl: string) {
  if (!url) return '';
  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return url;
  }
}

function proxyImage(url: string) {
  if (!url) return '';
  const absoluteUrl = absolutize(url, 'https://collections.louvre.fr');
  return `/api/image-proxy?url=${encodeURIComponent(absoluteUrl)}`;
}

function upgradeIiifPreview(url: string) {
  return url.replace('/full/200,/', '/full/900,/');
}

function decodeEntities(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function inferTags(title: string, summary: string) {
  const text = `${title} ${summary}`.toLowerCase();
  const tags = [
    ['portrait', '肖像'],
    ['landscape', '风景'],
    ['painting', '绘画'],
    ['sculpture', '雕塑'],
    ['print', '版画'],
    ['letter', '书信'],
    ['coin', '钱币'],
    ['textile', '织物'],
    ['history', '历史'],
    ['religion', '宗教'],
    ['myth', '神话'],
  ];
  return tags.filter(([keyword]) => text.includes(keyword)).map(([, label]) => label).slice(0, 2).concat(['馆藏研究']).slice(0, 2);
}
