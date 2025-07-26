// this code set up isolates errors, shows fallback UIs, and logs error & interaction metrics
import { Component } from "react";
import logService from "../services/logService"; 

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    // I have Initialized here state to track if an error has occurred.
    this.state = { hasError: false };
    
    // I have Initialized here interaction counters for metrics
    this.totalInteractions = 0; // Total number of interactions
    this.successfulInteractions = 0; 
  }

  // This lifecycle method updates state when an error is caught
  static getDerivedStateFromError(error) {
   
    return { hasError: true };
  }

  // This lifecycle method handles side effects when an error is caught
  componentDidCatch(error, errorInfo) {
    // Log the error to our logging service
    logService.logError("Application error", {
      error: error.toString(), 
      componentStack: errorInfo.componentStack, // componentStack is part of the User Interface related (e.g.button) and will be used for logging and debugging. 
      timestamp: new Date().toISOString() 
    });
    
    // Track this as a failed interaction
    this.totalInteractions++;
    
    try { 
      // Send error details to the metrics API endpoint
      fetch('http://localhost:3001/api/metrics/ui-error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: error.toString(),
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString()//////I have applied this here because it converts a Date object into a standardized string representation of the date and time in ISO 8601 format.
        })
      });
    } catch (err) {
      // If sending metrics fails, log that error too
      logService.logError("Failed to send error metrics", { 
        error: err.toString() 
      });
    }
  }

  // Method to track user interactions with the interface
  trackInteraction(success = true) {
    this.totalInteractions++;
    if (success) {
      this.successfulInteractions++;////increments the total count of interactions 
    }
    
    // Calculate the interface support percentage
    const supportPercentage = this.totalInteractions > 0 ?
      (this.successfulInteractions / this.totalInteractions) * 100 : 100; // (Here I have tried to illastrate the ratio of successful interactions to total interactions)
      
    // This special code that I generated in below can Only send metrics every 10 interactions to reduce network traffic
    if (this.totalInteractions % 10 === 0) {
      try {
        // Prepare metrics data 
        const metrics = {
          totalInteractions: this.totalInteractions,
          successfulInteractions: this.successfulInteractions,
          supportPercentage: supportPercentage.toFixed(2), // Round to 2 decimal places
          timestamp: new Date().toISOString()
        };

        // Log metrics to our service
        logService.logInfo("UI interaction metrics", metrics);

        // Send metrics to our API endpoint
        fetch('http://localhost:3001/api/metrics/ui-support', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(metrics)
        });
      } catch (err) {
        // Log any errors that occur while sending metrics
        logService.logError("Failed to send support metrics", { 
          error: err.toString() 
        });
      }
    }
  }

  render() {
    // If an error has been caught, render fallback UI (User Interface) 
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h2>Er is iets misgegaan</h2> 
          <p>
        de pagina wil gewoon niet laden? Probeer het nog eens te verversen, misschien werkt dat.  stuur dan anders even een berichtje naar support, want dit is niet hoe het hoort.
           
          </p>
          <button onClick={() => window.location.reload()}>
            Pagina verversen 
          </button>
        </div>
      );
    }

    // If no error, track successful render and render children
    this.trackInteraction(true);
    return this.props.children;
  }
}

export default ErrorBoundary;