const http = require('http');

const req = http.request({
  hostname: '127.0.0.1',
  port: 3000,
  path: '/api/gemini/extract',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  console.log('STATUS:', res.statusCode);
  res.on('data', (d) => {
    console.log('BODY:', d.toString().substring(0, 100));
  });
});
req.write('{}');
req.end();
