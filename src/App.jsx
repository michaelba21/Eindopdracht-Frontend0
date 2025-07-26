
import { BrowserRouter,Route, Navigate, Routes } from "react-router-dom"; 
import { lazy, Suspense } from "react"; 
import "./App.css"; 
// I used here Layout components for the app structure
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx"; 
import ErrorBoundary from "./components/ErrorBoundary.jsx"; 
import ProtectedRoute from "./components/auth/ProtectedRoute.jsx"; // I have Wraped here the routes that require authentication
import ThemeToggle from "./components/ThemeToggle.jsx"; // I made here a Component to switch between light/dark themes

// I use here Lazy-loaded page components because loaded only when needed
const Login = lazy(() => import("./components/auth/Login.jsx"));
const Register = lazy(() => import("./components/auth/Register.jsx"));
const Dashboard = lazy(() => import("./components/Dashboard.jsx")); 
const Preferences = lazy(() => import("./components/Preferences.jsx")); 
const CitySelection = lazy(() => import("./components/CitySelection.jsx")); 
const Results = lazy(() => import("./components/Results.jsx")); // Displays results based on preferences
const Advice = lazy(() => import("./components/Advice.jsx")); 
const Profile = lazy(() => import("./components/Profile.jsx")); 
const Help = lazy(() => import("./components/Help.jsx")); 

// Context providers for global state management
import { AuthContextProvider } from "./context/AuthContext.jsx"; // Authentication state. "
import { PreferencesProvider } from "./context/PreferencesContext.jsx"; 
import { ThemeProvider } from "./context/ThemeContext.jsx"; // Theme (light/dark mode) management

// I generate here the main App component that sets up routing and wraps everything with context providers
function App() {
  return (
    // Wrap app in ThemeProvider for dark/light mode capabilities
    <ThemeProvider>
      <BrowserRouter>
        <AuthContextProvider>
          <PreferencesProvider>
            {/* Main container div with class for styling */}
            <div className="app-container">
              {/* Site header visible across all pages */}
              <Header />
              <main className="main-content">             
                <ErrorBoundary>
                  {/* Suspense wraps Routes to show loading screen during lazy loading */}
                  <Suspense fallback={<LoadingScreen />}>
                    {/* Define all application routes */}
                    <Routes>
                      {/* Redirect root path to dashboard */}
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />                     
                      {/* Public routes */}
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />   
                      {/* Protected routes - require authentication */}
                      <Route
                        path="/dashboard"
                        element={
                          <ProtectedRoute>
                            <Dashboard />
                          </ProtectedRoute>
                        }
                      />                     
                      <Route
                        path="/preferences"
                        element={
                          <ProtectedRoute>
                            <Preferences />
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/city-selection"
                        element={
                          <ProtectedRoute>
                            <CitySelection />
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/results"
                        element={
                          <ProtectedRoute>
                            <Results />
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/advice/:cityId" // Dynamic route parameter for city-specific advice
                        element={
                          <ProtectedRoute>
                            <Advice />
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/profile"
                        element={
                          <ProtectedRoute>
                            <Profile />

                          </ProtectedRoute>
                        }
                      />
                      {/* Help route - public but not protected */}
                      <Route path="/help" element={<Help />} />
                    </Routes>
                  </Suspense>
                </ErrorBoundary>
              </main>             
              {/* Site footer visible across all pages */}
              <Footer />             
              {/* Theme toggle button visible across all pages */}
              <ThemeToggle />
            </div>
          </PreferencesProvider>
        </AuthContextProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App; 
