const fetch = require('node-fetch');

async function run() {
  try {
    const res = await fetch('http://localhost:3000/api/finance/payment-requests');
    const data = await res.json();
    console.log("Cleanup not implemented securely here, skipping script.");
  } catch(e) {
  }
}
run();
