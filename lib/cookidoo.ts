import { htmlToText } from "@/lib/text";

export type CookidooLink = {
  id: string;
  language: string;
  url: string;
};

export type ParsedCookidoo = {
  title: string;
  imageUrl: string | null;
  prepMinutes: number | null;
  totalMinutes: number | null;
  servings: number | null;
  yieldText: string | null;
  tools: string[];
  ingredients: string[];
  instructions: string[];
};

const HOST = /^cookidoo\./i;
const PATH =
  /^\/(?:created-recipes\/public\/recipes|recipes\/recipe)\/([a-z]{2})\/([A-Za-z0-9]+)\/?$/;

export function extractCookidooLinks(text: string) {
  const links: CookidooLink[] = [];
  const rejected: string[] = [];
  const seen = new Set<string>();

  for (const piece of text.split(/\s+/)) {
    let chunk = piece.trim().replace(/^[<(]+|[>),.;]+$/g, "");
    if (!chunk) continue;
    if (!/^https?:\/\//i.test(chunk)) {
      if (/cookidoo\./i.test(chunk)) chunk = `https://${chunk}`;
      else continue;
    }

    let url: URL;
    try {
      url = new URL(chunk);
    } catch {
      rejected.push(chunk);
      continue;
    }

    if (!HOST.test(url.hostname)) {
      rejected.push(url.toString());
      continue;
    }

    const match = url.pathname.match(PATH);
    if (!match) {
      rejected.push(url.toString());
      continue;
    }

    if (seen.has(match[2])) continue;
    seen.add(match[2]);
    url.hash = "";
    url.search = "";
    links.push({ id: match[2], language: match[1], url: url.toString() });
  }

  return { links, rejected };
}

function meta(html: string, property: string) {
  const patterns = [
    new RegExp(
      `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`,
      "i",
    ),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return htmlToText(match[1]);
  }
  return null;
}

function attr(tag: string, name: string) {
  const match = tag.match(new RegExp(`${name}=["']([^"']+)["']`, "i"));
  return match?.[1] ?? null;
}

export function fullImageUrl(url: string | null) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "ugc.assets.tmecosys.com") return url;
    parsed.pathname = parsed.pathname.replace(/\/image\/upload\/(?!prod\/)[^/]+\//, "/image/upload/");
    return parsed.toString();
  } catch {
    return url;
  }
}

function largestImage(html: string) {
  const tag = html.match(/<img[^>]*class="[^"]*recipe-card__image[^"]*"[^>]*>/i)?.[0];
  let found: string | null = null;
  if (tag) {
    const srcset = attr(tag, "srcset");
    if (srcset) {
      const candidates = srcset.split(",").map((part) => {
        const [url, width] = part.trim().split(/\s+/);
        return { url, width: Number((width || "").replace("w", "")) || 0 };
      });
      candidates.sort((a, b) => b.width - a.width);
      if (candidates[0]?.url) found = htmlToText(candidates[0].url);
    }
    if (!found) {
      const src = attr(tag, "src");
      if (src) found = htmlToText(src);
    }
  }
  return fullImageUrl(found ?? meta(html, "og:image"));
}

function param(html: string, icon: string) {
  const match = html.match(
    new RegExp(
      `icon--${icon}(?![\\w-])[\\s\\S]{0,240}?<span>([\\s\\S]*?)<\\/span>`,
      "i",
    ),
  );
  return match ? htmlToText(match[1]) : null;
}

export function parseDuration(value: string | null) {
  if (!value) return null;
  const hours = value.match(/(\d+)\s*h/i);
  const minutes = value.match(/(\d+)\s*min/i);
  if (!hours && !minutes) return null;
  return (hours ? Number(hours[1]) : 0) * 60 + (minutes ? Number(minutes[1]) : 0);
}

function parseServings(value: string | null) {
  if (!value) return null;
  const match = value.match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

function unique(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const cleaned = value.trim();
    const key = cleaned.toLowerCase();
    if (!cleaned || seen.has(key)) continue;
    seen.add(key);
    result.push(cleaned);
  }
  return result;
}

function instructionsFrom(html: string) {
  const fromMarkup = [
    ...html.matchAll(
      /<(?:li|div|p)[^>]*class="[^"]*(?:recipe-step|step__description|instruction)[^"]*"[^>]*>([\s\S]*?)<\/(?:li|div|p)>/gi,
    ),
  ]
    .map((match) => htmlToText(match[1]))
    .filter((step) => step.length > 1);
  if (fromMarkup.length > 0) return fromMarkup;

  for (const block of html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    try {
      const data = JSON.parse(block[1]) as
        | { "@type"?: string; recipeInstructions?: unknown }
        | Array<{ "@type"?: string; recipeInstructions?: unknown }>;
      const recipe = Array.isArray(data)
        ? data.find((item) => item["@type"] === "Recipe")
        : data;
      const steps = recipe?.recipeInstructions;
      if (!Array.isArray(steps)) continue;
      const texts = steps
        .map((step) => {
          if (typeof step === "string") return htmlToText(step);
          if (step && typeof step === "object" && "text" in step) {
            return htmlToText(String(step.text));
          }
          return "";
        })
        .filter(Boolean);
      if (texts.length > 0) return texts;
    } catch {
      continue;
    }
  }

  return [];
}

export function parseCookidooHtml(html: string): ParsedCookidoo {
  const heading = html.match(
    /<h1[^>]*class="[^"]*recipe-card__name[^"]*"[^>]*>([\s\S]*?)<\/h1>/i,
  );
  const title = (heading ? htmlToText(heading[1]) : null) || meta(html, "og:title") || "";
  const yieldText = param(html, "servings");
  const ingredients = unique(
    [...html.matchAll(/<recipe-ingredient[^>]*>([\s\S]*?)<\/recipe-ingredient>/gi)].map(
      (match) => htmlToText(match[1]),
    ),
  );
  const tools = unique(
    [...html.matchAll(/recipe-device__name">([^<]+)/gi)].map((match) => htmlToText(match[1])),
  );

  return {
    title: title.replace(/\s+-\s+Cookidoo[\s\S]*$/i, "").trim(),
    imageUrl: largestImage(html),
    prepMinutes: parseDuration(param(html, "time-preparation")),
    totalMinutes: parseDuration(param(html, "time")),
    servings: parseServings(yieldText),
    yieldText,
    tools,
    ingredients,
    instructions: instructionsFrom(html),
  };
}

export async function fetchCookidooRecipe(link: CookidooLink) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(link.url, {
      signal: controller.signal,
      redirect: "follow",
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "ro-RO,ro;q=0.9,en;q=0.8",
      },
    });
    if (!response.ok) throw new Error(`Cookidoo a răspuns cu ${response.status}`);
    const finalHost = new URL(response.url).hostname;
    if (!HOST.test(finalHost)) {
      throw new Error("Pagina a fost redirecționată în afara Cookidoo");
    }
    const parsed = parseCookidooHtml(await response.text());
    if (!parsed.title) throw new Error("Nu am găsit titlul rețetei");
    return parsed;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Cookidoo nu a răspuns la timp");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
