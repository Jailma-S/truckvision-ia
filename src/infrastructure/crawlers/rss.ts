export interface FeedItem {
  title: string;
  link: string;
  description: string;
  pubDate: string | null;
}

const decode = (s: string) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

const tag = (xml: string, name: string) => {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? decode(m[1]) : "";
};

/** Leitor RSS/Atom mínimo, sem dependências. */
export async function fetchFeed(url: string, limit = 20): Promise<FeedItem[]> {
  const res = await fetch(url, {
    headers: { "user-agent": "TruckVisionIA/1.0 (+monitoramento de sinais públicos)" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Feed ${url} respondeu ${res.status}`);
  const xml = await res.text();
  const blocks = xml.match(/<(item|entry)[\s>][\s\S]*?<\/(item|entry)>/gi) ?? [];
  return blocks.slice(0, limit).map((block) => {
    const atomLink = block.match(/<link[^>]*href="([^"]+)"/i)?.[1];
    const date = tag(block, "pubDate") || tag(block, "updated") || tag(block, "published");
    const parsed = date ? new Date(date) : null;
    return {
      title: tag(block, "title"),
      link: tag(block, "link") || atomLink || "",
      description: tag(block, "description") || tag(block, "summary") || tag(block, "content"),
      pubDate: parsed && !isNaN(parsed.getTime()) ? parsed.toISOString().slice(0, 10) : null,
    };
  });
}
