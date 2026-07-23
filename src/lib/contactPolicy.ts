const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const URL_TOKEN_PATTERN = /\b(?:https?:\/\/|www\.)[^\s]+|\b(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s]*)?/gi;
const MAP_URL_PATTERN =
  /(?:https?:\/\/)?(?:www\.)?(?:google\.[a-z.]+\/maps|maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl\/maps|waze\.com\/(?:ul|live-map)|maps\.apple\.com|bing\.com\/maps|openstreetmap\.org|here\.wego\.com)/i;
const SOCIAL_PATTERN = /\b(?:whats?app|wa\.me|t\.me|telegram|instagram|insta|ig\b|facebook|fb\.com|messenger|m\.me|linkedin|x\.com|twitter|tiktok|snapchat|discord)\b/i;
const PHONE_PATTERN = /(?:\+?\d[\s().-]?){8,}/;

function hasBlockedUrl(text: string) {
  const urls = text.match(URL_TOKEN_PATTERN) ?? [];
  return urls.some((url) => !MAP_URL_PATTERN.test(url));
}

export function containsOffPlatformContactInfo(value: string) {
  const text = value.trim();
  return (
    EMAIL_PATTERN.test(text) ||
    hasBlockedUrl(text) ||
    SOCIAL_PATTERN.test(text) ||
    PHONE_PATTERN.test(text)
  );
}
