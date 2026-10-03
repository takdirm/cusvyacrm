const { createProxyMiddleware } = require('http-proxy-middleware');
const https = require('https');

const parseProxyTarget = () => {
  const configuredEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:4080/api/';

  try {
    const parsed = new URL(configuredEndpoint);
    return parsed.origin;
  } catch (error) {
    return 'http://localhost:4080';
  }
};

const PROXY_TARGET = parseProxyTarget();

// Custom agent that skips SSL cert verification for development proxy
const agent = new https.Agent({ rejectUnauthorized: false });

module.exports = function (app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: PROXY_TARGET,
      changeOrigin: true,
      secure: false,
      agent,
      timeout: 120000,
      proxyTimeout: 120000,
      onProxyReq: (proxyReq, req, res) => {
        console.log(`[Proxy] ${req.method} ${req.path} -> ${PROXY_TARGET}${req.path}`);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log(`[Proxy] Response: ${proxyRes.statusCode} for ${req.path}`);
      },
      onError: (err, req, res) => {
        console.error(`[Proxy Error] ${req.path}:`, err.message);
        res.writeHead(500, {
          'Content-Type': 'text/plain',
        });
        res.end('Proxy error: ' + err.message);
      },
    }),
  );
};
