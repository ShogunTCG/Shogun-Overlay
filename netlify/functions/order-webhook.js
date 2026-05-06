const { getStore } = require('@netlify/blobs');

const SITE_ID = '0633c672-41db-4731-abeb-473d854a7653';
const TOKEN = 'nfp_AeTB2aQTVG9ZcwvtE9iZaxX2MUuuEjuF106b';

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const store = getStore({ name: 'queue', siteID: SITE_ID, token: TOKEN });
    const order = JSON.parse(event.body);

    const items = (order.line_items || []).map(item => ({
      name: item.name || item.title || 'Product',
      qty: item.quantity || 1,
      price: '€' + parseFloat(item.price || 0).toFixed(2).replace('.', ','),
      img: null
    }));

    const queueItem = {
      id: (order.id || Date.now()).toString() + '-' + Date.now(),
      orderNumber: order.order_number || order.name || null,
      name: order.billing_address?.first_name || order.email?.split('@')[0] || 'Klant',
      product: items[0]?.name || 'Bestelling',
      total: order.total_price || '0.00',
      items: items,
      status: 'waiting',
      timestamp: new Date().toISOString()
    };

    let queue = [];
    try {
      const existing = await store.get('current-queue', { type: 'json' });
      if (existing) queue = existing;
    } catch(e) { queue = []; }

    queue = queue.filter(i => i.status !== 'done');
    queue.push(queueItem);

    await store.set('current-queue', JSON.stringify(queue));

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch(e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.toString() }) };
  }
};
