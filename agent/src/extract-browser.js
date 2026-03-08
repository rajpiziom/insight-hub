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

  // Aggressively remove all non-body elements from article before extraction
  const article = document.querySelector('article');
  if (article) {
    // Remove known noise elements
    article.querySelectorAll(
      'nav, footer, header, script, style, noscript, iframe, svg, ' +
      'h1, figcaption, figure, ' +
      '.advert, .newsletter-signup, .newsletter-promo, .newsletter, ' +
      '.related-articles, .article__aside, .aside, ' +
      '.recommended, .teaser, [role="complementary"], ' +
      '[role="navigation"], .sticky-nav, .article-links, ' +
      '[data-test-id="related-content"], [data-test-id="newsletter-signup"], ' +
      '[data-component="share"], [data-component="newsletter"], ' +
      '[data-component="recommended"], [data-component="article-links"], ' +
      'form, button, [class*="paywall"], [class*="gate"], ' +
      '[class*="regwall"], [class*="subscribe"], [class*="promo"], ' +
      '[class*="newsletter"], [class*="signup"], [class*="sign-up"], ' +
      '[class*="related"], [class*="more-from"], [class*="sidebar"], ' +
      '[id*="paywall"], [id*="gate"], [id*="newsletter"]'
    ).forEach(el => el.remove());
  }

  // Try paragraph-based selectors
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
        .filter(t => t.length > 20)
        .join('\\n\\n');
      if (text.length > bodyText.length) {
        bodyText = text;
      }
    }
  }

  // Fallback: get innerText from body container
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
        // Remove noise from container too
        container.querySelectorAll(
          'form, button, [class*="paywall"], [class*="gate"], ' +
          '[class*="newsletter"], [class*="subscribe"], [class*="promo"], ' +
          '[class*="related"], [class*="signup"], nav, footer, aside'
        ).forEach(el => el.remove());
        const text = container.innerText.trim();
        debug['fallback_' + sel] = text.length;
        if (text.length > bodyText.length) {
          bodyText = text;
        }
      }
    }
  }

  // Last resort: entire article innerText (already cleaned above)
  if (bodyText.length < 1500 && article) {
    const fullText = article.innerText.trim();
    debug['fallback_article_innerText'] = fullText.length;
    // Clean: remove lines that look like navigation/promo (very short lines in bulk)
    const lines = fullText.split('\\n').map(l => l.trim()).filter(l => l.length > 0);
    // Find the actual article content: paragraphs > 80 chars
    const contentLines = lines.filter(l => l.length > 80);
    const cleaned = contentLines.join('\\n\\n');
    debug['fallback_cleaned'] = cleaned.length;
    if (cleaned.length > bodyText.length) {
      bodyText = cleaned;
    }
  }

  return { title, subtitle, author, publishedAt, heroImage, bodyText, debug };
})()`;
