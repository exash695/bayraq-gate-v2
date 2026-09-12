const http = require('http');

const msg = {
  text: "Hello test",
  userId: "user_a",
  userName: "Test User A",
  userRole: "student",
  schoolId: "user_a_user_b",
  recipientId: "user_b",
  read: false
};

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/lounge-messages',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('POST Response:', data));
});
req.write(JSON.stringify(msg));
req.end();
