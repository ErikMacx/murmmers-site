// Reader reviews: approval, from the link in the notification email.
//
// The token is an HMAC of the row id under REVIEW_SECRET, so a link cannot be
// guessed, and editing the id in the URL invalidates it. One tap publishes;
// the same link with &reject=1 deletes instead.
//
// GET /api/review-approve?id=<n>&token=<hmac>[&reject=1]

interface Env {
  murmmers_reviews: D1Database;
  REVIEW_SECRET?: string;
}

async function hmac(secret: string, data: string) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Constant-time compare, so a wrong token cannot be found by timing.
function same(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const page = (title: string, body: string, status = 200) =>
  new Response(
    `<!doctype html><html lang="en-GB"><head><meta charset="utf-8">
     <meta name="viewport" content="width=device-width, initial-scale=1">
     <title>${title} · Murmmers Press</title>
     <style>body{font-family:"Iowan Old Style",Palatino,Georgia,serif;background:#f7f5f0;
     color:#2a2520;margin:0;display:grid;place-items:center;min-height:100vh;padding:2rem}
     div{max-width:32rem}a{color:#244f45}</style></head>
     <body><div><h1>${title}</h1><p>${body}</p>
     <p><a href="/books/">Back to the books</a></p></div></body></html>`,
    { status, headers: { 'content-type': 'text/html; charset=utf-8' } });

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const id = Number(url.searchParams.get('id'));
  const token = url.searchParams.get('token') ?? '';
  const reject = url.searchParams.get('reject') === '1';

  if (!Number.isInteger(id) || id <= 0 || !token) {
    return page('That link is not complete', 'The approval link was missing something.', 400);
  }
  if (!env.murmmers_reviews || !env.REVIEW_SECRET) {
    return page('Not configured', 'Review moderation is not set up on this site yet.', 500);
  }
  if (!same(token, await hmac(env.REVIEW_SECRET, `approve:${id}`))) {
    return page('That link is not valid', 'This approval link does not match any review.', 403);
  }

  if (reject) {
    await env.murmmers_reviews.prepare('DELETE FROM reviews WHERE id = ?').bind(id).run();
    return page('Deleted', 'That review has been removed and will not appear on the site.');
  }

  const res = await env.murmmers_reviews
    .prepare('UPDATE reviews SET approved = 1 WHERE id = ?').bind(id).run();
  if (!res.meta.changes) {
    return page('Nothing to approve', 'That review no longer exists. It may already have been deleted.', 404);
  }
  return page('Published', 'The review is now live on the book page.');
};
