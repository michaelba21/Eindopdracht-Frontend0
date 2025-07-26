
import { useState, useCallback } from 'react';
import { useLoading } from '../context/LoadingContext.jsx';

// Here I have used custom hook for handling API calls with loading state management
export const useApiCall = (key = 'default') => {
  
  const [data, setData] = useState(null);// State to store API response data
  
  const [error, setError] = useState(null);
  
  const { setLoading, isLoading } = useLoading();

  // Here I have applied a memoized function in order to execute an API call
  const execute = useCallback(async (apiFunction, loadingMessage = "API-gegevens laden...") => {
    try {
    
      setLoading(key, true, loadingMessage);  // Set loading state with message
      
      setError(null);// Clear previous errors
      
    
      const result = await apiFunction();////
     
      setData(result); // here i have Stored the result in state. 
      return result;
    } catch (err) {
      
      setError(err);
      console.error(`API call failed for ${key}:`, err);
      throw err;
    } finally {
      // clear the loading state when done
      setLoading(key, false);
    }
  }, [key, setLoading]); // Only re-create if key or setLoading changes

  // Function to reset the state of this API call
  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(key, false);
  }, [key, setLoading]); // Only re-create if key or setLoading changes

  // Return all relevant state and control functions
  return {
    data, // with this code I have returned the data from the API call
    error, 
    loading: isLoading(key), // Current loading status for this API call
    execute, 
    reset 
  };
};

export default useApiCall;
