// Script to download images from Pexels using their direct image URLs
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// For this specific image from Pexels
// Photo ID: 34193227
// Direct image URL can be constructed

const PEXELS_PHOTO_ID = '34193227';
const CATEGORY = 'cards';
const FILENAME = 'elegant-accessories-bejeweled-sandals.jpg';

// Pexels direct download URL pattern
const imageUrl = `https://images.pexels.com/photos/${PEXELS_PHOTO_ID}/pexels-photo-${PEXELS_PHOTO_ID}.jpeg?auto=compress&cs=tinysrgb&w=1200`;

const targetDir = path.join(__dirname, '..', 'public', 'images', CATEGORY);
const filepath = path.join(targetDir, FILENAME);

// Ensure directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  console.log(`✓ Created directory: ${CATEGORY}/`);
}

console.log('⬇️  Downloading image from Pexels...');
console.log(`📸 Photo ID: ${PEXELS_PHOTO_ID}`);
console.log(`📁 Saving to: images/${CATEGORY}/${FILENAME}`);

// Download function that handles both http and https
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(filepath);
    
    protocol.get(url, (response) => {
      // Follow redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        console.log(`↪️  Following redirect...`);
        file.close();
        fs.unlinkSync(filepath);
        return downloadImage(redirectUrl, filepath)
          .then(resolve)
          .catch(reject);
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log('✅ Image downloaded successfully!');
        console.log(`📁 Location: public/images/${CATEGORY}/${FILENAME}`);
        console.log(`🔗 Usage in code: /images/${CATEGORY}/${FILENAME}`);
        resolve(filepath);
      });
      
      file.on('error', (err) => {
        fs.unlinkSync(filepath);
        reject(err);
      });
    }).on('error', (err) => {
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      reject(err);
    });
  });
}

// Download the image
downloadImage(imageUrl, filepath).catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

