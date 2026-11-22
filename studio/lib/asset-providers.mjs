// External sources behind one interface: search or resolve an id to {url, license, attribution, ...}.
// A provider must return an explicit licence; anything unclear is refused, never defaulted.
const UA = {'User-Agent': 'ContentMakerEngine/1.0 (local research; contact via repository owner)'};
const ALLOWED = [/^public domain$/i, /^pd\b/i, /^cc0/i, /^cc[ -]by(-sa)?[ -]\d/i];

export const allowedLicense = (name) => ALLOWED.some((re) => re.test((name ?? '').trim()));

const strip = (html) => String(html ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

export const providers = {
  /** Wikimedia Commons: id is a file title, e.g. "File:Earth.jpg". */
  commons: {
    async resolve(id, {width = 4096} = {}) {
      const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|size|extmetadata|mime&iiurlwidth=${width}&titles=${encodeURIComponent(id)}`;
      const r = await fetch(url, {headers: UA});
      if (!r.ok) throw Error(`Commons HTTP ${r.status}`);
      const page = Object.values((await r.json()).query.pages)[0];
      const info = page.imageinfo?.[0];
      if (!info) throw Error(`Commons has no file ${id}`);
      const meta = info.extmetadata ?? {};
      return {
        url: info.thumburl ?? info.url, mime: info.mime,
        license: meta.LicenseShortName?.value, licenseUrl: meta.LicenseUrl?.value ?? '',
        author: strip(meta.Artist?.value), source: info.descriptionurl,
        description: strip(meta.ImageDescription?.value).slice(0, 300),
        attribution: meta.AttributionRequired?.value === 'true',
      };
    },
  },
  /** NASA Image and Video Library: id is a nasa_id. NASA media is generally not copyrighted. */
  nasa: {
    async resolve(id, {kind} = {}) {
      const prefer = kind === 'video' ? /~(small|medium|mobile)\.mp4$/ : /~large\.jpg$|~orig\.jpg$/;
      const data = await (await fetch(`https://images-api.nasa.gov/search?nasa_id=${encodeURIComponent(id)}`, {headers: UA})).json();
      const item = data.collection.items[0];
      if (!item) throw Error(`NASA has no item ${id}`);
      const meta = item.data[0];
      const files = await (await fetch(`https://images-api.nasa.gov/asset/${encodeURIComponent(id)}`, {headers: UA})).json();
      const hrefs = files.collection.items.map((f) => f.href.replace('http://', 'https://'));
      const picked = hrefs.find((h) => prefer.test(h)) ?? hrefs.find((h) => /~medium\.(jpg|mp4)$/.test(h)) ?? hrefs[0];
      return {url: picked, license: 'Public domain', licenseUrl: 'https://www.nasa.gov/nasa-brand-center/images-and-media/', author: `NASA${meta.center ? ` / ${meta.center}` : ''}${meta.photographer ? ` / ${meta.photographer}` : ''}`, source: `https://images.nasa.gov/details/${id}`, description: strip(meta.title).slice(0, 300), attribution: true};
    },
    async search(query) {
      const data = await (await fetch(`https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=image,video`, {headers: UA})).json();
      return data.collection.items.slice(0, 20).map((i) => ({id: i.data[0].nasa_id, title: i.data[0].title, type: i.data[0].media_type}));
    },
  },
};
