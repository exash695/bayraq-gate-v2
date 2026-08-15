import fs from 'fs';
import path from 'path';

async function download() {
  const dir = path.join('android', 'gradle', 'wrapper');
  const dest = path.join(dir, 'gradle-wrapper.jar');
  const url = 'https://raw.githubusercontent.com/gradle/gradle/v8.14.3/gradle/wrapper/gradle-wrapper.jar';

  if (fs.existsSync(dest)) {
    console.log('gradle-wrapper.jar already exists at', dest, '. Skipping download.');
    return;
  }

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  console.log('Downloading gradle-wrapper.jar from:', url);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(dest, Buffer.from(buffer));
    console.log('gradle-wrapper.jar downloaded successfully to', dest);
  } catch (err) {
    console.warn('Warning: Error downloading gradle-wrapper.jar:', err.message);
    console.warn('Skipping gradle-wrapper.jar download since it is only needed for local Android builds, not for Web production.');
    // Do not fail the build by exiting with code 1
  }
}

download();
