const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SCHOOLS = [
  { id: 'school1', name: 'ثانوية أوائل غماس الأهلية', type: 'التميز في التعليم الأساسي', color: '#FFD600', secondary: '#0B132B' },
  { id: 'school2', name: 'ثانوية النخبة العلمية للبنين', type: 'رعاية الموهبة والإبداع', color: '#00E676', secondary: '#051F14' },
  { id: 'school3', name: 'ثانوية نون والقلم الأهلية', type: 'صرح تربوي متميز', color: '#00E5FF', secondary: '#041824' },
  { id: 'school4', name: 'ثانوية النبأ العظيم الأهلية للبنات', type: 'جيل واعد ومبدع', color: '#FF4081', secondary: '#240614' },
  { id: 'school5', name: 'مدارس ابن عقيل الأهلية', type: 'التميز الأكاديمي', color: '#FF9100', secondary: '#241404' },
  { id: 'school6', name: 'مدرسة اليمامة الابتدائية', type: 'تأسيس قويم وتربية', color: '#38BDF8', secondary: '#061924' },
  { id: 'school7', name: 'مدارس الجواهري الأهلية', type: 'منارة العلم والأدب', color: '#A855F7', secondary: '#190624' },
  { id: 'school8', name: 'معهد إبداعنا للتعليم المطور', type: 'تقوية مركزية وتطوير', color: '#F43F5E', secondary: '#24060E' },
];

async function generateAssets() {
  // Ensure directories exist
  if (!fs.existsSync('public/schools')) {
    fs.mkdirSync('public/schools', { recursive: true });
  }
  if (!fs.existsSync('public/school-logos')) {
    fs.mkdirSync('public/school-logos', { recursive: true });
  }

  // Load Bayraq mascot image if available
  let bayraqBase = null;
  if (fs.existsSync('public/schools/school1.png')) {
    try {
      bayraqBase = await sharp('public/schools/school1.png').resize(1200, 800, { fit: 'cover' }).toBuffer();
    } catch (e) {
      console.log('Base school1.png load error:', e.message);
    }
  }

  // 1. GENERATE SCHOOL CARDS (Captain Bayraq holding school name)
  for (const school of SCHOOLS) {
    const width = 1200;
    const height = 800;

    const cardSvg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${school.secondary}" stop-opacity="0.95"/>
          <stop offset="50%" stop-color="#02050F" stop-opacity="0.85"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0.95"/>
        </linearGradient>

        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#BF953F"/>
          <stop offset="25%" stop-color="#FCF6BA"/>
          <stop offset="50%" stop-color="#B38728"/>
          <stop offset="75%" stop-color="#FBF5B7"/>
          <stop offset="100%" stop-color="#AA771C"/>
        </linearGradient>

        <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#090E1F"/>
          <stop offset="100%" stop-color="#141E38"/>
        </linearGradient>

        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="15" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <!-- Background Dark Overlay -->
      <rect width="${width}" height="${height}" fill="url(#bgGrad)" />

      <!-- Glowing Accent Circle -->
      <circle cx="600" cy="350" r="320" fill="${school.color}" opacity="0.12" filter="url(#glow)"/>

      <!-- Eagle Wings / Shield Stylized Graphic Silhouette -->
      <g transform="translate(600, 320)" opacity="0.18">
        <path d="M-220,-120 L0,-240 L220,-120 L160,160 L0,220 L-160,160 Z" fill="none" stroke="${school.color}" stroke-width="6"/>
        <path d="M-180,-100 L0,-200 L180,-100 L130,130 L0,180 L-130,130 Z" fill="none" stroke="url(#goldGrad)" stroke-width="3"/>
      </g>

      <!-- Centered Banner holding School Name -->
      <g transform="translate(600, 620)">
        <!-- Banner Shadow -->
        <rect x="-420" y="-60" width="840" height="110" rx="30" fill="#000000" opacity="0.6" filter="url(#glow)"/>

        <!-- Outer Gold Border Frame -->
        <rect x="-400" y="-50" width="800" height="100" rx="24" fill="url(#badgeGrad)" stroke="url(#goldGrad)" stroke-width="5"/>
        <rect x="-392" y="-42" width="784" height="84" rx="18" fill="none" stroke="${school.color}" stroke-width="2" stroke-opacity="0.6"/>

        <!-- Eagle Crest Icon -->
        <g transform="translate(-340, 0)">
          <circle cx="0" cy="0" r="28" fill="url(#goldGrad)" />
          <path d="M-12,-10 L0,-20 L12,-10 L8,12 L0,18 L-8,12 Z" fill="#02050F"/>
        </g>

        <!-- School Name Text -->
        <text x="20" y="12" font-family="'Tajawal', 'Noto Sans Arabic', 'Segoe UI', sans-serif" font-size="38" font-weight="900" fill="#FFFFFF" text-anchor="middle">
          ${school.name}
        </text>

        <!-- Subtitle Badge -->
        <text x="20" y="38" font-family="'Tajawal', 'Noto Sans Arabic', 'Segoe UI', sans-serif" font-size="16" font-weight="700" fill="url(#goldGrad)" text-anchor="middle">
          🏴‍☠️ مَيدان بَيرَق لِلتَّفَوُّقِ وَالرِّيادَةِ
        </text>
      </g>
    </svg>
    `;

    const svgBuffer = Buffer.from(cardSvg);
    let compositeInput;

    if (bayraqBase) {
      compositeInput = await sharp(bayraqBase)
        .composite([{ input: svgBuffer }])
        .jpeg({ quality: 92 })
        .toBuffer();
    } else {
      compositeInput = await sharp(svgBuffer).jpeg({ quality: 92 }).toBuffer();
    }

    fs.writeFileSync(`public/schools/${school.id}.png`, compositeInput);
    console.log(`Created card image for ${school.id}: public/schools/${school.id}.png`);
  }

  // 2. GENERATE OFFICIAL CIRCULAR SCHOOL LOGOS (For Digital Receipts)
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

        <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${school.color}"/>
          <stop offset="100%" stop-color="#FFD600"/>
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

      <!-- Center Icon Graphic (Star + Crest) -->
      <g transform="translate(${center}, ${center})">
        <!-- Shield -->
        <path d="M-45,-40 L0,-75 L45,-40 L35,40 L0,65 L-35,40 Z" fill="none" stroke="url(#goldRing)" stroke-width="5"/>
        <path d="M-35,-30 L0,-60 L35,-30 L26,30 L0,50 L-26,30 Z" fill="${school.color}" opacity="0.25"/>

        <!-- Star -->
        <polygon points="0,-35 10,-10 35,-10 15,5 22,30 0,15 -22,30 -15,5 -35,-10 -10,-10" fill="url(#goldRing)"/>

        <!-- Bayraq Text -->
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
    console.log(`Created circular logo for ${school.id}: public/school-logos/${school.id}.png`);
  }

  // Also update public/school-logo.png as a default fallback circular logo
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
  console.log('Updated public/school-logo.png');
}

generateAssets().catch(err => console.error('Asset generation failed:', err));
