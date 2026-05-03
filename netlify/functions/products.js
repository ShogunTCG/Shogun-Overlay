exports.handler = async function(event, context) {
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
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ products })
    };
  } catch(e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e.toString() })
    };
  }
};
