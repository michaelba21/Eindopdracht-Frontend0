import { useState,createContext,  useContext, useEffect} from 'react';

// Create a context for theme management
const ThemeContext = createContext();
export const ThemeProvider = ({ children }) => {
  // i set function here to determine initial theme from user preferences
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('theme');// I have checked here if user has explicitly set a theme preference.
    if (savedTheme) return savedTheme;
    
    // Fall back to system preference if no saved theme exists
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  // State to track current theme
  const [theme, setTheme] = useState(getInitialTheme);

  // useEffect to apply theme changes to document and localStorage
  useEffect(() => {
   
    document.documentElement.setAttribute('data-theme', theme); // here I have Applied theme to root HTML element
    
    localStorage.setItem('theme', theme);// Persist theme preference
  }, [theme]);

  // useEffect to listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Handler for system theme changes
    const handleChange = (e) => {
      
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');// With this code I set update only if user hasn't set an explicit preference
      }
    };

    
    mediaQuery.addEventListener('change', handleChange);// i have added here event listener for system theme changes. 
   
    return () => mediaQuery.removeEventListener('change', handleChange); // I Cleaned up event listener on unmount here
  }, []);

  // I set function here to toggle between light and dark themes
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');///
  };

  // i have Created here a context value object with descriptive property names
  const contextValue = {
    currentTheme: theme,
    switchTheme: toggleTheme
  };

  return (
    //I have Provided here a theme context for children
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to access theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');// Throw error if used outside provider. 
  }
  return context;
};