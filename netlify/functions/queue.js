const { getStore } = require('@netlify/blobs');

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const store = getStore('queue');
    const method = event.httpMethod;

    // GET - return queue
    if (method === 'GET') {
      let queue = [];
      try {
        const existing = await store.get('current-queue', { type: 'json' });
        if (existing) queue = existing;
      } catch(e) {}
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ queue: queue.filter(i => i.status !== 'done') })
      };
    }

    // POST - update item status
    if (method === 'POST') {
      const body = JSON.parse(event.body);
      const { id, status } = body;

      let queue = [];
      try {
        const existing = await store.get('current-queue', { type: 'json' });
        if (existing) queue = existing;
      } catch(e) {}

      // Update status
      queue = queue.map(item => 
        item.id === id ? { ...item, status } : item
      );

      // Remove done items older than 1 hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      queue = queue.filter(i => i.status !== 'done' || i.timestamp > oneHourAgo);

      await store.set('current-queue', JSON.stringify(queue));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, queue: queue.filter(i => i.status !== 'done') })
      };
    }

    return { statusCode: 405, headers, body: 'Method not allowed' };
  } catch(e) {
    console.error(e);
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.toString() }) };
  }
};
