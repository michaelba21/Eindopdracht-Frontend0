
import {useState, createContext,  useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

// I have generated an authentication context here and it has a default empty object
const AuthContext = createContext({});

function AuthContextProvider({ children }) {
  // State initialization for authentication status
  const [authState, setAuthState] = useState({
    isAuth: false,   // Authentication status flag
    user: null,      // User data object
    status: 'pending' // here i demonstrated the Loading state ('pending' or 'done')
  });
  const navigate = useNavigate(); // I showed here the navigation hook.

  // Effect hook runs once on component mount
  useEffect(() => {
    // I have checked here for existing token in localStorage
    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        // I have illustrated here decode JWT token to extract payload
        const decoded = jwtDecode(token);
        
        // I have Checked token expiration (JWT exp is in seconds timepoint). 
        if (decoded.exp * 1000 < Date.now()) {
          console.log('Token expired, removing from storage');
          localStorage.removeItem('token');
          setAuthState({
            isAuth: false,
            user: null,
            status: 'done',
          });
          return;
        }

        // Token is valid - set authenticated state. 
        setAuthState({
          isAuth: true,
          user: {
            username: decoded.sub,  // Standard JWT subject claim
            email: decoded.email || '', // Optional email claim
            id: decoded.id || decoded.sub, // Fallback to sub if no id
          },
          status: 'done',
        });
      } catch (error) {
        console.error('Token decoding failed:', error);
        // Clean up invalid token
        localStorage.removeItem('token');
        setAuthState({
          isAuth: false,
          user: null,
          status: 'done',
        });
      }
    } else {
      // No token found - set unauthenticated state
      setAuthState({
        isAuth: false,
        user: null,
        status: 'done',
      });
    }
  }, []); // Empty dependency array = runs only once on mount. 

  // Login function in order to stores token and as well as updates state
  const login = (token) => {
    try {
      // Persist token in localStorage
      localStorage.setItem('token', token);
      
      // Decode token to extract user information
      const decoded = jwtDecode(token);
      
      // i have updated here the authentication state
      setAuthState({
        isAuth: true,
        user: {
          username: decoded.sub,//// 
          email: decoded.email || '',
          id: decoded.id || decoded.sub,
        },
        status: 'done',
      });
      
      // I showed here redirection into profile page after successful login
      navigate('/profile');
    } catch (error) {
      console.error('Login failed - token decode error:', error);
      throw new Error('Invalid token received');
    }
  };

  // Logout function - clears authentication
  const logout = () => {
    // I haved removed token here from storage
    localStorage.removeItem('token');
    // Reset auth state
    setAuthState({
      isAuth: false,
      user: null,
      status: 'done',
    });
    // Here I applied redirection into home page
    navigate('/');
  };

  // Create demo user function for testing/demo purposes
  const createDemoUser = () => {
    try {
      // I have created here a demo JWT-like token (for demo purposes only)
      const demoToken = 'demo-jwt-token-123';
      
      // Demo user profile. 
      const demoUser = {
        username: 'Demo User',
        email: 'demo@example.com',
        id: 'demo-user-123',
      };

      // Store demo token in localStorage
      localStorage.setItem('token', demoToken);
      
      // Update authentication state with demo user
      setAuthState({
        isAuth: true,
        user: demoUser,
        status: 'done',
      });
      
      console.log('Demo user created and logged in:', demoUser);
      return true;
    } catch (error) {
      console.error('Failed to create demo user:', error);
      return false;
    }
  };

  // I used context value here for combining state and methods
  const contextData = {
    isAuthenticated: authState.isAuth, 
    isChecking: authState.status === 'pending', // Here de data key has been adapted to match what the rest of the system expects.
    user: authState.user,
    status: authState.status,
    login,        // Expose login method
    logout,       // illustration of logout method
    createDemoUser, // clarification of demo user creation method
  };

  // I have generated here Provider component for wrapping children with context
  return (
    <AuthContext.Provider value={contextData}>
      {children}
    </AuthContext.Provider>
  );
}


export { AuthContext, AuthContextProvider };