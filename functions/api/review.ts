// Reader reviews: submission. Stars and a comment, posted from a book page.
//
// Nothing a reader writes appears on the site until the publisher approves it.
// A submission is stored unapproved and an email goes out with a one-click
// approve link, so moderation costs a tap and the storefront can never be
// defaced by whoever finds the form.
//
// Cloudflare Pages Function. Needs three bindings:
//   murmmers_reviews  D1 database
//   EMAIL             Email Sending binding (already used by feedback.ts)
//   REVIEW_SECRET     secret, used to sign approve links
// and FEEDBACK_TO for the notification address.

interface Env {
  murmmers_reviews: D1Database;
  EMAIL: { send(message: unknown): Promise<{ messageId?: string }> };
  FEEDBACK_TO?: string;
  REVIEW_SECRET?: string;
  SITE_ORIGIN?: string;
}

const MAX = { name: 80, comment: 3000, book: 120 };
const RATE_WINDOW_HOURS = 24;
const RATE_LIMIT = 3;            // reviews per address per day

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

async function hmac(secret: string, data: string) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hashIp(secret: string, ip: string) {
  return (await hmac(secret, `ip:${ip}`)).slice(0, 32);
}

function reply(request: Request, ok: boolean, message: string, status: number) {
  const wantsJson = (request.headers.get('accept') ?? '').includes('application/json');
  if (wantsJson) {
    return new Response(JSON.stringify({ ok, message }), {
      status, headers: { 'content-type': 'application/json' },
    });
  }
  return new Response(
    `<!doctype html><html lang="en-GB"><head><meta charset="utf-8">
     <meta name="viewport" content="width=device-width, initial-scale=1">
     <title>${ok ? 'Thank you' : 'Something went wrong'} · Murmmers Press</title>
     <style>body{font-family:"Iowan Old Style",Palatino,Georgia,serif;background:#f7f5f0;
     color:#2a2520;margin:0;display:grid;place-items:center;min-height:100vh;padding:2rem}
     div{max-width:32rem}a{color:#244f45}</style></head>
     <body><div><h1>${ok ? 'Thank you' : 'Something went wrong'}</h1>
     <p>${escapeHtml(message)}</p><p><a href="/books/">Back to the books</a></p></div></body></html>`,
    { status, headers: { 'content-type': 'text/html; charset=utf-8' } },
  );
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return reply(request, false, 'That did not arrive in a form we could read.', 400);
  }

  const field = (n: string, limit: number) =>
    String(form.get(n) ?? '').trim().slice(0, limit);

  // Honeypot: invisible to a reader, irresistible to a bot. Thank it and drop it.
  if (String(form.get('website') ?? '').trim()) {
    return reply(request, true, 'Thank you. Your review has been sent for approval.', 200);
  }

  const book = field('book', MAX.book);
  const name = field('name', MAX.name);
  const comment = field('comment', MAX.comment);
  const stars = Number(form.get('stars'));

  if (!book) return reply(request, false, 'That review did not say which book it was for.', 400);
  if (!Number.isInteger(stars) || stars < 1 || stars > 5)
    return reply(request, false, 'Please choose a rating between one and five stars.', 400);
  if (!comment) return reply(request, false, 'The review was empty, so nothing was saved.', 400);
  if (!name) return reply(request, false, 'Please give a name to publish the review under.', 400);

  if (!env.murmmers_reviews || !env.REVIEW_SECRET) {
    console.error('review: D1 binding or REVIEW_SECRET is not configured');
    return reply(request, false, 'We could not save that just now. Please try again later.', 500);
  }

  const ip = request.headers.get('cf-connecting-ip') ?? '';
  const ipHash = ip ? await hashIp(env.REVIEW_SECRET, ip) : null;
  const now = new Date().toISOString();

  // Rate limit by hashed address, so one visitor cannot flood the queue.
  if (ipHash) {
    const since = new Date(Date.now() - RATE_WINDOW_HOURS * 3600_000).toISOString();
    const row: any = await env.murmmers_reviews
      .prepare('SELECT COUNT(*) AS n FROM reviews WHERE ip_hash = ? AND created_at > ?')
      .bind(ipHash, since).first();
    if ((row?.n ?? 0) >= RATE_LIMIT) {
      return reply(request, false, 'That is several reviews in a short time. Please try again tomorrow.', 429);
    }
  }

  let id: number;
  try {
    const res = await env.murmmers_reviews
      .prepare('INSERT INTO reviews (book, stars, name, comment, approved, created_at, ip_hash) VALUES (?, ?, ?, ?, 0, ?, ?)')
      .bind(book, stars, name, comment, now, ipHash).run();
    id = Number(res.meta.last_row_id);
  } catch (error) {
    console.error('review: insert failed', error);
    return reply(request, false, 'We could not save that just now. Please try again later.', 500);
  }

  // Notify the publisher with a signed approve link. The token is an HMAC of
  // the row id, so links cannot be guessed or edited to approve anything else.
  const to = env.FEEDBACK_TO;
  if (to && env.EMAIL) {
    const origin = env.SITE_ORIGIN || 'https://murmmers.com';
    const token = await hmac(env.REVIEW_SECRET, `approve:${id}`);
    const approve = `${origin}/api/review-approve?id=${id}&token=${token}`;
    const reject = `${origin}/api/review-approve?id=${id}&token=${token}&reject=1`;
    try {
      await env.EMAIL.send({
        to,
        from: { email: 'feedback@murmmers.com', name: 'Murmmers Press' },
        subject: `Review awaiting approval: ${book} (${stars} star${stars === 1 ? '' : 's'})`,
        text: `${book}\n${stars} stars, by ${name}\n\n${comment}\n\nApprove: ${approve}\nDelete: ${reject}\n`,
        html: `<p><strong>${escapeHtml(book)}</strong><br>${stars} star${stars === 1 ? '' : 's'}, by ${escapeHtml(name)}</p>
               <p style="white-space:pre-wrap">${escapeHtml(comment)}</p>
               <p><a href="${approve}">Approve and publish</a> &nbsp;·&nbsp; <a href="${reject}">Delete</a></p>`,
      });
    } catch (error) {
      console.error('review: notification failed', error);   // stored anyway
    }
  }

  return reply(request, true, 'Thank you. Your review has been sent for approval and will appear shortly.', 200);
};
