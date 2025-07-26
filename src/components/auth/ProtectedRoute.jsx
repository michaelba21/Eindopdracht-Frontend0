// React imports for component functionality 
import { useContext, useEffect } from "react";      // Hooks for context and side effects
import { AuthContext } from "../../context/AuthContext.jsx"; 

/**
 SecureRoute Component - Authentication Wrapper and the Purpose is Protects routes by ensuring authentication before rendering content
 */
const SecureRoute = ({ children }) => {
  // Destructure values from authentication context
  const { 
    isAuthenticated,  // Boolean: true if user is logged in (real or demo). 
    isChecking,    
    createDemoUser    
  } = useContext(AuthContext);

  /**
    Authentication Management Effect and it triggers when:- Auth check completes (isChecking changes)
   */
  useEffect(() => {
    // Only execute if auth check is complete and user isn't authenticated
    if (!isChecking && !isAuthenticated) {
      console.log("Initializing test user for secure access");
      //I have generated here a temporary demo account
      createDemoUser();
    }
  }, [isChecking, isAuthenticated, createDemoUser]); // Dependency array. 

  /**
   Loading State Render and Shows while: Authentication status is being verified (isChecking = true)
   */
  if (isChecking) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "200px",  // Ensures visible loading area
          fontSize: "1.125rem", // Readable text size (~18px)
        }}
        className="loading"
      >
        Bezig met verifiëren... " 
      </div>
    );
  }

  /**
   Protected Content Render and Only reached when:Auth verification is complete (!isChecking) and it Returns whatever components/elements were passed as children
   */
  return children;
};

export default SecureRoute;
