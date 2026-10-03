const apiBaseUrl = process.env.CUSVYA_API_BASE_URL || 'http://10.0.2.2:8090';

export async function registerCustomerWithApi(idToken, name) {
  const response = await fetch(`${apiBaseUrl}/api/auth/mobile-register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, name }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Mobile auth failed with status ${response.status}`);
  }

  return response.json();
}

