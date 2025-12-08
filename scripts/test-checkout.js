const http = require('http');

const data = JSON.stringify({
  galleryId: '4b8e9c25-fee4-4a09-9415-b050bb83bba3',
  clientEmail: 'nathaniel.crowell12+qatest@gmail.com'
});

const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/api/stripe/public-checkout',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('Making request to public-checkout...');
console.log('Gallery ID:', '4b8e9c25-fee4-4a09-9415-b050bb83bba3');
console.log('Client Email:', 'nathaniel.crowell12+qatest@gmail.com');

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('\n=== Response ===');
    console.log('Status:', res.statusCode);
    try {
      const json = JSON.parse(body);
      console.log('URL:', json.url ? json.url.substring(0, 100) + '...' : 'N/A');
      console.log('Session ID:', json.sessionId || 'N/A');
      if (json.error) console.log('Error:', json.error);
    } catch (e) {
      console.log('Raw Response:', body.substring(0, 500));
    }
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error('Request Error:', e.message);
  process.exit(1);
});

req.write(data);
req.end();
