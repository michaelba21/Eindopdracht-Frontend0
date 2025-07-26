
const LOG_RETENTION_DAYS = 30; // Logs older than this will be deleted. 
const LOG_STORAGE_KEY = 'app_logs'; 

// Definition of available log levels
const LOG_LEVELS = {
  ERROR: 'error', // For critical errors that prevent functionality
  WARN: 'warn', 
  INFO: 'info', 
  DEBUG: 'debug' // For detailed debugging information
};

// I have created here a standardized log entry object
const createLogEntry = (level, message, data = {}) => ({
  timestamp: new Date().toISOString(), //  I generate here the current timestamp in ISO 8601 format. 
  level,
  message, 
  data 
});

// Retrieve all stored logs from localStorage
const getLogs = () => {
  try {
    const logs = localStorage.getItem(LOG_STORAGE_KEY); // Get raw string from storage
    return logs ? JSON.parse(logs) : []; // Parse to JSON or return empty array if none
  } catch (error) {
    console.error('Failed to retrieve logs:', error); 
    return []; 
  }
};

// Add a new log entry to storage
const addLog = (level, message, data = {}) => {
  try {
    const logs = getLogs(); // Get existing logs
    const newLog = createLogEntry(level, message, data); 
    logs.push(newLog); // Here I have added a new log to array. 
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs)); // Save updated logs
    cleanupOldLogs(); 
  } catch (error) {
    console.error('Failed to add log:', error); 
  }
};

// I have removed here logs older than the retention period
const cleanupOldLogs = () => {
  try {
    const logs = getLogs(); // Get current logs
    const retentionDate = new Date(); // Create date boundary for retention
    retentionDate.setDate(retentionDate.getDate() - LOG_RETENTION_DAYS);/////implement 30-day retention policy with automated cleanup. soure info:"https://learn.microsoft.com/en-us/purview/retention?tabs=table-overriden"

    // I have filtered out here the old logs
    const filteredLogs = logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= retentionDate;
    });

    // Only update storage if logs were removed
    if (filteredLogs.length !== logs.length) {
      localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(filteredLogs));
      console.info(`Cleaned up ${logs.length - filteredLogs.length} old log entries`);
    }
  } catch (error) {
    console.error('Failed to cleanup logs:', error);
  }
};

// I made here a convenience methods for logging at different severity levels
const logError = (message, data) => addLog(LOG_LEVELS.ERROR, message, data);
const logWarn = (message, data) => addLog(LOG_LEVELS.WARN, message, data);
const logInfo = (message, data) => addLog(LOG_LEVELS.INFO, message, data);
const logDebug = (message, data) => addLog(LOG_LEVELS.DEBUG, message, data);///

// Query logs by severity level
const getLogsByLevel = (level) => {
  const logs = getLogs(); // Get all logs. 
  return logs.filter(log => log.level === level); // Return only matching logs
};

// I generate here a query logs within a specific date range. 
const getLogsByDateRange = (startDate, endDate) => {
  const logs = getLogs(); 
  return logs.filter(log => {
    const logDate = new Date(log.timestamp); // I used this to Convert timestamp ( ISO 8601 format) to Date object
   
    return logDate >= startDate && logDate <= endDate; // Return true if date is within specified range
  });
};

// Here I have generated a code to export the complete log service as a module
export default {
  LOG_LEVELS, //// Export available log levels
  getLogs, 
  addLog, 
  logError, 
  logWarn, 
  logInfo, 
  logDebug, 
  getLogsByLevel, 
  getLogsByDateRange, 
  cleanupOldLogs 
};
