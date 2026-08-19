// Reader reviews: the public read. Returns only approved rows, newest first,
// with the aggregate the book page shows above them.
//
// GET /api/reviews?book=<slug>

interface Env { murmmers_reviews: D1Database }

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const book = new URL(request.url).searchParams.get('book')?.trim().slice(0, 120);
  if (!book) {
    return new Response(JSON.stringify({ ok: false, message: 'No book given.' }),
      { status: 400, headers: { 'content-type': 'application/json' } });
  }
  if (!env.murmmers_reviews) {
    return new Response(JSON.stringify({ ok: true, count: 0, average: null, reviews: [] }),
      { headers: { 'content-type': 'application/json' } });
  }

  const { results } = await env.murmmers_reviews
    .prepare('SELECT stars, name, comment, created_at FROM reviews WHERE book = ? AND approved = 1 ORDER BY created_at DESC LIMIT 100')
    .bind(book).all();

  const rows: any[] = results ?? [];
  const count = rows.length;
  const average = count
    ? Math.round((rows.reduce((s, r) => s + Number(r.stars), 0) / count) * 10) / 10
    : null;

  return new Response(JSON.stringify({ ok: true, count, average, reviews: rows }), {
    headers: {
      'content-type': 'application/json',
      // Short cache: reviews are not urgent, but an approval should show up
      // within a minute rather than whenever the edge feels like it.
      'cache-control': 'public, max-age=60',
    },
  });
};
