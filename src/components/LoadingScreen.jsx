
import React from 'react';
import './LoadingScreen.css'; 

// Main LoadingScreen component that displays a loading animation with customizable props
const LoadingScreen = ({ 
  message = "Gegevens laden...",  
  fullScreen = false,              //  I have generated this because it expands loader to fill entire viewport when set to true
  overlay = false,                 // This property that I made here will added a soft background layer behind the loader if enabled
  size = "medium"                 
}) => {
  // Build the container class dynamically based on props
  const containerClass = `loading-screen ${fullScreen&&'fullscreen'} ${overlay&&'overlay'} ${size}`;

  return (
    <div className={containerClass}>
      <div className="loading-content">
        <div className="loading-spinner">
          {/* Three rings used to create a spinning animation */}
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        <div className="loading-message">
          <h3>{message}</h3> {/* Display the current loading message */}
          <div className="loading-dots">
            {/* Three dots for animated ellipsis effect */}
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Specific loading components for different scenarios and these are pre-configured versions of the main LoadingScreen component

// Used when loading API data
export const APILoadingScreen = ({ message = "API-gegevens ophalen..." }) => (
  <LoadingScreen message={message} fullScreen={true} overlay={true} />
);

// Used when loading weather data
export const WeatherLoadingScreen = () => (
  <LoadingScreen message="Weergegevens laden..." size="small" />
);

// Used when loading pollen data
export const PollenLoadingScreen = () => (
  <LoadingScreen message="Pollengegevens laden..." size="small" />
);

// Used when loading city-related data
export const CityDataLoadingScreen = () => (
  <LoadingScreen message="Stadsgegevens laden..." fullScreen={true} />
);

// Used when calculating and loading results. 
export const ResultsLoadingScreen = () => (
  ///fullScreen={true} makes the loading screen cover the entire viewport (like a splash screen)
  ///overlay={true} assist to semi-transparent background with a blur effect to the loading screen.
  <LoadingScreen message="Resultaten berekenen..." fullScreen={true} overlay={true} />
);

// Used when loading user profile data
export const ProfileLoadingScreen = () => (
  <LoadingScreen message="Profiel laden..." size="small" />////With this code I have attempted to display a smaller spinner suited for subtle or inline loading states
);

export default LoadingScreen; 