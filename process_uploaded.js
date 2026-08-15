const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Ensure directories exist
const schoolsDir = path.join(__dirname, 'public', 'schools');
const schoolLogosDir = path.join(__dirname, 'public', 'school-logos');

if (!fs.existsSync(schoolsDir)) fs.mkdirSync(schoolsDir, { recursive: true });
if (!fs.existsSync(schoolLogosDir)) fs.mkdirSync(schoolLogosDir, { recursive: true });

console.log("Helper script created.");
