const https = require('https');
const url = "https://nominatim.openstreetmap.org/search?format=json&q=school+in+Ghammas,Iraq";
https.get(url, { headers: { 'User-Agent': 'NodeJS' } }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
});
