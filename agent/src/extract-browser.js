// This file is plain JS (not processed by esbuild/tsx) to avoid __name injection
// It's loaded via page.addScriptTag or read as a string for page.evaluate

export const scrollScript = `(async () => {
  const delay = ms => new Promise(r => setTimeout(r, ms));
  const h = document.body.scrollHeight;
  for (let y = 0; y < h; y += 500) {
    window.scrollTo(0, y);
    await delay(200);
  }
  window.scrollTo(0, 0);
})()`;

export const extractScript = `(() => {
  const getText = sel => { const el = document.querySelector(sel); return el ? el.textContent.trim() : ''; };
  const getAttr = (sel, attr) => { const el = document.querySelector(sel); return el ? (el.getAttribute(attr) || '') : ''; };

  const title =
    getText('article h1') ||
    getText('h1') ||
    getAttr('meta[property="og:title"]', 'content');

  const subtitle =
    getText('article h2') ||
    getText('.article__description') ||
    getAttr('meta[property="og:description"]', 'content') || '';

  const author =
    getText('[data-test-id="author-name"]') ||
    getAttr('meta[name="author"]', 'content') ||
    getText('.article__author') || '';

  const publishedAt =
    getAttr('meta[property="article:published_time"]', 'content') ||
    (document.querySelector('time[datetime]') ? document.querySelector('time[datetime]').getAttribute('datetime') : '') || '';

  const heroImage =
    getAttr('meta[property="og:image"]', 'content') ||
    (document.querySelector('article figure img') ? document.querySelector('article figure img').src : '') || '';

  const article = document.querySelector('article');
  if (article) {
    article.querySelectorAll(
      'nav, footer, header, script, style, ' +
      '.advert, .newsletter-signup, .newsletter-promo, ' +
      '.related-articles, .article__aside, .aside, ' +
      '.recommended, .teaser, [role="complementary"], ' +
      '[role="navigation"], .sticky-nav, .article-links, ' +
      '[data-test-id="related-content"], [data-test-id="newsletter-signup"]'
    ).forEach(el => el.remove());
  }

  // Try paragraph-based selectors first
  const bodySelectors = [
    'article [data-component="body"] p',
    'article .article__body p',
    'article [data-body-id] p',
    'article .layout-article-body p',
    '.article__body-text p',
    '[data-test-id="article-body"] p',
    'article p',
  ];

  let bodyText = '';
  const debug = {};
  for (const sel of bodySelectors) {
    const ps = document.querySelectorAll(sel);
    debug[sel] = ps.length;
    if (ps.length >= 2) {
      const text = Array.from(ps)
        .map(p => (p.textContent || '').trim())
        .filter(t => t.length > 30)
        .join('\\n\\n');
      if (text.length > bodyText.length) {
        bodyText = text;
      }
    }
  }

  // Fallback: get innerText from the article body container directly
  if (bodyText.length < 1500) {
    const containerSelectors = [
      '[data-component="body"]',
      '.article__body',
      '[data-body-id]',
      '.layout-article-body',
      '.article__body-text',
      '[data-test-id="article-body"]',
    ];
    for (const sel of containerSelectors) {
      const container = document.querySelector(sel);
      if (container) {
        const text = container.innerText.trim();
        debug['fallback_' + sel] = text.length;
        if (text.length > bodyText.length) {
          bodyText = text;
        }
      }
    }
  }

  // Last resort: entire article innerText minus title area
  if (bodyText.length < 1500 && article) {
    const fullText = article.innerText.trim();
    debug['fallback_article_innerText'] = fullText.length;
    if (fullText.length > bodyText.length) {
      bodyText = fullText;
    }
  }

  return { title, subtitle, author, publishedAt, heroImage, bodyText, debug };
})()`;
