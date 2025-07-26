import { useEffect,useState} from 'react';
import './ErrorMessage.css'; 


const ErrorMessage = ({ message, onDismiss }) => {
  // State to control visibility of the error message 
  const [isVisible, setIsVisible] = useState(true);

  // Effect for auto-dismiss functionality  and it dismiss the message after 5 seconds
  useEffect(() => { 
    const timer = setTimeout(() => {
      setIsVisible(false); 
      if (onDismiss) onDismiss(); 
    }, 5000); // 5000 milliseconds = 5 seconds. 

    // I utilized below code for Clean up function in order to clear the timer if component unmounts
    return () => clearTimeout(timer);
  }, [onDismiss]); // Dependency array ensures effect runs when onDismiss changes

  
  if (!isVisible) return null;

  // Render the error message UI
  return (
    <div 
      className="error-message" 
      role="alert" // ARIA (Accessible Rich Internet Applications) role for accessibility (screen readers) and improve accessibility for people who use assistive tools 
    >
      {/* Message content container */}
      <div className="error-content">
        <span className="error-icon">⚠️</span> 
        <p>{message}</p> {/* with this code I have tried to display the error message */}
      </div>

      {/* Close button */}
      <button 
        className="error-dismiss" 
        onClick={() => {
          setIsVisible(false); // Hide the message
          if (onDismiss) onDismiss(); 
        }}
        aria-label="Sluiten" 
      >
        × 
      </button>
    </div>
  );
};

export default ErrorMessage; 