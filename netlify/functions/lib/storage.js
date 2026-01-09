// Storage adapter supporting both Netlify Blobs (production) and file-based (local dev)

const fs = require('fs').promises;
const path = require('path');

class BlobStorage {
  constructor() {
    // Netlify Blobs will be imported dynamically
    this.blobsAvailable = false;
    this.store = null;
  }

  async init() {
    try {
      const { getStore } = await import('@netlify/blobs');
      this.store = getStore('tradetrends');
      this.blobsAvailable = true;
    } catch (err) {
      console.warn('Netlify Blobs not available, falling back to file storage');
      this.blobsAvailable = false;
    }
  }

  async get(key) {
    if (!this.blobsAvailable) return null;
    try {
      const data = await this.store.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error(`Blob get error for ${key}:`, err);
      return null;
    }
  }

  async set(key, value) {
    if (!this.blobsAvailable) return false;
    try {
      await this.store.set(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.error(`Blob set error for ${key}:`, err);
      return false;
    }
  }
}

class FileStorage {
  constructor() {
    this.stateDir = path.join(process.cwd(), '.netlify', 'state');
  }

  async ensureDir() {
    try {
      await fs.mkdir(this.stateDir, { recursive: true });
    } catch (err) {
      // Ignore if already exists
    }
  }

  getFilePath(key) {
    return path.join(this.stateDir, `${key}.json`);
  }

  async get(key) {
    await this.ensureDir();
    const filePath = this.getFilePath(key);
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (err) {
      if (err.code === 'ENOENT') return null;
      console.error(`File read error for ${key}:`, err);
      return null;
    }
  }

  async set(key, value) {
    await this.ensureDir();
    const filePath = this.getFilePath(key);
    try {
      await fs.writeFile(filePath, JSON.stringify(value, null, 2), 'utf-8');
      return true;
    } catch (err) {
      console.error(`File write error for ${key}:`, err);
      return false;
    }
  }
}

// Factory function to auto-select storage backend
async function createStorage() {
  if (process.env.NETLIFY && process.env.CONTEXT !== 'dev') {
    const blob = new BlobStorage();
    await blob.init();
    if (blob.blobsAvailable) {
      console.log('Using Netlify Blobs storage');
      return blob;
    }
  }
  console.log('Using file-based storage');
  return new FileStorage();
}

// Helper for read-modify-write with retry
async function atomicUpdate(storage, key, updateFn, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const current = await storage.get(key) || {};
      const updated = await updateFn(current);
      const success = await storage.set(key, updated);
      if (success) return updated;
    } catch (err) {
      console.error(`Atomic update attempt ${attempt + 1} failed:`, err);
    }
    // Small jitter delay before retry
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
  }
  throw new Error(`Failed to update ${key} after ${maxRetries} attempts`);
}

module.exports = { createStorage, atomicUpdate };
