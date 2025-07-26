
 
// here you see Simple proxy server version for Ambee API with debug logging
// Core dependencies:
import express from 'express';          
import cors from 'cors';               // I have enabled here Cross-Origin Resource Sharing
import dotenv from 'dotenv';           
import fetch from 'node-fetch';        // I Made HTTP requests to external APIs here
import os from 'os';                   // "I have Provided operating system-related utilities with import os" . source info:"https://nodejs.org/api/os.html"
import process from 'process';       

// Server configuration:
dotenv.config();                       // I tried with this code Load environment variables from .env file
const app = express();                
app.use(cors());                       // i enabled here CORS for all routes

// Server metrics tracking:
const fixedStartTime = new Date('2025-06-15T18:00:00').getTime(); // I clarified here the use of fixed start time for consistent test metrics
const startTime = fixedStartTime;      //  here I mentioned the Server start timestamp
let totalRequests = 0;                 
let successfulRequests = 0;            
let errorCount = 0;                    // here I illastrated a Counter for failed responses (e.g. 4xx/5xx)

// Here I manifested a Health check endpoint. it returns server status and metrics
app.get('/health', (req, res) => {/////I used health here for status checks and operational monitoring
  const uptime = Date.now() - startTime; // here I showed Calculate server uptime in ms
  
  
  const memoryUsage = process.memoryUsage();
  
  // the below code will Return comprehensive health status
  res.json({
    status: 'healthy',                 // here I indicate the overall server status indicator
    uptime: `${(uptime / 1000).toFixed(0)} seconds`, // here I generate a Human-readable uptime
    serverStartTime: new Date(startTime).toLocaleString('nl-NL', {
      timeZone: 'Europe/Amsterdam',   
      hour12: false
    }),
    memory: {                          // Memory usage breakdown
      rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`, // Resident Set Size (physical memory used) and MB stands for Megabyte. 1 KB = 1024 bytes 
      heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`, // JS heap used
      heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB` // Total heap size
    },
    system: {// OS-level is metrics and it Returns an array with 3 values representing the system's CPU load and it helps detect if your server is overloaded (e.g. sustained high values that need to scale up).  
      load: os.loadavg(),              // CPU load averages (1, 5, 15 minutes). 
      uptime: os.uptime()             // System uptime in seconds
    },
    metrics: {                       
      totalRequests,                   // Total requests since startup
      successfulRequests,             
      errorCount,                      
      successRate: totalRequests > 0 ? 
        ((successfulRequests / totalRequests) * 100).toFixed(2) + '%' : 'N/A'// I shown here the format of success rate as percentage string or 'N/A' if no requests
    }
  });
});

//in below you see a Middleware to track all incoming requests and measure response time. Middleware handles the full request-response lifecycle (e.g., tracking, logging, auth), while routers—being a type of middleware—focus specifically on directing requests to handlers based on URL or method. Middleware manages flow; routers manage routing.within server architectures. 

app.use((req, res, next) => {
  totalRequests++;                     // Increment total request counter
  const start = Date.now();            // Start timer for response time calculation
  
  res.on('finish', () => {             // Hook into response completion
    // This will classify response as success or error
    if (res.statusCode >= 200 && res.statusCode < 400) {
      successfulRequests++;
    } else {
      errorCount++;
    }
    
    // This will Calculate the response duration. 
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);///source info:"https://gist.github.com/sochix/831990a5f513bb74e677cc0c4958c5b8"
  });
  
  next();                              // Continue to next route
});
// I have utilized this to Load and verify Ambee API key from environment; initialize object to track frontend UI metrics and errors
const AMBEE_API_KEY = process.env.VITE_AMBEE_API_KEY; // Get API key from environment

if (!AMBEE_API_KEY) {                  // Validate API key presence
  console.error('AMBEE_API_KEY is not set in environment variables');
  process.exit(1);                     // Exit if missing (critical failure)
}

// you see here the frontend metrics tracking and it will Initialize frontendStats object to track total and successful interactions, plus store error details
const uiMetrics = {                    // Store frontend interaction metrics
  totalInteractions: 0,              
  successfulInteractions: 0,           
  errors: []                         
};
//I have developed an API endpoint designed to capture and store frontend error details. The system also increments a counter to track user interactions and provides confirmation upon successful logging of each error. This approach ensures systematic error documentation and monitoring.
app.post('/api/metrics/ui-error', (req, res) => {// Endpoint for logging frontend errors
  try {
    const errorData = req.body;        // Extract error details from request
    uiMetrics.errors.push(errorData);  
    uiMetrics.totalInteractions++;    
    res.status(200).json({ status: 'error logged' });
  } catch (err) {
    console.error('Error logging UI error:', err);
    res.status(500).json({ error: 'Failed to log UI error' });
  }
});

// I have depicted here an API endpoint to update UI support metrics: receives data, updates stored values, and responds with status
app.post('/api/metrics/ui-support', (req, res) => {// Endpoint for updating support metrics
  try {
    // Extract metrics from request body
    const { totalInteractions, successfulInteractions, supportPercentage } = req.body;
    // Update stored metrics
    uiMetrics.totalInteractions = totalInteractions;
    uiMetrics.successfulInteractions = successfulInteractions;
    res.status(200).json({ 
      status: 'metrics updated',
      currentSupportPercentage: supportPercentage 
    });
  } catch (err) {
    console.error('Error updating UI support metrics:', err);
    res.status(500).json({ error: 'Failed to update support metrics' });
  }
});
// here I have shown incoming request method and URL, and target Ambee API endpoint
app.use('/proxy', async (req, res) => {// API Proxy endpoint - forwards requests to Ambee API
  try {
    // I have extracted here API path from request URL
    const apiPath = req.originalUrl.replace(/^\/proxy\/?/, '');
    // Construct Ambee API URL
    const ambeeUrl = `https://api.ambeedata.com/${apiPath}`;

    // Debug logging
    console.log('Proxy incoming:', req.method, req.originalUrl);
    console.log('Proxying to Ambee:', ambeeUrl);

    //This will send a request to Ambee API using same HTTP method and required headers
    const response = await fetch(ambeeUrl, {
      method: req.method,              // Preserve original HTTP method. 
      headers: {
        'x-api-key': AMBEE_API_KEY,   
        'Content-Type': 'application/json',
      },
    });

    //// I have pointed out a check up for failed API response; log error details and forward status with message to client
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ambee API error:', response.status, errorText);
      return res.status(response.status).json({ error: `API error: ${response.status} ${errorText}` });
    }

    // I have applied this because it ensures API responded with JSON; if not, log and return 500 error
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Unexpected content type:', contentType);
      return res.status(500).json({ error: `Unexpected content type: ${contentType}` });
    }

    // Forward successful JSON response
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: err.message });
  }
});

