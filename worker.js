export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/' || url.pathname === '') {
      return Response.redirect(url.origin + '/editor/', 302);
    }

    if (url.pathname === '/editor' || url.pathname === '/editor/') {
      return serveAsset('/editor.html', request, env, 'text/html; charset=utf-8');
    }

    if (url.pathname === '/api/upload' && request.method === 'POST') return handleUpload(request, env);
    if (url.pathname === '/api/list') return handleList(env);
    if (url.pathname.startsWith('/u/')) return handleKvAsset(url.pathname.slice(3), env);

    if (url.pathname.startsWith('/icons/') || url.pathname === '/editor.html') {
      return serveAsset(url.pathname, request, env);
    }

    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response('Not found', { status: 404 });
  }
};

async function serveAsset(pathname, request, env, contentType) {
  if (!env.ASSETS) {
    return new Response('Static asset binding ASSETS is missing. Check wrangler.toml [assets] binding.', { status: 500 });
  }
  const url = new URL(request.url);
  url.pathname = pathname;
  const res = await env.ASSETS.fetch(new Request(url.toString(), request));
  if (contentType && res.ok) {
    const headers = new Headers(res.headers);
    headers.set('content-type', contentType);
    headers.set('cache-control', 'no-store');
    return new Response(res.body, { status: res.status, headers });
  }
  return res;
}

async function handleUpload(request, env) {
  if (!env.SIG_ASSETS) return json({ ok: false, error: 'KV binding SIG_ASSETS is missing' }, 500);
  const form = await request.formData();
  const file = form.get('file');
  let name = String(form.get('name') || (file && file.name) || 'image').trim().toLowerCase();
  name = name.replace(/[^a-z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  if (!name) name = 'image';
  if (!/\.[a-z0-9]{2,5}$/.test(name) && file && file.type) {
    const ext = file.type.includes('png') ? '.png' : file.type.includes('gif') ? '.gif' : file.type.includes('webp') ? '.webp' : '.jpg';
    name += ext;
  }
  if (!file || !file.arrayBuffer) return json({ ok: false, error: 'No file uploaded' }, 400);
  const buf = await file.arrayBuffer();
  if (buf.byteLength > 5 * 1024 * 1024) return json({ ok: false, error: 'Max image size is 5 MB' }, 400);
  const contentType = file.type || 'application/octet-stream';
  await env.SIG_ASSETS.put('asset:' + name, buf, {
    metadata: { contentType, name, uploadedAt: new Date().toISOString() }
  });
  return json({ ok: true, name, url: new URL(request.url).origin + '/u/' + name, contentType, bytes: buf.byteLength });
}

async function handleList(env) {
  if (!env.SIG_ASSETS) return json({ ok: false, error: 'KV binding SIG_ASSETS is missing' }, 500);
  const list = await env.SIG_ASSETS.list({ prefix: 'asset:' });
  return json({
    ok: true,
    assets: list.keys.map(k => ({ name: k.name.slice(6), url: '/u/' + k.name.slice(6), metadata: k.metadata || {} }))
  });
}

async function handleKvAsset(name, env) {
  if (!env.SIG_ASSETS) return new Response('KV binding SIG_ASSETS is missing', { status: 500 });
  name = decodeURIComponent(name).replace(/^\/+/, '');
  const item = await env.SIG_ASSETS.getWithMetadata('asset:' + name, { type: 'arrayBuffer' });
  if (!item.value) return new Response('Asset not found', { status: 404 });
  return new Response(item.value, {
    headers: {
      'content-type': (item.metadata && item.metadata.contentType) || 'application/octet-stream',
      'cache-control': 'public, max-age=31536000, immutable'
    }
  });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });
}
