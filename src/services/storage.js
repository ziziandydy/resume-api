const fs = require('fs');
const path = require('path');

const TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

// Check if running in serverless environment (Vercel, etc.)
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL_ENV;

// In-memory storage for serverless environments
let memoryStorage = null;

if (isServerless) {
  // Use in-memory storage for serverless
  memoryStorage = new Map();
  
  const saveFile = (id, content, extension) => {
    const key = `${id}.${extension}`;
    memoryStorage.set(key, {
      content: content,
      timestamp: Date.now(),
      extension: extension
    });
    
    // Clean up old entries periodically
    if (memoryStorage.size > 1000) {
      const now = Date.now();
      for (const [key, value] of memoryStorage.entries()) {
        if (now - value.timestamp > TTL_MS) {
          memoryStorage.delete(key);
        }
      }
    }
    
    return key;
  };

  const getFile = (id, extension) => {
    const key = `${id}.${extension}`;
    const entry = memoryStorage.get(key);
    
    if (!entry) {
      return null;
    }

    // Check TTL
    const now = Date.now();
    if (now - entry.timestamp > TTL_MS) {
      memoryStorage.delete(key);
      return null;
    }

    return entry.content;
  };

  module.exports = {
    saveFile,
    getFile
  };
} else {
  // Use file system storage for local development
  const STORAGE_DIR = path.join(__dirname, '../../storage');

  // Ensure storage directory exists
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }

  const getFilePath = (id, extension) => path.join(STORAGE_DIR, `${id}.${extension}`);

  const saveFile = (id, content, extension) => {
    const filePath = getFilePath(id, extension);
    fs.writeFileSync(filePath, content);
    return filePath;
  };

  const getFile = (id, extension) => {
    const filePath = getFilePath(id, extension);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    // Check TTL
    const stats = fs.statSync(filePath);
    const now = new Date().getTime();
    const fileTime = new Date(stats.mtime).getTime();

    if (now - fileTime > TTL_MS) {
      fs.unlinkSync(filePath);
      return null;
    }

    return filePath;
  };

  module.exports = {
    saveFile,
    getFile
  };
}