//the code in below will return server uptime and memory stats for monitoring purposes
app.get('/health', (req, res) => {
  const uptime = Date.now() - startTime;
  const memoryUsage = process.memoryUsage();
  // I have Calculated support percentage for UI
  const supportPercentage = uiMetrics.totalInteractions > 0 ?
    (uiMetrics.successfulInteractions / uiMetrics.totalInteractions) * 100 : 100;
  
  res.json({
    status: 'healthy',
    uptime: `${(uptime / 1000).toFixed(0)} seconds`,
    memory: {
      rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
      heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`
    },
    system: {
      load: os.loadavg(),
      uptime: os.uptime()
    },
    metrics: {
      totalRequests,
      successfulRequests,
      errorCount,
      successRate: totalRequests > 0 ? 
        ((successfulRequests / totalRequests) * 100).toFixed(2) + '%' : 'N/A',
      errorRate: totalRequests > 0 ?
        ((errorCount / totalRequests) * 100).toFixed(2) + '%' : 'N/A',
      uiMetrics: {
        totalInteractions: uiMetrics.totalInteractions,
        successfulInteractions: uiMetrics.successfulInteractions,
        supportPercentage: supportPercentage.toFixed(2) + '%',
        recentErrors: uiMetrics.errors.slice(-5) // Last 5 errors
      }
    }
  });
});

// Server initialization
const PORT = process.env.PORT || 3001; // Default is set to port 3001
app.listen(PORT, () => {
  console.log(`Ambee proxy server running on port ${PORT}`);
  console.log(`API Key configured: ${AMBEE_API_KEY ? 'Yes' : 'No'}`);
  
  // I resresented here a calculate error rate as a percentage to avoid division by zero if no requests yet
  const calculateErrorRate = () => {
    return totalRequests > 0 ? 
      (errorCount / totalRequests) * 100 : 0;
  };

  // Error rate monitoring function
  const checkErrorRate = () => {
    const errorRate = calculateErrorRate();
    if (errorRate > 5) {               // i have implicated this as it trigger warning if error rate exceeds 5% threshold
      console.error(`WARNING: API error rate is ${errorRate.toFixed(2)}%, exceeding 5% threshold`);
      // Potential extension point for alerting systems and send notification if error rate is too high.
    }
  };

  // I have demonstrated here a periodic metrics logging (every 5 minutes)
  setInterval(() => {
    const uptime = Date.now() - startTime;
    const successRate = totalRequests > 0 ? 
      ((successfulRequests / totalRequests) * 100).toFixed(2) : 0;
    const errorRate = calculateErrorRate();
    
    // here I have shown the Log server statistics
    console.log(`Server metrics - Uptime: ${(uptime / 1000 / 60).toFixed(1)} minutes`);
    console.log(`Requests: ${totalRequests} (${successRate}% success)`);
    console.log(`Errors: ${errorCount} (${errorRate.toFixed(2)}% error rate)`);
    
    checkErrorRate();                  // Perform error rate check
  }, 5 * 60 * 1000);                  // 5 minute interval. 
}); 
