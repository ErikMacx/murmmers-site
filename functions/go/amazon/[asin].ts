// Buy on Amazon, from the reader's own country.
//
// Amazon has no neutral link that finds a reader's home store, and a Kindle
// account can only buy from the store it belongs to: an American sent to
// amazon.co.uk cannot buy the ebook there. So the book page links here, and
// this sends each reader to their own store, using the country Cloudflare
// already knows for every request. The button looks the same everywhere.
//
// Kindle ASINs (B0...) are the same in every store. Print ASINs are the
// ISBN-10, and KDP print is only sold in some stores, so a paperback link from
// a country whose store has no KDP print goes to amazon.com instead.
//
// Anywhere not listed goes to amazon.com, which is Amazon's own default store
// for countries without one. Add ?cc=US (or any code below) to test a country.

const KINDLE_STORE: Record<string, string> = {
  GB: 'www.amazon.co.uk', IE: 'www.amazon.co.uk', IM: 'www.amazon.co.uk',
  JE: 'www.amazon.co.uk', GG: 'www.amazon.co.uk',
  US: 'www.amazon.com', PR: 'www.amazon.com', VI: 'www.amazon.com',
  GU: 'www.amazon.com', AS: 'www.amazon.com', MP: 'www.amazon.com',
  CA: 'www.amazon.ca',
  AU: 'www.amazon.com.au',
  DE: 'www.amazon.de', AT: 'www.amazon.de', CH: 'www.amazon.de', LI: 'www.amazon.de',
  FR: 'www.amazon.fr', MC: 'www.amazon.fr',
  ES: 'www.amazon.es',
  IT: 'www.amazon.it', SM: 'www.amazon.it', VA: 'www.amazon.it',
  NL: 'www.amazon.nl',
  JP: 'www.amazon.co.jp',
  IN: 'www.amazon.in',
  BR: 'www.amazon.com.br',
  MX: 'www.amazon.com.mx',
};

// The stores that sell KDP paperbacks and hardcovers.
const PRINT_STORES = new Set([
  'www.amazon.com', 'www.amazon.co.uk', 'www.amazon.ca', 'www.amazon.com.au',
  'www.amazon.de', 'www.amazon.fr', 'www.amazon.es', 'www.amazon.it',
  'www.amazon.nl', 'www.amazon.co.jp',
]);

const DEFAULT_STORE = 'www.amazon.com';

export function storeFor(country: string, asin: string): string {
  const store = KINDLE_STORE[country.toUpperCase()] ?? DEFAULT_STORE;
  const isKindle = asin.startsWith('B');
  return isKindle || PRINT_STORES.has(store) ? store : DEFAULT_STORE;
}

export const onRequestGet: PagesFunction = async ({ request, params }) => {
  const asin = String(params.asin ?? '').toUpperCase();
  if (!/^[A-Z0-9]{10}$/.test(asin)) {
    return new Response('Not found', { status: 404 });
  }

  const override = new URL(request.url).searchParams.get('cc') ?? '';
  const country = /^[A-Za-z]{2}$/.test(override)
    ? override
    : ((request as { cf?: { country?: string } }).cf?.country ?? '');

  return new Response(null, {
    status: 302,
    headers: {
      location: `https://${storeFor(country, asin)}/dp/${asin}`,
      // The answer depends on who is asking, so nothing may cache it.
      'cache-control': 'private, no-store',
    },
  });
};
