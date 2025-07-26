// I have attempted here to use encryption utility for secure data sharing
import CryptoJS from 'crypto-js';

// I have added here fallback default encryption key and will triggered when VITE_ENCRYPTION_KEY env variable is not set. 
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'default-secure-key';

// I have generated here a unique encryption key for each share session
const generateShareKey = () => {
  // Create cryptographically secure random key ,32 × 8 = 256 bits, matching AES-256 requirements.1 byte = 8 bits
  return CryptoJS.lib.WordArray.random(32).toString();
};

// Encrypt data with AES-256 ("Advanced Encryption Standard")encryption. 
export const encryptData = (data, key = ENCRYPTION_KEY) => {
  try {
    // Convert data to JSON string before encryption. 
    const jsonString = JSON.stringify(data);
    // Perform AES encryption and return as string
    return CryptoJS.AES.encrypt(jsonString, key).toString();
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Data encryption failed');
  }
};

// Decrypt AES-256 encrypted data
export const decryptData = (encryptedData, key = ENCRYPTION_KEY) => {
  try {
    // Decrypt the ciphertext
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);///
    // Convert to UTF-8 string. 
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    // Parse back to original object. 
    return JSON.parse(decryptedString);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Data decryption failed');
  }
};

// Generate a time-limited secure sharing link
export const generateSecureLink = (data) => {
  try {
    // Generate unique "one-time key" for this share
    const shareKey = generateShareKey();
    
    // I have Encrypted the realtime data with the special or "one-time key"
    const encrypted = encryptData(data, shareKey);
    
    // Create payload container with metadata
    const payload = {
      data: encrypted,       // The encrypted data
      key: shareKey,         // The one-time decryption key. 
      timestamp: new Date().toISOString()  // Expiration tracking
    };
    
    // Encrypt the entire payload with master key. 
    const finalEncrypted = encryptData(payload);
    // Convert to base64 for URL safety
    const base64 = btoa(finalEncrypted);
    
    // Return formatted URL
    return `${window.location.origin}/share/${base64}`;
  } catch (error) {
    console.error('Secure link generation failed:', error);
    throw new Error('Could not generate secure link');
  }
};

// Decode and decrypt a secure sharing link
export const parseSecureLink = (link) => {
  try {
    
    const base64 = link.split('/share/')[1];// Extract base64 portion from URL
    // Convert back from base64
    const encrypted = atob(base64);///atob(base64) decodes a Base64-encoded string back to its original form for decryption.
    
    // First decrypt the outer payload
    const payload = decryptData(encrypted);
    
    // Check expiration (24 hours)
    const shareTime = new Date(payload.timestamp);///
    const now = new Date();
    if (now - shareTime > 24 * 60 * 60 * 1000) {////
      throw new Error('Share link has expired');
    }
    
    // I have decrypt here the realtime data with utilizing a specific or "one-time key"
    return decryptData(payload.data, payload.key);
  } catch (error) {
    console.error('Secure link parsing failed:', error);
    throw new Error('Invalid or corrupted secure link');
  }
};

// Prepare platform-specific sharing content
export const prepareSecureShare = (data, platform) => {
  try {
    // Generate the secure link
    const secureLink = generateSecureLink(data);
    // Standard message template
    const message = `Bekijk mijn hooikoortsadvies via deze beveiligde link: ${secureLink}\n\nDeze link is 24 uur geldig en versleuteld.`;
    
    // Platform-specific formatting
    switch (platform) {
      case 'email':
        return {
          subject: 'Hooikoortsadvies - Beveiligde Link',  // Email subject
          body: message                                  
        };
      case 'whatsapp':
        return {
          text: message  // WhatsApp message text
        };
      default:
        return {
          text: message  // Default text format.
        };
    }
  } catch (error) {
    console.error('Secure share preparation failed:', error);
    throw new Error('Could not prepare secure share');
  }
};