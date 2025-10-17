// Script to download images from legal sources (Pexels, Unsplash, etc.)
const https = require('https');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const imageUrl = args[0];
const category = args[1] || 'cards';
const customName = args[2];

if (!imageUrl) {
  console.error('❌ Error: Please provide an image URL');
  console.log('Usage: node download-image.js <url> [category] [custom-name]');
  console.log('Categories: hero, cards, logos, icons, testimonials, galleries, backgrounds');
  process.exit(1);
}

// Extract filename from URL or use custom name
function getFilename(url, customName) {
  if (customName) {
    return customName.endsWith('.jpg') || customName.endsWith('.png') || customName.endsWith('.webp') 
      ? customName 
      : customName + '.jpg';
  }
  
  // Extract from Pexels URL pattern
  if (url.includes('pexels.com')) {
    const match = url.match(/photo-([a-z-]+)-(\d+)/);
    if (match) {
      return `pexels-${match[1]}-${match[2]}.jpg`;
    }
  }
  
  // Fallback to timestamp
  return `image-${Date.now()}.jpg`;
}

// Get the actual image URL from Pexels page
async function getPexelsImageUrl(pageUrl) {
  return new Promise((resolve, reject) => {
    https.get(pageUrl, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        // Try to find the image URL in the page
        // Pexels uses specific patterns for image URLs
        const match = data.match(/https:\/\/images\.pexels\.com\/photos\/\d+\/[^"]+\.jpeg\?auto=compress[^"]+/);
        if (match) {
          // Get a medium-sized version
          const imageUrl = match[0].replace(/\?auto=compress[^"]+/, '?auto=compress&cs=tinysrgb&w=1200');
          resolve(imageUrl);
        } else {
          reject(new Error('Could not extract image URL from Pexels page'));
        }
      });
    }).on('error', reject);
  });
}

// Download image
async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      // Follow redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        return downloadImage(response.headers.location, filepath)
          .then(resolve)
          .catch(reject);
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve(filepath);
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {}); // Delete the file on error
      reject(err);
    });
  });
}

// Main function
async function main() {
  try {
    console.log('🔍 Processing image URL...');
    
    let downloadUrl = imageUrl;
    
    // If it's a Pexels page URL, extract the actual image URL
    if (imageUrl.includes('pexels.com/photo/')) {
      console.log('📸 Detected Pexels URL, extracting image...');
      downloadUrl = await getPexelsImageUrl(imageUrl);
      console.log('✓ Found image URL');
    }
    
    const filename = getFilename(imageUrl, customName);
    const targetDir = path.join(__dirname, '..', 'public', 'images', category);
    const filepath = path.join(targetDir, filename);
    
    // Ensure directory exists
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
      console.log(`✓ Created directory: ${category}/`);
    }
    
    console.log(`⬇️  Downloading to: images/${category}/${filename}`);
    await downloadImage(downloadUrl, filepath);
    
    console.log('✅ Image downloaded successfully!');
    console.log(`📁 Location: public/images/${category}/${filename}`);
    console.log(`🔗 Usage: /images/${category}/${filename}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

