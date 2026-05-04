const { getStore } = require('@netlify/blobs');

const SITE_ID = '0633c672-41db-4731-abeb-473d854a7653';
const TOKEN = 'nfp_AeTB2aQTVG9ZcwvtE9iZaxX2MUuuEjuF106b';

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const store = getStore({ name: 'queue', siteID: SITE_ID, token: TOKEN });
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
