// Reader feedback, posted from a book page and delivered as email.
//
// Cloudflare Pages Function. Uses the Email Sending binding, so the whole path
// stays inside Cloudflare: no third-party form service, no monthly fee, and no
// API key in the repo. The binding is declared in wrangler.jsonc.
//
// Before the first send, the sending domain must be onboarded once:
//   npx wrangler email sending enable murmmers.com
// and FEEDBACK_TO set to the address that should receive the notes.

interface Env {
  EMAIL: { send(message: unknown): Promise<{ messageId?: string }> };
  FEEDBACK_TO?: string;
}

const MAX = { message: 4000, name: 120, email: 200, book: 200 };

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

function reply(request: Request, ok: boolean, message: string, status: number) {
  // The form submits with fetch and asks for JSON. Without JavaScript the
  // browser posts directly and lands here, so it gets a real page instead.
  const wantsJson = (request.headers.get('accept') ?? '').includes('application/json');
  if (wantsJson) {
    return new Response(JSON.stringify({ ok, message }), {
      status,
      headers: { 'content-type': 'application/json' },
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

  const field = (name: string, limit: number) =>
    String(form.get(name) ?? '').trim().slice(0, limit);

  // Honeypot. A real reader never sees this field, so anything in it is a bot.
  // Answer as though it worked, and send nothing.
  if (String(form.get('website') ?? '').trim()) {
    return reply(request, true, 'Thank you for writing. Your note has reached us.', 200);
  }

  const message = field('message', MAX.message);
  const name = field('name', MAX.name);
  const email = field('email', MAX.email);
  const book = field('book', MAX.book) || 'the press';

  if (!message) {
    return reply(request, false, 'The note was empty, so nothing was sent.', 400);
  }
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return reply(request, false, 'That email address does not look right.', 400);
  }

  const to = env.FEEDBACK_TO;
  if (!to || !env.EMAIL) {
    console.error('feedback: EMAIL binding or FEEDBACK_TO is not configured');
    return reply(request, false, 'We could not deliver that just now. Please try again later.', 500);
  }

  const from = name || 'A reader';
  const lines = [
    `Book: ${book}`,
    `From: ${from}`,
    `Reply to: ${email || 'not given'}`,
    '',
    message,
  ].join('\n');

  try {
    await env.EMAIL.send({
      to,
      from: { email: 'feedback@murmmers.com', name: 'Murmmers Press' },
      // replyTo only when the reader gave an address, so hitting reply in the
      // mail client writes to the reader and never to the site itself.
      ...(email ? { replyTo: email } : {}),
      subject: `Reader feedback: ${book}`,
      text: lines,
      html: `<p><strong>Book:</strong> ${escapeHtml(book)}<br>
             <strong>From:</strong> ${escapeHtml(from)}<br>
             <strong>Reply to:</strong> ${escapeHtml(email || 'not given')}</p>
             <p style="white-space:pre-wrap">${escapeHtml(message)}</p>`,
    });
  } catch (error) {
    console.error('feedback: send failed', error);
    return reply(request, false, 'We could not deliver that just now. Please try again later.', 502);
  }

  return reply(request, true, 'Thank you for writing. Your note has reached us.', 200);
};
