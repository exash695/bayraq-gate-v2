const buffer = Buffer.alloc(10 * 1024 * 1024); // 10MB
const formData = new FormData();
formData.append('file', new Blob([buffer]), 'large.txt');
fetch('http://localhost:3000/api/upload', {
  method: 'POST',
  body: formData
}).then(res => {
    console.log("Status:", res.status);
    console.log("Headers:", res.headers.get('content-type'));
    return res.text();
}).then(console.log);
