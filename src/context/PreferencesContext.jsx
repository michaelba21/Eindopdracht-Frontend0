
import {useContext, createContext, useState, useEffect } from "react";
import { AuthContext } from "./AuthContext.jsx";

// I have created here a context for managing user preferences throughout the app
export const PreferencesContext = createContext(null);

// I generate here a Provider component that wraps the application and provides preference-related functionality
export const PreferencesProvider = ({ children }) => {///
  // Get auth status and user info from AuthContext
  const { isAuthenticated, user, loading: authPending } = useContext(AuthContext);
  
  // I made State here to store user preferences and loading status
  const [userPrefs, setUserPrefs] = useState(null);
  const [prefsLoading, setPrefsLoading] = useState(true);

  // I have used default fallback preferences here and it will be triggered when no saved preferences are found
  const fallbackPrefs = {
    temperature: { min: 15, max: 25, weight: 3 },
    humidity: { min: 30, max: 60, weight: 2 },
    wind: { min: 0, max: 20, weight: 4 },
    uvIndex: { min: 0, max: 5, weight: 2 },
    pollenSensitivity: { grass: 3, tree: 3, weed: 3 },
    selectedCities: ["Leeuwarden", "Sneek", "Drachten"]
  };

  // useEffect to load preferences when auth state is resolved
  useEffect(() => {
    const fetchPreferences = async () => {
      if (authPending) {
        console.debug("Authentication pending. Preferences not fetched yet.");
        return;
      }

      // I have created a unique storage key based on user ID if available
      const storageKey = user ? `preferences_${user.id}` : null;

      try {
        if (isAuthenticated && user && storageKey) {  
          // Try to get saved preferences from localStorage
          const savedPrefs = localStorage.getItem(storageKey);

          if (savedPrefs) {
            try {
              // Parse and use saved preferences
              const parsed = JSON.parse(savedPrefs);///saved preferences from localStorage 
              setUserPrefs(parsed);
              console.log("User preferences loaded:", parsed);
            } catch (parseErr) {
              // Reset to defaults if parsing fails
              console.warn("Invalid JSON in localStorage. Resetting to default.");
              setUserPrefs(fallbackPrefs);
              localStorage.setItem(storageKey, JSON.stringify(fallbackPrefs));
            }
          } else {
            // Use defaults if no saved preferences exist
            console.log("No saved preferences found. Setting defaults.");
            setUserPrefs(fallbackPrefs);
            localStorage.setItem(storageKey, JSON.stringify(fallbackPrefs));///
          }
        } else {
          // I Used fallback preferences here for unauthenticated users
          console.log("Using fallback preferences (user not logged in).");
          setUserPrefs(fallbackPrefs);
        }
      } catch (err) {
        // I generated a fallback function to default preferences on any error
        console.error("Unexpected error while loading preferences:", err);
        setUserPrefs(fallbackPrefs);
      } finally {
        // mark preferences as loaded after processing
        setPrefsLoading(false);
      }
    };

    fetchPreferences();
  }, [isAuthenticated, user, authPending]); // Run effect when auth state changes

  // I made special function here to update user preferences
  const modifyPreferences = (changes) => {
    try {
      // Update preferences with provided changes
      const newPrefs = { ...userPrefs, ...changes };
      setUserPrefs(newPrefs);

      // Save to localStorage if user is authenticated
      if (isAuthenticated && user) {////
        const key = `preferences_${user.id}`;
        localStorage.setItem(key, JSON.stringify(newPrefs));
        console.debug("Preferences saved successfully.");
      } else {
        console.debug("Skipped saving preferences. Not authenticated.");
      }

      return true;
    } catch (err) {
      // Log errors and return failure
      console.error("Failed to update preferences:", err);
      return false;
    }
  };

  // Provide preferences and update function through context
  return (
    <PreferencesContext.Provider
      value={{
        preferences: userPrefs, 
        updatePreferences: modifyPreferences, // Function to update preferences
        loading: prefsLoading, 
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
};
