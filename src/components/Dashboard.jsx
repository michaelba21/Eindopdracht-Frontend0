// Client-side component for environmental dashboard
import React, { useState, useEffect,useContext} from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import { PreferencesContext } from "../context/PreferencesContext.jsx";
import { fetchWeatherData, fetchUVIndex } from "../services/weatherService.jsx";
import { getPollenLevels, getAirStats } from "../services/pollenService.jsx";
import contactImg from "../assets/neem contact.png";
import { APILoadingScreen } from "./LoadingScreen.jsx";
import "./Dashboard.css";


const EnvironmentalDashboard = () => {
  // i have used here Context hooks for authentication and user preferences
  const { currentUser } = useContext(AuthContext); 
  const { userPreferences } = useContext(PreferencesContext);

  // I applied here State management for dashboard data
  const [weatherData, setWeatherData] = useState(null); //  Stored  weather API response
  const [pollenData, setPollenData] = useState(null);
  const [uvData, setUvData] = useState(null); // Stores UV index value
  const [airQualityData, setAirQualityData] = useState(null); // Stores air quality data
  const [isLoading, setIsLoading] = useState(true); 
  const [errorMessage, setErrorMessage] = useState(""); 
  const navigate = useNavigate(); // Navigation hook

  // Main data fetching function
  const fetchEnvironmentalData = async () => {
    try {
      // Use preferred city or default to "Leeuwarden"
      const location = userPreferences?.selectedCities?.[0] || "Leeuwarden";
      
      //I have applied a Parallel fetch of weather and pollen data here by using Promise.all
      const [weather, pollen] = await Promise.all([
        fetchWeatherData(location),
        getPollenLevels(location)
      ]);

      setWeatherData(weather);
      setPollenData(pollen);

      // Fetch additional data if coordinates are available
      if (weather?.coord) {
        try {
          // i have applied Fetch of UV index by using latitude/longitude from weather data
          const uv = await fetchUVIndex(weather.coord.lat, weather.coord.lon);
          setUvData(uv.value);
        } catch (uvError) {
          console.warn("UV data error:", uvError);
        }

        try {
          //I have applied here a fetch air quality data
          const airQuality = await getAirStats(location);
          if (airQuality?.stations?.length) {
            // Use data from first station
            setAirQualityData(airQuality.stations[0]);
          }
        } catch (aqError) {
          console.warn("Air quality error:", aqError);
        }
      }
    } catch (error) {
      console.error("Data fetch error:", error);
      setErrorMessage("Kon milieugegevens niet laden"); 
    } finally {
      setIsLoading(false); // Always set loading to false
    }
  };

  // Effect hook to fetch data when preferences change
  useEffect(() => {
    fetchEnvironmentalData();
  }, [userPreferences]); // i utilized here a dependency array to ensures re-fetch when preferences change

  // Retry mechanism for failed fetches
  const retryFetch = async () => {
    setIsLoading(true);
    setErrorMessage('');
    await fetchEnvironmentalData();
  };

  // Loading state handling
  if (isLoading) {
    return <APILoadingScreen message="Milieugegevens laden..." />; // "Loading environmental data..."
  }

  return (
    <div className="environmental-dashboard">
      <h2>Welkom</h2> 

      {/* Error display with retry option */}
      {errorMessage && (
        <div className="error-alert">
          {errorMessage}
          <button onClick={retryFetch} className="retry-btn">
            Opnieuw proberen
          </button>
        </div>
      )}

      <div className="dashboard-content">
        {/* Main data card containing weather and environmental info */}
        <div className="data-card">
          <h3>Huidige status</h3> 
          
          <div className="weather-pollen-row">
            {/* Here I have displayed the Weather section*/}
            <div className="weather-container">
              {weatherData && (
                <div className="weather-info">
                  <div className="weather-main">
                    <div className="image">
                      <img
                        src={`https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`}
                        alt={weatherData.weather[0].description}
                        onError={(e) => {
                          e.target.onerror = null; // Prevent infinite error loop
                          e.target.style.display = 'none'; // Hide broken image
                          e.target.parentElement.innerHTML = '☁️'; // Fallback emoji
                        }}
                      />
                    </div>
                    <div className="weather-text">
                      <h4>{weatherData.name}</h4>
                      <p className="temperature">
                        {Math.round(weatherData.main.temp)}°C {/* Temperature */}
                      </p>
                      <p className="weather-description">
                        {weatherData.weather[0].description} {/* Weather condition */}
                      </p>
                    </div>
                  </div>
                  <div className="weather-details">
                    {/* Weather detail items */}
                    <div className="weather-detail">
                      <span>Luchtvochtigheid</span>
                      <span>{weatherData.main.humidity}%</span>
                    </div>
                    <div className="weather-detail">
                      <span>Windsnelheid</span> 
                      <span>{Math.round(weatherData.wind.speed * 3.6)} km/h</span>
                    </div>
                    <div className="weather-detail">
                      <span>Luchtdruk</span>
                      <span>{weatherData.main.pressure} hPa</span>
                    </div>
                    {uvData !== null && ( /* UV index if available */
                      <div className={`weather-detail ${getUVClass(uvData)}`}>
                        <span>UV Index</span>
                        <span>{uvData.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Pollen display section */}
            <div className="pollen-container">
              {pollenData && (
                <div className="pollen-info">
                  <h4>Pollen niveaus</h4> 
                  <div className="pollen-levels">
                    {/* Grass pollen level */}
                    <div className="pollen-level" data-level={getPollenLevel(pollenData.grass)}>
                      <span>Graspollen</span> 
                      <div className="level-bar">
                        <div
                          className="level-fill"
                          style={{
                            width: `${(pollenData.grass / 5) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <span>{getPollenLabel(pollenData.grass)}</span>
                    </div>
                    {/* Tree pollen level */}
                    <div className="pollen-level" data-level={getPollenLevel(pollenData.tree)}>
                      <span>Boompollen</span> 
                      <div className="level-bar">
                        <div
                          className="level-fill"
                          style={{
                            width: `${(pollenData.tree / 5) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <span>{getPollenLabel(pollenData.tree)}</span>
                    </div>
                    {/* Weed pollen level */}
                    <div className="pollen-level" data-level={getPollenLevel(pollenData.weed)}>
                      <span>Onkruidpollen</span> 
                      <div className="level-bar">
                        <div
                          className="level-fill"
                          style={{
                            width: `${(pollenData.weed / 5) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <span>{getPollenLabel(pollenData.weed)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Air quality display section */}
          {airQualityData && (
            <div className="air-quality-info">
              <h4>Luchtkwaliteit</h4> 
              <div className="air-quality-index">
                <div className="aqi-value" style={{ color: getAQIColor(airQualityData.AQI) }}>
                  {Math.round(airQualityData.AQI)} 
                </div>
                <div className="aqi-label">
                  <span>Luchtkwaliteitsindex</span>
                  <span>{getAQILabel(airQualityData.AQI)}</span> 
                </div>
              </div>
              <div className="air-quality-details">
                <div className="air-quality-detail">
                  <span>PM10</span>
                  <span>{Math.round(airQualityData.PM10)} µg/m³</span>
                </div>
                <div className="air-quality-detail">
                  <span>PM2.5</span>
                  <span>{Math.round(airQualityData.PM25)} µg/m³</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick actions card in dashoard*/}
        <div className="actions-card">
          <h3>Snelle acties</h3>
          <div className="action-buttons">
            <div className="action-buttons-group">
              <button onClick={() => navigate("/preferences")} className="primary-btn">
                Voorkeuren instellen 
              </button>
              <button onClick={() => navigate("/city-selection")} className="secondary-btn">
                Steden selecteren 
              </button>
              <button onClick={() => navigate("/results")} className="secondary-btn">
                Resultaten bekijken 
              </button>
            </div>
            <div className="contact-image">
              <img src={contactImg} alt="Contact opnemen" /> 
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions for data visualization

const getPollenColor = (value) => {
  const colors = ["#4caf50", "#8bc34a", "#ffc107", "#ff9800", "#f44336"]; 
  return colors[Math.min(Math.floor(value), colors.length - 1)];
};

const getPollenLabel = (value) => {
  // Array of pollen level labels from low to high
  const labels = ["Laag", "Laag-Matig", "Matig", "Matig-Hoog", "Hoog"];
  // I have Returned label here based on floored pollen value, clamped to last label to avoid out-of-range errors
  return labels[Math.min(Math.floor(value), labels.length - 1)];
};

const getUVClass = (value) => {
  if (value < 3) return "uv-low";///// UV index less than 3 is low risk
  if (value < 6) return "uv-moderate";
  if (value < 8) return "uv-high";
  if (value < 11) return "uv-very-high";
  return "uv-extreme";
};

const getAQIColor = (index) => {
  
  const colors = ["#4caf50", "#ffeb3b", "#ff9800", "#f44336", "#9c27b0", "#880e4f"];// I have shwn here  the array of colors corresponding to air quality levels from good (green) to hazardous (purple)
  // AQI thresholds that define category boundaries
  const thresholds = [50, 100, 150, 200, 300];
  const level = thresholds.findIndex(threshold => index <= threshold);
  return colors[level >= 0 ? level : colors.length - 1];
};

const getAQILabel = (index) => {
  const labels = ["Goed", "Redelijk", "Matig", "Slecht", "Erg slecht", "Gevaarlijk"];
  const thresholds = [50, 100, 150, 200, 300];
  // I applid below code in order to find the first threshold that the AQI index is less than or equal to
  const level = thresholds.findIndex(threshold => index <= threshold);
    // I Returned the corresponding color here; it indicates if index exceeds all thresholds, return the last color (hazardous)
  return labels[level >= 0 ? level : labels.length - 1];
};

const getPollenLevel = (value) => {
  if (value >= 4) return 'very-high';// Pollen value 4 or higher is very high
  if (value >= 3) return 'high';
  if (value >= 2) return 'medium';
  if (value >= 1) return 'low';
  return 'very-low';// Below 1 is very low pollen level
};

export default EnvironmentalDashboard;
