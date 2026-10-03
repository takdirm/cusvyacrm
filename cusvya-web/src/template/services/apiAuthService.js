const apiBaseUrl =
  window?.runtimeConfig?.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_ENDPOINT?.replace(/\/api\/?$/, '') ||
  'http://localhost:8090';

export async function validateWebLoginWithApi(idToken) {
  const response = await fetch(`${apiBaseUrl}/api/auth/web-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `API login failed with status ${response.status}`);
  }

  return response.json();
}
