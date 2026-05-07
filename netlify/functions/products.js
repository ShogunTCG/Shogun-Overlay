const CACHE_TTL = 900; // 15 minuten

let cache = null;
let cacheTime = 0;

exports.handler = async function(event, context) {
  const now = Date.now();

  // Geef cache terug als die nog geldig is
  if (cache && (now - cacheTime) < CACHE_TTL * 1000) {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=900'
      },
      body: cache
    };
  }

  const url = 'https://shoguntcg.myshopify.com/collections/livestream-overlay/products.json';

  try {
    const response = await fetch(url);
    const data = await response.json();

    const products = data.products.map(p => ({
      title: p.title,
      price: p.variants[0].price,
      image: p.images[0]?.src || '',
      available: p.variants[0].available,
      tags: p.tags
    }));

    cache = JSON.stringify({ products });
    cacheTime = now;

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=900'
      },
      body: cache
    };
  } catch(e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e.toString() })
    };
  }
};
