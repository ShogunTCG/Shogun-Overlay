const { getDeployStore } = require('@netlify/blobs');

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const store = getDeployStore('queue');
    const method = event.httpMethod;

    if (method === 'GET') {
      let queue = [];
      try {
        const existing = await store.get('current-queue', { type: 'json' });
        if (existing) queue = existing;
      } catch(e) { queue = []; }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ queue: queue.filter(i => i.status !== 'done') })
      };
    }

    if (method === 'POST') {
      const body = JSON.parse(event.body);
      const { id, status } = body;

      let queue = [];
      try {
        const existing = await store.get('current-queue', { type: 'json' });
        if (existing) queue = existing;
      } catch(e) { queue = []; }

      queue = queue.map(item => item.id === id ? { ...item, status } : item);
      queue = queue.filter(i => i.status !== 'done');

      await store.set('current-queue', JSON.stringify(queue));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, queue })
      };
    }

    return { statusCode: 405, headers, body: 'Method not allowed' };
  } catch(e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.toString() }) };
  }
};
