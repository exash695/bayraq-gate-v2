const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SCHOOLS = [
  { id: 'school1', name: 'ثانوية أوائل غماس الأهلية', type: 'التميز في التعليم الأساسي', color: '#FFD600', secondary: '#0B132B' },
  { id: 'school2', name: 'ثانوية النخبة العلمية للبنين', type: 'رعاية الموهبة والإبداع', color: '#00E5FF', secondary: '#051F14' },
  { id: 'school3', name: 'ثانوية نون والقلم الأهلية', type: 'صرح تربوي متميز', color: '#E040FB', secondary: '#041824' },
  { id: 'school4', name: 'ثانوية النبأ العظيم الأهلية للبنات', type: 'جيل واعد ومبدع', color: '#FF4081', secondary: '#240614' },
  { id: 'school5', name: 'مدارس ابن عقيل الأهلية', type: 'التميز الأكاديمي', color: '#00E676', secondary: '#241404' },
  { id: 'school6', name: 'مدرسة اليمامة الابتدائية', type: 'تأسيس قويم وتربية', color: '#FF9100', secondary: '#061924' },
  { id: 'school7', name: 'مدارس الجواهري الأهلية', type: 'منارة العلم والأدب', color: '#7C4DFF', secondary: '#190624' },
  { id: 'school8', name: 'معهد إبداعنا للتعليم المطور', type: 'تقوية مركزية وتطوير', color: '#FF1744', secondary: '#24060E' },
];

