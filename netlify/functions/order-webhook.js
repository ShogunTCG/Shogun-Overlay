const { getStore } = require('@netlify/blobs');

exports.handler = async function(event, context) {
  // Only accept POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const store = getStore('queue');
    const order = JSON.parse(event.body);

    // Extract relevant info
    const queueItem = {
      id: order.id.toString(),
      name: order.billing_address?.first_name || order.email?.split('@')[0] || 'Klant',
      product: order.line_items?.[0]?.name || 'Bestelling',
      total: order.total_price,
      status: 'waiting', // waiting, live, done
      timestamp: new Date().toISOString()
    };

    // Get existing queue
    let queue = [];
    try {
      const existing = await store.get('current-queue', { type: 'json' });
      if (existing) queue = existing;
    } catch(e) {}

    // Add to queue (only waiting and live items)
    queue = queue.filter(i => i.status !== 'done');
    queue.push(queueItem);

    // Save queue
    await store.set('current-queue', JSON.stringify(queue));

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch(e) {
    console.error(e);
    return { statusCode: 500, body: JSON.stringify({ error: e.toString() }) };
  }
};
