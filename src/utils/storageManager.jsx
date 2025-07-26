// I define here the storage limit (50MB in bytes)
const STORAGE_LIMIT = 50 * 1024 * 1024;

// Calculate current storage usage by summing all key-value pairs
function getStorageUsage() {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {// Iterate through all items in localStorage. 
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    total += key.length + value.length; // Add both key and value lengths to total.
  }
  return total;
}

// In below code I have checked whether the requested size is available in storage
function isStorageAvailable(size) {
  return (STORAGE_LIMIT - getStorageUsage()) >= size;  // Compare requested size with remaining space
}

// Free up space by removing oldest items first
function makeStorageSpace(requiredSize) {
  while (getStorageUsage() + requiredSize > STORAGE_LIMIT) {  // Keep removing items until we have enough space
    let oldestKey = null;
    let oldestTimestamp = Infinity;
    // Here I have tried to find the oldest item by timestamp character
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);// Get the key at the current index in localStorage
      const value = localStorage.getItem(key);
      try {
        ////i used parse function to convert data from localStorage back into a JavaScript objec
        // Also Parse stored value to check for timestamp
        const data = JSON.parse(value); // Convert the stored string back into an object.
oldestTimestamp = data.timestamp;
        if (data.timestamp && data.timestamp < oldestTimestamp) {
          oldestKey = key;// Mark this key as the oldest. 
          oldestTimestamp = data.timestamp;
        }
      } catch (e) {
        // If item can't be parsed, remove it immediately
        localStorage.removeItem(key);/// 
        return;
      }
    }
    
    // Remove the oldest item found
    if (oldestKey) {
      localStorage.removeItem(oldestKey);
    } else {
      // Fallback: if no timestamps, remove first item
      localStorage.removeItem(localStorage.key(0));
    }
  }
}

// Safe storage setter with size management
function setItem(key, value) {
  const itemSize = key.length + value.length;  // Calculate total size of new item
  
  // Reject items that exceed total storage limit
  if (itemSize > STORAGE_LIMIT) {
    console.warn(`Item ${key} is too large to store (${itemSize} bytes)`); 
    return false;
  }
  
  // Make space if needed
  if (!isStorageAvailable(itemSize)) {
    makeStorageSpace(itemSize);
  }
  
  // Attempt to store the item
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.error(`Failed to store item ${key}:`, e);
    return false;
  }
}

// Safe getter with automatic corruption handling
function getItem(key) {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    // If retrieval fails, clean up corrupted item
    console.error(`Failed to retrieve item ${key}:`, e);
    localStorage.removeItem(key);
    return null;
  }
}

// Export storage management functions
export default {
  getStorageUsage,  // Get current storage usage
  isStorageAvailable,  
  makeStorageSpace,  // Free up space
  setItem,  
  getItem  
};