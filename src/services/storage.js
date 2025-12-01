const fs = require('fs');
const path = require('path');

const STORAGE_DIR = path.join(__dirname, '../../storage');
const TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

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
