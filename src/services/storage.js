const fs = require('fs');
const path = require('path');

const TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

// Check if running in serverless environment (Vercel, etc.)
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL_ENV;

if (isServerless) {
  // Use Vercel Blob storage for serverless
  const { put, list } = require('@vercel/blob');

  const saveFile = async (id, content, extension) => {
    const filename = `${id}.${extension}`;

    try {
      const blob = await put(filename, content, {
        access: 'public',
        addRandomSuffix: false
      });

      return blob.url;
    } catch (error) {
      console.error('Error saving to Vercel Blob:', error);
      throw error;
    }
  };

  const getFile = async (id, extension) => {
    const filename = `${id}.${extension}`;

    try {
      // Use list to find the blob
      const { blobs } = await list({ prefix: filename });

      if (!blobs || blobs.length === 0) {
        return null;
      }

      const blob = blobs[0];

      // Check TTL
      const uploadedAt = new Date(blob.uploadedAt).getTime();
      const now = Date.now();

      if (now - uploadedAt > TTL_MS) {
        return null;
      }

      return blob.url;
    } catch (error) {
      console.error('Error getting from Vercel Blob:', error);
      return null;
    }
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
