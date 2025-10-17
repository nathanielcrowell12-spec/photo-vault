#!/usr/bin/env node

// Universal image downloader for legal sources (Pexels, Unsplash, etc.)
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
📸 Image Downloader for PhotoVault

Usage:
  node scripts/add-image.js <url> [category] [custom-name]

Examples:
  node scripts/add-image.js "https://www.pexels.com/photo/..." cards
  node scripts/add-image.js "https://www.pexels.com/photo/..." hero my-hero-image

Categories:
  - hero          Full-width hero backgrounds (1920x1080)
  - cards         Card images with hover effects (400x300)
  - logos         Company and brand logos (200x60)
  - icons         Custom icons and graphics (64x64)
  - testimonials  Customer photos (300x300)
  - galleries     Sample photo galleries (400x300)
  - backgrounds   Patterns and textures (1920x1080)

Supported Sources:
  ✓ Pexels.com
  ✓ Unsplash.com
  ✓ Direct image URLs
  `);
  process.exit(0);
}

const inputUrl = args[0];
const category = args[1] || 'cards';
const customName = args[2];

// Extract photo ID from Pexels URL
function extractPexelsId(url) {
  const match = url.match(/pexels\.com\/photo\/[^/]+-(\d+)\/?/);
  return match ? match[1] : null;
}

// Extract photo ID from Unsplash URL
function extractUnsplashId(url) {
  const match = url.match(/unsplash\.com\/photos\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

// Generate filename
function generateFilename(url, customName) {
  if (customName) {
    // Ensure it has an extension
    return customName.match(/\.(jpg|jpeg|png|webp)$/i) 
      ? customName 
      : customName + '.jpg';
  }
  
  // For Pexels
  if (url.includes('pexels.com')) {
    const match = url.match(/photo-([a-z0-9-]+)-\d+/);
    if (match) {
      return match[1].replace(/^photo-/, '') + '.jpg';
    }
  }
  
  // For Unsplash
  if (url.includes('unsplash.com')) {
    const match = url.match(/photos\/([a-zA-Z0-9_-]+)/);
    if (match) {
      return 'unsplash-' + match[1] + '.jpg';
    }
  }
  
  // Fallback
  return 'image-' + Date.now() + '.jpg';
}

// Download image with redirect support
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(filepath);
    
    protocol.get(url, (response) => {
      // Follow redirects
      if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307) {
        const redirectUrl = response.headers.location;
        console.log(`↪️  Following redirect...`);
        file.close();
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
        return downloadImage(redirectUrl, filepath)
          .then(resolve)
          .catch(reject);
      }
      
      if (response.statusCode !== 200) {
        file.close();
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve(filepath);
      });
      
      file.on('error', (err) => {
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
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

// Main function
async function main() {
  try {
    console.log('🔍 Processing URL...');
    
    let imageUrl = inputUrl;
    
    // Handle Pexels URLs
    if (inputUrl.includes('pexels.com/photo/')) {
      const photoId = extractPexelsId(inputUrl);
      if (!photoId) {
        throw new Error('Could not extract Pexels photo ID from URL');
      }
      console.log(`📸 Pexels Photo ID: ${photoId}`);
      imageUrl = `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg?auto=compress&cs=tinysrgb&w=1200`;
    }
    
    // Handle Unsplash URLs
    else if (inputUrl.includes('unsplash.com/photos/')) {
      const photoId = extractUnsplashId(inputUrl);
      if (!photoId) {
        throw new Error('Could not extract Unsplash photo ID from URL');
      }
      console.log(`📸 Unsplash Photo ID: ${photoId}`);
      imageUrl = `https://images.unsplash.com/photo-${photoId}?w=1200&q=80`;
    }
    
    // Handle direct image URLs
    else if (inputUrl.match(/\.(jpg|jpeg|png|webp)(\?|$)/i)) {
      console.log(`🔗 Direct image URL detected`);
      imageUrl = inputUrl;
    }
    
    else {
      throw new Error('Unsupported URL format. Please provide a Pexels, Unsplash, or direct image URL.');
    }
    
    const filename = generateFilename(inputUrl, customName);
    const targetDir = path.join(__dirname, '..', 'public', 'images', category);
    const filepath = path.join(targetDir, filename);
    
    // Ensure directory exists
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
      console.log(`✓ Created directory: images/${category}/`);
    }
    
    console.log(`⬇️  Downloading to: images/${category}/${filename}`);
    await downloadImage(imageUrl, filepath);
    
    console.log('✅ Image downloaded successfully!');
    console.log(`📁 Location: public/images/${category}/${filename}`);
    console.log(`🔗 Usage in code: /images/${category}/${filename}`);
    console.log('');
    console.log('💡 Example usage in React:');
    console.log(`   <img src="/images/${category}/${filename}" alt="Description" />`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

