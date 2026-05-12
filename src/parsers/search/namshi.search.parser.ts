// Namshi search results are embedded as JSON in the HTML (not rendered <a> tags).
// Product URLs follow the pattern: /uae-en/buy-{slug}/{SKU}/p/

export function parseNamshiSearch(html: string, baseUrl: string): string[] {
  const links = new Set<string>();

  // Extract product URLs from embedded JSON data
  const matches = html.matchAll(/"url"\s*:\s*"(https?:\/\/(?:www\.)?namshi\.com\/uae-en\/[^"]+\/p\/)"/g);
  for (const m of matches) {
    links.add(m[1]);
  }

  // Fallback: scan for any namshi /uae-en/.../p/ pattern in raw HTML
  if (links.size === 0) {
    const rawMatches = html.matchAll(/https?:\/\/(?:www\.)?namshi\.com\/uae-en\/[^"'\s]{10,}\/p\//g);
    for (const m of rawMatches) {
      links.add(m[0].split('?')[0]);
    }
  }

  return Array.from(links);
}
