(async () => {
  try {
    const base = 'http://localhost:3000';

    const regRes = await fetch(`${base}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test+feedback@local.test',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        fullName: 'Test User',
        role: 'STUDENT'
      })
    });
    console.log('Register status:', regRes.status);
    console.log('Register body:', await regRes.text());

    const loginRes = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test+feedback@local.test', password: 'Password123!' })
    });
    console.log('Login status:', loginRes.status);
    const loginJson = await loginRes.json().catch(() => null);
    console.log('Login body:', loginJson);

    const token = loginJson?.data?.accessToken || (loginJson?.data?.access && loginJson.data.access.accessToken);
    console.log('Extracted token:', token);

    const fbRes = await fetch(`${base}/api/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ category: 'GENERAL', title: 'E2E Test', description: 'Feedback end-to-end test', priority: 'LOW' })
    });
    console.log('Feedback status:', fbRes.status);
    console.log('Feedback body:', await fbRes.text());
  } catch (err) {
    console.error('Error during e2e test:', err);
  }
})();
