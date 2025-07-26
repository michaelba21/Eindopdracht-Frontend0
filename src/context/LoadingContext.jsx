import { useState,createContext, useContext } from 'react';
import { APILoadingScreen } from '../components/LoadingScreen.jsx';

// Create a new React context for loading state management
const LoadingContext = createContext();

// Custom hook to access loading context
export const useLoading = () => {
  // With below code I have tried to get the context from closest Provider
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');// Throw error if used outside of Provider. 
  }
  return context;
};

// Context Provider component
export const LoadingProvider = ({ children }) => {
  // I used State here in order to track multiple loading states with special keys
  const [loadingStates, setLoadingStates] = useState({});

  // I applied below function to set loading state for a specific key
  const setLoading = (key, isLoading, message = "Laden...") => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading ? { loading: true, message } : { loading: false, message: "" }
    }));
  };

  // Here I have attempted to check if specific key is loading
  const isLoading = (key) => {
    return loadingStates[key]?.loading || false;
  };

  // Get loading message for specific key
  const getLoadingMessage = (key) => {
    return loadingStates[key]?.message || "Laden...";
  };

  // Check if any loading state is active
  const isAnyLoading = () => {
    return Object.values(loadingStates).some(state => state.loading);
  };

  // Get message from first active loading state
  const getGlobalLoadingMessage = () => {
    const loadingState = Object.values(loadingStates).find(state => state.loading);
    return loadingState?.message || "Laden...";
  };

  return (
    // Provide context values to children
    <LoadingContext.Provider value={{
      setLoading,
      isLoading,
      getLoadingMessage,
      isAnyLoading,
      getGlobalLoadingMessage
    }}>
      {/* Render children components */}
      {children}
      {/* I Showed loading screen here to clarify if any loading state is triggered*/}
      {isAnyLoading() && (
        <APILoadingScreen message={getGlobalLoadingMessage()} />
      )}
    </LoadingContext.Provider>
  );
};


export default LoadingContext; 