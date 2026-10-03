import React, { useState } from 'react';

// Standalone API test page - no Redux, no DataService, no axios
// Purpose: diagnose raw HTTP fetch issues

const DIRECT_URL = 'https://api.scootr.in/api/Customer/paged?page=1&pageSize=5';
const PROXY_URL = '/api/Customer/paged?page=1&pageSize=5';

const TESTS = [
  {
    label: '1. Direct HTTPS - no auth, no proxy',
    run: () => fetch(DIRECT_URL),
  },
  {
    label: '2. Direct HTTPS - no auth, no proxy, explicit Accept header',
    run: () => fetch(DIRECT_URL, { headers: { Accept: 'application/json' } }),
  },
  {
    label: '3. Proxy /api - no auth',
    run: () => fetch(PROXY_URL),
  },
  {
    label: '4. Proxy /api - with Accept header, no auth',
    run: () => fetch(PROXY_URL, { headers: { Accept: 'application/json' } }),
  },
];

function ApiTestPage() {
  const [results, setResults] = useState([]);
  const [running, setRunning] = useState(false);

  const allTokens = {
    authToken: localStorage.getItem('authToken'),
    access_token: localStorage.getItem('access_token'),
    token: localStorage.getItem('token'),
  };

  const allLocalStorage = (() => {
    const items = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const val = localStorage.getItem(key);
      items[key] = val?.length > 100 ? val.substring(0, 100) + '...' : val;
    }
    return items;
  })();

  const runTests = async () => {
    setRunning(true);
    setResults([]);

    const out = [];

    for (const test of TESTS) {
      const entry = { label: test.label, status: 'running', time: null, body: null, error: null };
      out.push(entry);
      setResults([...out]);

      const start = Date.now();
      try {
        const response = await test.run();
        const elapsed = Date.now() - start;
        // Always read raw text first so we can show it even if JSON parse fails
        const rawText = await response.text();
        let body = null;
        let bodyError = null;
        try {
          body = JSON.parse(rawText);
        } catch (e) {
          bodyError = `Raw response (not JSON):\n${rawText}`;
        }
        entry.status = response.ok ? 'ok' : 'http-error';
        entry.httpStatus = `${response.status} ${response.statusText}`;
        entry.time = elapsed + 'ms';
        entry.body = body;
        entry.bodyError = bodyError;
      } catch (e) {
        entry.status = 'network-error';
        entry.error = e.message;
        entry.time = Date.now() - start + 'ms';
      }

      setResults([...out]);
    }

    setRunning(false);
  };

  const statusColor = (s) => {
    if (s === 'ok') return '#52c41a';
    if (s === 'running') return '#1890ff';
    return '#ff4d4f';
  };

  return (
    <div style={{ padding: 32, fontFamily: 'monospace', maxWidth: 900 }}>
      <h2 style={{ fontFamily: 'sans-serif' }}>API Diagnostic Test Page</h2>

      <section style={{ marginBottom: 24 }}>
        <h3 style={{ fontFamily: 'sans-serif' }}>LocalStorage Keys Found</h3>
        <pre
          style={{
            background: '#f5f5f5',
            padding: 12,
            borderRadius: 6,
            fontSize: 12,
            overflowX: 'auto',
          }}
        >
          {JSON.stringify(allLocalStorage, null, 2)}
        </pre>

        <h3 style={{ fontFamily: 'sans-serif' }}>Token Values</h3>
        <pre
          style={{
            background: '#f5f5f5',
            padding: 12,
            borderRadius: 6,
            fontSize: 12,
            overflowX: 'auto',
          }}
        >
          {JSON.stringify(allTokens, null, 2)}
        </pre>

        <p style={{ fontFamily: 'sans-serif', color: '#666', fontSize: 13 }}>
          <b>Runtime config:</b> {JSON.stringify(window.runtimeConfig || 'not set')}
        </p>
      </section>

      <button
        onClick={runTests}
        disabled={running}
        style={{
          padding: '10px 24px',
          background: running ? '#999' : '#1890ff',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          cursor: running ? 'not-allowed' : 'pointer',
          fontFamily: 'sans-serif',
          fontSize: 15,
          marginBottom: 24,
        }}
      >
        {running ? 'Running tests...' : 'Run All Tests'}
      </button>

      {results.map((r, i) => (
        <div
          key={i}
          style={{
            marginBottom: 20,
            border: '1px solid #ddd',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              background: statusColor(r.status),
              color: '#fff',
              padding: '8px 14px',
              fontFamily: 'sans-serif',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>{r.label}</span>
            <span>
              {r.httpStatus || r.status.toUpperCase()} {r.time ? `| ${r.time}` : ''}
            </span>
          </div>
          <pre
            style={{
              margin: 0,
              padding: 12,
              fontSize: 12,
              overflowX: 'auto',
              background: '#fafafa',
              maxHeight: 300,
            }}
          >
            {r.error
              ? `❌ Network error: ${r.error}`
              : r.bodyError
                ? `⚠️ ${r.bodyError}`
                : r.body
                  ? JSON.stringify(r.body, null, 2)
                  : r.status === 'running'
                    ? '⏳ Waiting...'
                    : '(no body)'}
          </pre>
        </div>
      ))}
    </div>
  );
}

export default ApiTestPage;