async function generateAllAssets() {
  console.log('🚀 Starting Bairaq School Cards & Logos Generator...');

  if (!fs.existsSync('public/schools')) {
    fs.mkdirSync('public/schools', { recursive: true });
  }
  if (!fs.existsSync('public/school-logos')) {
    fs.mkdirSync('public/school-logos', { recursive: true });
  }

  // Load Captain Bairaq base image
  const welcomePath = 'public/mascot/welcome.png';
  if (!fs.existsSync(welcomePath)) {
    throw new Error('Base mascot image public/mascot/welcome.png not found!');
  }

  // Prepare 1200x800 base background of Captain Bairaq
  const bairaqBaseBuffer = await sharp(welcomePath)
    .resize(1200, 800, { fit: 'cover', position: 'center' })
    .toBuffer();

  // 1. GENERATE BAIRAQ SCHOOL CARDS (Captain Bairaq holding school banner)
  for (const school of SCHOOLS) {
    const width = 1200;
    const height = 800;

    const cardSvg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Dark Bottom Overlay Gradient -->
        <linearGradient id="bottomGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#000000" stop-opacity="0.0"/>
          <stop offset="40%" stop-color="#030712" stop-opacity="0.65"/>
          <stop offset="100%" stop-color="#02040A" stop-opacity="0.95"/>
        </linearGradient>

        <!-- Gold Border Gradient -->
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#BF953F"/>
          <stop offset="25%" stop-color="#FCF6BA"/>
          <stop offset="50%" stop-color="#B38728"/>
          <stop offset="75%" stop-color="#FBF5B7"/>
          <stop offset="100%" stop-color="#AA771C"/>
        </linearGradient>

        <!-- Badge Inner Gradient -->
        <linearGradient id="badgeBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0A1026" stop-opacity="0.95"/>
          <stop offset="100%" stop-color="#030714" stop-opacity="0.98"/>
        </linearGradient>

        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="12" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <!-- Bottom Dark Vignette Overlay -->
      <rect x="0" y="350" width="${width}" height="450" fill="url(#bottomGrad)"/>

      <!-- Glowing Theme Accent Circle on Side -->
      <circle cx="600" cy="700" r="400" fill="${school.color}" opacity="0.15" filter="url(#glow)"/>

      <!-- Centered Banner holding School Name -->
      <g transform="translate(600, 680)">
        <!-- Outer Glow Shadow -->
        <rect x="-480" y="-70" width="960" height="130" rx="30" fill="#000000" opacity="0.6" filter="url(#glow)"/>

        <!-- Main Banner Frame -->
        <rect x="-460" y="-60" width="920" height="114" rx="26" fill="url(#badgeBg)" stroke="url(#goldGrad)" stroke-width="4.5"/>
        <rect x="-450" y="-50" width="900" height="94" rx="20" fill="none" stroke="${school.color}" stroke-width="2" stroke-opacity="0.75"/>

        <!-- School Name Text -->
        <text x="0" y="2" font-family="'Tajawal', 'Noto Sans Arabic', 'Segoe UI', sans-serif" font-size="38" font-weight="900" fill="#FFFFFF" text-anchor="middle">
          ${school.name}
        </text>

        <!-- Slogan / Subtitle Badge -->
        <text x="0" y="32" font-family="'Tajawal', 'Noto Sans Arabic', 'Segoe UI', sans-serif" font-size="18" font-weight="800" fill="url(#goldGrad)" text-anchor="middle">
          🚩 مَيدانُ بَيرَق  •  ${school.type}
        </text>
      </g>
    </svg>
    `;

    const svgBuffer = Buffer.from(cardSvg);
    const compositePng = await sharp(bairaqBaseBuffer)
      .composite([{ input: svgBuffer }])
      .png()
      .toBuffer();

    fs.writeFileSync(`public/schools/${school.id}.png`, compositePng);
    console.log(`✅ Generated Bairaq Card for ${school.id}: public/schools/${school.id}.png (${compositePng.length} bytes)`);
  }

  // 2. GENERATE OFFICIAL CIRCULAR LOGOS (For Digital Receipts)
  for (const school of SCHOOLS) {
    const size = 500;
    const center = size / 2;

    const logoSvg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="goldRing" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#BF953F"/>
          <stop offset="25%" stop-color="#FCF6BA"/>
          <stop offset="50%" stop-color="#B38728"/>
          <stop offset="75%" stop-color="#FBF5B7"/>
          <stop offset="100%" stop-color="#AA771C"/>
        </linearGradient>

        <linearGradient id="innerBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#18181B"/>
          <stop offset="100%" stop-color="#09090B"/>
        </linearGradient>

        <path id="textArcTop" d="M 60, 250 A 190, 190 0 1, 1 440, 250" fill="none"/>
        <path id="textArcBottom" d="M 440, 250 A 190, 190 0 0, 1 60, 250" fill="none"/>
      </defs>

      <!-- Outer Gold Ring -->
      <circle cx="${center}" cy="${center}" r="240" fill="#0A0F1D" stroke="url(#goldRing)" stroke-width="12"/>
      <circle cx="${center}" cy="${center}" r="226" fill="none" stroke="url(#goldRing)" stroke-width="3" stroke-dasharray="6,4"/>

      <!-- Inner Dark Canvas -->
      <circle cx="${center}" cy="${center}" r="210" fill="url(#innerBg)" stroke="${school.color}" stroke-width="4"/>

      <!-- School Emblem Center Badge -->
      <circle cx="${center}" cy="${center}" r="120" fill="#121624" stroke="url(#goldRing)" stroke-width="5"/>
      <circle cx="${center}" cy="${center}" r="110" fill="none" stroke="${school.color}" stroke-width="2" stroke-opacity="0.5"/>

      <!-- Center Crest -->
      <g transform="translate(${center}, ${center})">
        <path d="M-45,-40 L0,-75 L45,-40 L35,40 L0,65 L-35,40 Z" fill="none" stroke="url(#goldRing)" stroke-width="5"/>
        <polygon points="0,-35 10,-10 35,-10 15,5 22,30 0,15 -22,30 -15,5 -35,-10 -10,-10" fill="url(#goldRing)"/>
        <text x="0" y="90" font-family="'Tajawal', 'Noto Sans Arabic', sans-serif" font-size="16" font-weight="900" fill="#FFFFFF" text-anchor="middle">
          بوابة بيرق
        </text>
      </g>

      <!-- School Name (Top Arc Area) -->
      <text font-family="'Tajawal', 'Noto Sans Arabic', sans-serif" font-size="24" font-weight="900" fill="#FFFFFF" text-anchor="middle">
        <textPath href="#textArcTop" startOffset="50%" text-anchor="middle">
          ${school.name}
        </textPath>
      </text>

      <!-- Subtitle (Bottom Arc Area) -->
      <text font-family="'Tajawal', 'Noto Sans Arabic', sans-serif" font-size="16" font-weight="700" fill="url(#goldRing)" text-anchor="middle">
        <textPath href="#textArcBottom" startOffset="50%" text-anchor="middle">
          • إِدارَةُ المَدْرَسَةِ  •  مُوَثَّقٌ إِلكتْرونِيّاً •
        </textPath>
      </text>
    </svg>
    `;

    const logoPngBuffer = await sharp(Buffer.from(logoSvg)).png().toBuffer();
    fs.writeFileSync(`public/school-logos/${school.id}.png`, logoPngBuffer);
    console.log(`✅ Generated Circular Logo for ${school.id}: public/school-logos/${school.id}.png (${logoPngBuffer.length} bytes)`);
  }

  // Fallback default circular logo
  const defaultLogoSvg = `
  <svg width="500" height="500" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="goldRing" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#BF953F"/>
        <stop offset="25%" stop-color="#FCF6BA"/>
        <stop offset="50%" stop-color="#B38728"/>
        <stop offset="75%" stop-color="#FBF5B7"/>
        <stop offset="100%" stop-color="#AA771C"/>
      </linearGradient>
      <path id="arcTop" d="M 60, 250 A 190, 190 0 1, 1 440, 250" fill="none"/>
      <path id="arcBottom" d="M 440, 250 A 190, 190 0 0, 1 60, 250" fill="none"/>
    </defs>
    <circle cx="250" cy="250" r="240" fill="#0A0F1D" stroke="url(#goldRing)" stroke-width="12"/>
    <circle cx="250" cy="250" r="210" fill="#121624" stroke="#FFD600" stroke-width="4"/>
    <circle cx="250" cy="250" r="120" fill="#050A18" stroke="url(#goldRing)" stroke-width="5"/>
    <g transform="translate(250, 250)">
      <polygon points="0,-45 13,-13 45,-13 20,7 28,40 0,20 -28,40 -20,7 -45,-13 -13,-13" fill="url(#goldRing)"/>
    </g>
    <text font-family="'Tajawal', 'Noto Sans Arabic', sans-serif" font-size="24" font-weight="900" fill="#FFFFFF" text-anchor="middle">
      <textPath href="#arcTop" startOffset="50%" text-anchor="middle">
        إدارة المؤسسات التعليمية الأهلية
      </textPath>
    </text>
    <text font-family="'Tajawal', 'Noto Sans Arabic', sans-serif" font-size="16" font-weight="700" fill="url(#goldRing)" text-anchor="middle">
      <textPath href="#arcBottom" startOffset="50%" text-anchor="middle">
        • بَوّابَةُ بَيرَق  •  خَتْمٌ مُعْتَمَدٌ •
      </textPath>
    </text>
  </svg>
  `;

  const defaultPng = await sharp(Buffer.from(defaultLogoSvg)).png().toBuffer();
  fs.writeFileSync('public/school-logo.png', defaultPng);
  console.log('✅ Updated public/school-logo.png');

  console.log('🎉 ALL BAIRAQ SCHOOL ASSETS GENERATED SUCCESSFULLY!');
}

generateAllAssets().catch(err => {
  console.error('❌ Asset generation error:', err);
  process.exit(1);
});
