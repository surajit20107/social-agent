const express = require('express');
const router = express.Router();
const axios = require('axios');

const ZERNIO_BASE = 'https://zernio.com/api/v1';

// Proxy middleware for all Zenrio API calls
router.all('/:zenrioPath(*)', async (req, res) => {
  try {
    const apiKey = req.headers['x-zenrio-api-key'] || process.env.ZERNIO_API_KEY;
    if (!apiKey) {
      return res.status(401).json({ error: 'Zenrio API key not configured' });
    }

    const zenrioPath = req.params.zenrioPath || '';
    const url = `${ZERNIO_BASE}/${zenrioPath}`;

    // Forward query params
    const params = { ...req.query };

    // Build headers
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      // Keep Content-Type explicit for JSON bodies; some endpoints may be strict.
      'Content-Type': 'application/json',
    };

    const isGet = req.method === 'GET';
    const hasBody = req.body && Object.keys(req.body).length > 0;

    console.log(`[Zenrio Proxy] ${req.method} ${req.originalUrl} -> ${url}`);
    if (!isGet) {
      console.log(`[Zenrio Proxy] forwarded body present=${hasBody}:`, hasBody ? req.body : {});
    }
    if (isGet) {
      console.log(`[Zenrio Proxy] forwarded query params:`, params);
    }

    const response = await axios({
      method: req.method,
      url,
      headers,
      // Only forward body when one exists; avoids sending {} for endpoints that expect specific schema.
      data: !isGet && hasBody ? req.body : undefined,
      params: isGet ? params : undefined,
      timeout: 30000,
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      // Zenrio API responded with an error
      console.error(`[Zenrio Proxy Error] ${error.response.status}:`, error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else if (error.request) {
      // No response received
      console.error('[Zenrio Proxy Error] No response:', error.message);
      res.status(502).json({ error: 'Failed to reach Zenrio API', details: error.message });
    } else {
      // Request setup error
      console.error('[Zenrio Proxy Error]', error.message);
      res.status(500).json({ error: 'Internal proxy error', details: error.message });
    }
  }
});

module.exports = router;