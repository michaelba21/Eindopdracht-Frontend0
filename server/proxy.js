// In below I have Imported statements for required modules:
import express from 'express';          // This will ensure the Web framework for handling HTTP requests
import cors from 'cors';               
import dotenv from 'dotenv';           // I have imported here a module to load environment variables from .env file. 
import fetch from 'node-fetch';  
import logService from '../src/services/logService'; 

// Server configuration:
dotenv.config();                       
const app = express();                 
app.use(cors());                       // This code will enable CORS for all routes
app.use(express.json());               // I utilized here a middleware to parse JSON request bodies. 
const PORT = 3002;                                

// Proxy endpoint definition:
app.get('/proxy/*', async (req, res) => {  // I have Catched-all route for paths starting with /proxy/
  const startTime = Date.now();             
  try {
    const fullPath = req.url.replace('/proxy/', ''); // Extraction of path after /proxy/
    const apiUrl = `https://api.ambeedata.com/${fullPath}`; // I have constructed the full Ambee API URL.
    
    // Log the incoming request details
    logService.logInfo('API Request', {
      url: apiUrl,
      method: 'GET',
      timestamp: new Date().toISOString()
    });

    // I made a request to Ambee API with required headers
    const response = await fetch(apiUrl, {
      headers: {
        'x-api-key': process.env.AMBEE_API_KEY, // here you see API key from environment variables
        'Content-Type': 'application/json'      
      }
    });

    // with below code I have handled non-successful responses (HTTP status >= 400)
    if (!response.ok) {
      const errorText = await response.text();  // Get error details from response
      logService.logError('API Error Response', {
        status: response.status,               
        error: errorText,                   
        url: apiUrl                            // here I have included the failing API endpoint in the error log for debugging
      });
      throw new Error(`API request failed with status ${response.status}`);
    }

    // I have set here a Verification response content type is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      const text = await response.text();      
      logService.logError('Invalid Content Type', {
        contentType,                          //you see here a capture and log the unexpected content type for debugging 
        response: text.slice(0, 100),        // I set here a preview of the response to help identify the issue
        url: apiUrl                         
      });
      throw new Error(`Unexpected content type: ${contentType}`);
    }

    // Process successful JSON response
    const data = await response.json();     
    const duration = Date.now() - startTime;  // Here I have Calculated the request duration
    
    // Log successful API response details
    logService.logInfo('API Response', {
      url: apiUrl,
      duration: `${duration}ms`,             // I have included here a request duration in milliseconds. 
      status: response.status                
    });
    
    // Send API response data back to client
    res.json(data);
  } catch (error) {
    // Alright, look, in the code below, I made sure to catch any error that might pop up while making the request.
    const duration = Date.now() - startTime;  
    logService.logError('Proxy Error', {     
      error: error.message,                  
      duration: `${duration}ms`,             // Duration until error occurred
      url: req.url                           // check it out—you can see the original request URL right there.
    });
    res.status(500).json({ error: error.message }); // this will send 500 error to client. 
  }
});

// Start the server
app.listen(PORT, () => {
  logService.logInfo('Proxy Server Started', { 
    port: PORT,                              // Server port number
    timestamp: new Date().toISOString()      // I have used the toISOString() method to converts a JavaScript Date object into a standardized ISO 8601 formatted string in UTC time.
  });
}); 