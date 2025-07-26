
const STORAGE_LIMIT = 50 * 1024 * 1024; // 50MB in bytes (maximum storage capacity).1024 KB = 1 MB and 1024 bytes = 1 KB. 
const CLEANUP_THRESHOLD = 0.85; // 85% of limit - I apply this to triggers cleanup when exceeded
const MAX_ITEM_SIZE = 1024 * 1024; // 1MB max per item (storage item size limit)

// here I have attemted to cache durations in milliseconds for different data types
const CACHE_DURATIONS = {
  weather: 3600000,    // 1 hour (I showed here weather data cache duration)
  pollen: 21600000,    // 6 hours 
  air: 3600000,        
  preferences: null    // No expiration for user preferences
};

// I use here StorageManager class in order to handle localStorage operations with advanced management features
class StorageManager {
  constructor() {
    this.storage = window.localStorage; 
    this.initializeStorage(); // Initialize metadata (to track storage usage, item details, and cleanup history for efficient localStorage handling)if it doesn't exist
    this.startPeriodicCleanup(); 
  }

  // Initialize metadata-structure if it doesn't exist
  initializeStorage() {
    if (!this.getStorageMetadata()) {
      this.setStorageMetadata({
        lastCleanup: Date.now(), // When the last cleanup occurred
        totalSize: 0, // Current total storage size
        items: {}, 
        lastSizeCheck: Date.now() 
      });
    }
  }

  // Start periodic cleanup process (every 5 minutes)
  startPeriodicCleanup() {
    setInterval(() => {
      this.checkStorageSize();
    }, 5 * 60 * 1000);//// 
  }

  // Check current storage usage and trigger cleanup if needed
  checkStorageSize() {
    const metadata = this.getStorageMetadata();
    const currentSize = this.calculateTotalSize();
    
    // If approaching storage limit, initiate cleanup
    if (currentSize > STORAGE_LIMIT * CLEANUP_THRESHOLD) {
      this.cleanupStorage();
    }
    
    // Update metadata with current size information
    metadata.lastSizeCheck = Date.now();
    metadata.totalSize = currentSize;
    this.setStorageMetadata(metadata);
  }

  // I have calculated here the total storage size being used
  calculateTotalSize() {
    let total = 0;
    for (let i = 0; i < this.storage.length; i++) {/////
      const key = this.storage.key(i);
      const value = this.storage.getItem(key);// I tried here to get the stored value for the key
      total += this.getItemSize(key, value);// Add the size of this key-value pair to total. 
    }
    return total; 
  }

  // Get metadata about storage status
  getStorageMetadata() {
    try {
      return JSON.parse(this.storage.getItem('storage_metadata'));
    } catch {
      return null;
    }
  }

  // Save updated storage metadata
  setStorageMetadata(metadata) {
    this.storage.setItem('storage_metadata', JSON.stringify(metadata));
  }

 // I Calculate here the storage size of a specific item
getItemSize(key, value) {
  // I tried here to estimate size assuming UTF-16 encoding (JavaScript stores strings as 2 bytes per character)
  return (key.length + value.length) * 2;
} 

  // Store an item in localStorage with metadata
  async setItem(key, value, options = {}) {
    const metadata = this.getStorageMetadata();
    const valueStr = JSON.stringify(value); // Convert value to string. 
    const itemSize = this.getItemSize(key, valueStr);

    // Prevent storing excessively large items
    if (itemSize > MAX_ITEM_SIZE) {
      console.warn(`Item ${key} is too large (${itemSize} bytes). Maximum size is ${MAX_ITEM_SIZE} bytes.`);
      return false;
    }

    // Cleanup storage if adding this item would exceed limits
    if (metadata.totalSize + itemSize > STORAGE_LIMIT) {
      await this.cleanupStorage();
    }

    try {
      // I have stored here the actual data
      this.storage.setItem(key, valueStr);
      
      // Set expiration based on item type from our configuration
      const cacheDuration = CACHE_DURATIONS[options.type];
      const expires = cacheDuration ? Date.now() + cacheDuration : null;////
      
      // Update metadata for this item
      metadata.items[key] = {
        size: itemSize,
        timestamp: Date.now(),
        expires: options.expires || expires,
        priority: options.priority || 0,
        type: options.type || 'unknown'
      };
      
      // here I have updated total size tracking
      metadata.totalSize += itemSize;// Here I have added the size of the new item to the total storage size
      this.setStorageMetadata(metadata);// Save the updated metadata back to storage
      return true;
    } catch (error) {
      console.error('Storage error:', error);
      return false;
    }
  }

  // in below code I tried to get back an item from storage if it exists and hasn't expired
  getItem(key) {
    try {
      const value = this.storage.getItem(key);///
      if (!value) return null;

      const metadata = this.getStorageMetadata();
      const item = metadata.items[key];

      // Remove item if it has expired
      if (item.expires && Date.now() > item.expires) {
        this.removeItem(key);///
        return null;
      }

      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  // I Removed a specific item from storage with below code
  removeItem(key) {
    const metadata = this.getStorageMetadata();
    const item = metadata.items[key];

    if (item) {
      // I have updated here the total size tracking
      metadata.totalSize -= item.size;
      delete metadata.items[key];
      // I have Removed here the actual item from localStorage
      this.storage.removeItem(key);
      this.setStorageMetadata(metadata);
    }
  }

  // with below code I have clean up storage by removing low-priority items first
  async cleanupStorage() {
    const metadata = this.getStorageMetadata();
    
    // I have sorted here items by priority (higher first), then by timestamp (older first)
    const items = Object.entries(metadata.items)
      .sort((a, b) => {
        if (a[1].priority !== b[1].priority) {
          return b[1].priority - a[1].priority;/// I am sorting data here by descending priority in comparator so, b is compared first  
        }
        return a[1].timestamp - b[1].timestamp;////
      });

    // Remove items until we're below the threshold
    while (metadata.totalSize > STORAGE_LIMIT * CLEANUP_THRESHOLD && items.length > 0) {
      const [key] = items.pop(); // Here I showed the Removal lowest priority/oldest items first
      this.removeItem(key);/// 
    }

    // Update cleanup timestamp (represents a specific point in time) in metadata
    metadata.lastCleanup = Date.now();
    this.setStorageMetadata(metadata);
  }

  // Get detailed information about storage usage
  getStorageUsage() {
    const metadata = this.getStorageMetadata();
    const currentSize = this.calculateTotalSize();
    return {
      used: currentSize, 
      limit: STORAGE_LIMIT, 
      percentage: (currentSize / STORAGE_LIMIT) * 100,
      items: Object.keys(metadata.items).length, // Number of stored items
      lastCleanup: metadata.lastCleanup, 
      lastSizeCheck: metadata.lastSizeCheck 
    };
  }

  // Remove any items that have passed their expiration time
  clearExpiredItems() {
    const metadata = this.getStorageMetadata();
    const now = Date.now();

    // Iterate through all items checking for expiration
    Object.entries(metadata.items).forEach(([key, item]) => {
      if (item.expires && now > item.expires) {
        this.removeItem(key);
      }
    });
  }

  // Helper method to check if data is still valid
  isDataValid(key) {
    const item = this.getStorageMetadata().items[key];
    if (!item) return false; 
    if (!item.expires) return true; // No expiration means always valid
    return Date.now() <= item.expires; // Check expiration time
  }
}

// Here I Create a singleton instance of StorageManager
const storageManager = new StorageManager();


export { StorageManager };
export default storageManager;
