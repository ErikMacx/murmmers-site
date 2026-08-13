// Mailing list signup.
//
// The press has not yet chosen between MailerLite and Kit. Rather than ship a
// form that quietly loses addresses while that is decided, this captures each
// signup and emails it to the press, so nothing is lost in the meantime.
//
// When the provider is chosen there are two honest ways to finish this:
//   1. Point the form's action straight at the provider's embed URL (set
//      NEWSLETTER_ACTION in src/lib/newsletter.ts) and delete this file, or
//   2. Set MAILERLITE_KEY and let this forward the address to the API, which
//      keeps the reader on murmmers.com instead of bouncing them off-site.
// Either way, turn on the provider's double opt-in.

interface Env {
  EMAIL: { send(message: unknown): Promise<{ messageId?: string }> };
  FEEDBACK_TO?: string;
  MAILERLITE_KEY?: string;
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

function reply(request: Request, ok: boolean, message: string, status: number) {
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
     <title>${ok ? 'You are on the list' : 'Something went wrong'} · Murmmers Press</title>
     <style>body{font-family:"Iowan Old Style",Palatino,Georgia,serif;background:#f7f5f0;
     color:#2a2520;margin:0;display:grid;place-items:center;min-height:100vh;padding:2rem}
     div{max-width:32rem}a{color:#244f45}</style></head>
     <body><div><h1>${ok ? 'You are on the list' : 'Something went wrong'}</h1>
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

  if (String(form.get('website') ?? '').trim()) {
    return reply(request, true, 'Thank you. We will write when a new book arrives.', 200);
  }

  const email = String(form.get('email') ?? '').trim().slice(0, 200);
  const source = String(form.get('source') ?? '').trim().slice(0, 200) || 'the site';

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return reply(request, false, 'That email address does not look right.', 400);
  }

  if (env.MAILERLITE_KEY) {
    try {
      const response = await fetch('https://connect.mailerlite.com/api/subscribers', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${env.MAILERLITE_KEY}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ email, fields: { source } }),
      });
      if (!response.ok) throw new Error(`MailerLite responded ${response.status}`);
      return reply(request, true, 'Thank you. Please confirm through the email we have just sent.', 200);
    } catch (error) {
      console.error('subscribe: provider failed, falling back to email', error);
    }
  }

  if (!env.FEEDBACK_TO || !env.EMAIL) {
    console.error('subscribe: EMAIL binding or FEEDBACK_TO is not configured');
    return reply(request, false, 'We could not add you just now. Please try again later.', 500);
  }

  try {
    await env.EMAIL.send({
      to: env.FEEDBACK_TO,
      from: { email: 'feedback@murmmers.com', name: 'Murmmers Press' },
      subject: `Mailing list signup: ${email}`,
      text: `${email}\nSigned up from: ${source}`,
      html: `<p><strong>${escapeHtml(email)}</strong><br>Signed up from: ${escapeHtml(source)}</p>`,
    });
  } catch (error) {
    console.error('subscribe: send failed', error);
    return reply(request, false, 'We could not add you just now. Please try again later.', 502);
  }

  return reply(request, true, 'Thank you. We will write when a new book arrives.', 200);
};
