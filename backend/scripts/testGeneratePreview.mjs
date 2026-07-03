(async () => {
  try {
    const base = 'http://localhost:5000/api';

    const loginRes = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@pragyan.com', password: 'admin17052005' }),
    });

    const loginJson = await loginRes.json();
    console.log('LOGIN:', JSON.stringify(loginJson, null, 2));

    const token = loginJson?.data?.accessToken || loginJson?.accessToken || (loginJson?.data && loginJson.data.accessToken) || null;
    if (!token) {
      console.error('No access token received; aborting');
      process.exit(2);
    }

    console.log('Using token:', token.slice(0, 20) + '...');

    const genRes = await fetch(`${base}/admin/generate-roadmap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ careerName: 'Data Scientist' }),
    });

    const genJson = await genRes.json();
    console.log('GENERATE RESPONSE:', JSON.stringify(genJson, null, 2));
  } catch (err) {
    console.error('ERROR', err);
    process.exit(1);
  }
})();
