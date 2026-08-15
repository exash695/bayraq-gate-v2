const fs = require('fs');
fetch('http://localhost:3000/api/upload', {
  method: 'POST'
}).then(res => {
    console.log("Status:", res.status);
    console.log("Headers:", res.headers.get('content-type'));
    return res.text();
}).then(console.log);
