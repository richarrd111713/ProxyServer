export async function onRequestGet({ request }) {
    const url    = new URL(request.url);
    const target = url.searchParams.get('url');
    const origin = request.headers.get('Origin') || '*';
  
    if (!target) {
      return new Response('Missing `?url=`', { status: 400 });
    }
  
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin':      origin,
          'Access-Control-Allow-Methods':     'GET,POST,OPTIONS',
          'Access-Control-Allow-Headers':     'Content-Type',
          'Access-Control-Allow-Credentials': 'true'
        }
      });
    }
  
    // Forward key headers + cookies
    const fh = {
      'User-Agent':      request.headers.get('User-Agent')      || '',
      'Accept':          request.headers.get('Accept')          || '*/*',
      'Accept-Language': request.headers.get('Accept-Language') || 'en-US',
      'Cookie':          request.headers.get('Cookie')          || ''
    };
  
    let originRes;
    try {
      originRes = await fetch(target, { redirect: 'follow', headers: fh });
    } catch (err) {
      return new Response('Fetch failed: ' + err, { status: 502 });
    }
  
    // Strip CSP/XFO, add CORS & forward Set-Cookie
    const nh = new Headers(originRes.headers);
    ['content-security-policy',
     'content-security-policy-report-only',
     'x-frame-options'
    ].forEach(h => nh.delete(h));
    nh.set('Access-Control-Allow-Origin',      origin);
    nh.set('Access-Control-Allow-Credentials', 'true');
    (originRes.headers.raw()['set-cookie'] || [])
      .forEach(c => nh.append('Set-Cookie', c));
  
    let response = new Response(originRes.body, { status: originRes.status, headers: nh });
  
    // Rewrite HTML assets and inject <base>
    const ct = originRes.headers.get('Content-Type') || '';
    if (ct.includes('text/html')) {
      const workerOrigin = url.origin;
      response = new HTMLRewriter()
        .on('head', {
          element(e) {
            e.append(`<base href="${target}">`, { html: true });
          }
        })
        .on('link',   new Rewriter(workerOrigin, target, 'href'))
        .on('script', new Rewriter(workerOrigin, target, 'src'))
        .on('img',    new Rewriter(workerOrigin, target, 'src'))
        .on('a',      new Rewriter(workerOrigin, target, 'href'))
        .on('form',   new Rewriter(workerOrigin, target, 'action'))
        .on('iframe', new Rewriter(workerOrigin, target, 'src'))
        .on('source', new Rewriter(workerOrigin, target, 'src'))
        .on('video',  new Rewriter(workerOrigin, target, 'src'))
        .on('audio',  new Rewriter(workerOrigin, target, 'src'))
        .on('embed',  new Rewriter(workerOrigin, target, 'src'))
        .on('object', new Rewriter(workerOrigin, target, 'data'))
        .on('meta[http-equiv="refresh"]', new MetaRewriter(workerOrigin, target))
        .on('[style]', new StyleAttrRewriter(workerOrigin, target))
        .on('style',   new StyleTagRewriter(workerOrigin, target))
        .on('meta[http-equiv="Content-Security-Policy"]', { element: e => e.remove() })
        .on('meta[http-equiv="Content-Security-Policy-Report-Only"]', { element: e => e.remove() })
        .transform(response);
    }
  
    return response;
  }
  
  class Rewriter {
    constructor(workerOrigin, pageOrigin, attr) {
      this.workerOrigin = workerOrigin;
      this.pageOrigin   = pageOrigin;
      this.attr         = attr;
    }
    element(el) {
      const v = el.getAttribute(this.attr);
      if (!v) return;
      let abs;
      try { abs = new URL(v, this.pageOrigin).href; }
      catch { return; }
      el.setAttribute(this.attr, `${this.workerOrigin}?url=${encodeURIComponent(abs)}`);
    }
  }
  
  class StyleAttrRewriter {
    constructor(workerOrigin, pageOrigin) {
      this.workerOrigin = workerOrigin;
      this.pageOrigin   = pageOrigin;
    }
    element(el) {
      let s = el.getAttribute('style');
      if (!s) return;
      s = s.replace(/url\((['"]?)(.*?)\1\)/g, (_, q, u) => {
        let abs; try { abs = new URL(u, this.pageOrigin).href; } catch { return `url(${q}${u}${q})`; }
        const p = `${this.workerOrigin}?url=${encodeURIComponent(abs)}`;
        return `url(${q}${p}${q})`;
      });
      el.setAttribute('style', s);
    }
  }
  
  class StyleTagRewriter {
    constructor(workerOrigin, pageOrigin) {
      this.workerOrigin = workerOrigin;
      this.pageOrigin   = pageOrigin;
    }
    text(t) {
      const r = t.text.replace(
        /url\((['"]?)(.*?)\1\)/g,
        (_, q, u) => {
          let abs; try { abs = new URL(u, this.pageOrigin).href; } catch { return `url(${q}${u}${q})`; }
          const p = `${this.workerOrigin}?url=${encodeURIComponent(abs)}`;
          return `url(${q}${p}${q})`;
        }
      );
      t.replace(r);
    }
  }
  
  class MetaRewriter {
    constructor(workerOrigin, pageOrigin) {
      this.workerOrigin = workerOrigin;
      this.pageOrigin   = pageOrigin;
    }
    element(el) {
      let c = el.getAttribute('content');
      if (!c) return;
      const parts = c.split(';');
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i].trim();
        if (p.toLowerCase().startsWith('url=')) {
          const orig = p.slice(4);
          let abs; try { abs = new URL(orig, this.pageOrigin).href; } catch { continue; }
          parts[i] = 'url=' + encodeURIComponent(abs);
        }
      }
      el.setAttribute('content', parts.join(';'));
    }
  }
  