
import { useState, useContext, useEffect} from "react";
import { Link } from "react-router-dom";
import { PreferencesContext } from "../context/PreferencesContext.jsx"; 
import { AuthContext } from "../context/AuthContext.jsx"; 
import { fetchWeatherData, fetchUVIndex } from "../services/weatherService.jsx"; 
import { fetchPollenData } from "../services/pollenService.jsx";
import { computeCityScore } from "../utils/scoreCalculator.jsx"; 
import { ResultsLoadingScreen } from "./LoadingScreen.jsx"; 
import "./Results.css"; 


function Results() {
  const { preferences, loading: prefsLoading } = useContext(PreferencesContext); 
  const { isAuthenticated, createDemoUser } = useContext(AuthContext); // Authentication status and demo user creation
  const [cityResults, setCityResults] = useState([]); // Store final results
  const [loading, setLoading] = useState(true); 
  const [errorMsg, setErrorMsg] = useState(""); 
  const [cityWarnings, setCityWarnings] = useState({}); // I showed here a Warnings for failed city data fetching

  // I have Created a demo user if not authenticated happened
  useEffect(() => {
    if (!isAuthenticated) {
      createDemoUser();
    }
  }, [isAuthenticated, createDemoUser]);

  // Effect to load and process all city data
  useEffect(() => {
    async function loadResults() {
      if (prefsLoading) return; // Wait until preferences are loaded
      if (!preferences) { 
        setErrorMsg("Voorkeuren niet gevonden. Stel je voorkeuren in.");
        setLoading(false);
        return;
      }
      if (!preferences.selectedCities || preferences.selectedCities.length === 0) { // i used this to Check here if cities were selected. 
        setErrorMsg("Geen steden geselecteerd. Kies eerst steden om te vergelijken.");
        setLoading(false);
        return;
      }

      const results = []; 
      const warnings = {}; // To store any issues with specific cities

      // Process each selected city
      for (const city of preferences.selectedCities) {
        try {
          const weather = await fetchWeatherData(city); // i have got here weather data for city
          let pollen = await fetchPollenData(city, weather); 

         // Normalize pollen data response structure (API may return Risk or risk).
          if (pollen.data) pollen = pollen.data; // I mean here if data is nested under 'data', use that
          pollen = {
            grass: riskToNum(pollen?.Risk?.grass_pollen || pollen?.risk?.grass_pollen || "low"), // Grass pollen risk to number
            tree: riskToNum(pollen?.Risk?.tree_pollen || pollen?.risk?.tree_pollen || "low"), // Tree pollen risk to number. 
            weed: riskToNum(pollen?.Risk?.weed_pollen || pollen?.risk?.weed_pollen || "low"), // Weed pollen risk to number
            risk: { // Original risk labels for UI
              grass_pollen: pollen?.Risk?.grass_pollen || pollen?.risk?.grass_pollen || "low",
              tree_pollen: pollen?.Risk?.tree_pollen || pollen?.risk?.tree_pollen || "low",
              weed_pollen: pollen?.Risk?.weed_pollen || pollen?.risk?.weed_pollen || "low",
            },
          }; 

          let uv = null; // I have initialized here the UV index
          let air = null; 
          // Fetch UV index if coordinates are available
          if (weather.coord) {
            try {
              const uvData = await fetchUVIndex(weather.coord.lat, weather.coord.lon);
              uv = uvData.value ?? 0;
            } catch {
              uv = 0;
            }

            // Calculate simple air quality estimate based on multiple factors
            const pollenSum = (pollen.grass + pollen.tree + pollen.weed) || 0;
            air = Math.round(
              (weather.main.temp * 0.3) +
              (weather.main.humidity * 0.2) +
              ((weather.wind?.speed || 0) * 0.1) +
              (pollenSum * 0.4)
            );
          }

          // Calculate overall city score based on all collected data
          const score = computeCityScore(weather, pollen, preferences, uv, air);

          // Add processed city result to results array
          results.push({
            name: city,
            score,
            weather,
            pollen,
            uvIndex: uv,
            airQuality: air,
          });
        } catch (err) {
          // Store any errors for this city
          warnings[city] = err.message || "Onbekende fout";
        }
      }

      // Update state with collected results and warnings
      setCityWarnings(warnings);

      // i have handled  case here where no data was successfully fetched
      if (results.length === 0) {
        setErrorMsg("Geen resultaten. Controleer je internetverbinding of voorkeuren.");
        setLoading(false);
        return;
      }

      // Sort results by score (primary), air quality (secondary), and UV index (tertiary)
      results.sort((a, b) => {
        if (Math.abs(a.score - b.score) < 1) {
          if ((a.airQuality ?? 0) !== (b.airQuality ?? 0)) return (a.airQuality ?? 0) - (b.airQuality ?? 0);
          if (a.uvIndex !== b.uvIndex) return a.uvIndex - b.uvIndex;
        }
        return b.score - a.score;
      });

      // Update state with sorted results and finish loading
      setCityResults(results);
      setLoading(false);
    }

    // Call the loadResults function
    loadResults();
  }, [preferences, prefsLoading]); // I mean here this effect will run when dependencies are changed

  // I have Shown here the loading screen while data is being fetched
  if (prefsLoading || loading) {
    return <ResultsLoadingScreen message="Resultaten worden geladen..." />;
  }

  // Show error message if there's an error
  if (errorMsg) {
    return (
      <div className="results-error">
        <h2>Fout</h2>
        <p>{errorMsg}</p>
        <Link to="/city-selection" className="btn btn-primary">
          Kies steden
        </Link>
      </div>
    );
  }

  // Main render of the component
  return (
    <div className="results-container">
      <h2>Topsteden voor hooikoorts</h2>
      <p className="results-intro">
        Hier zie je de beste {Math.min(5, cityResults.length)} steden in Friesland op basis van jouw voorkeuren. De score is een combinatie van weer, pollen en jouw instellingen.
      </p>

      {/* Render results header, intro, and warnings list for cities with fetch errors */}    
      {Object.keys(cityWarnings).length > 0 && (
        <div className="city-errors">
          <h3>Let op</h3> 
          <ul>
            {Object.entries(cityWarnings).map(([city, msg]) => (
              <li key={city}>{city}: {msg}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Render top 5 city results with ranking, city name, and rounded score inside result cards*/}
      <div className="results-list">
        {cityResults.slice(0, 5).map((city, idx) => (
          <div key={city.name} className="result-card">
            <div className="result-rank">{idx + 1}</div>
            <div className="result-content">
              <div className="result-header">
                <h3>{city.name}</h3>
                <div className="result-score">
                  <span className="score-value">{Math.round(city.score)}</span>
                  <span className="score-label">Score</span>
                </div>
              </div>

              {/* Weather summary */}
              <div className="result-details">
                <div className="weather-summary">
                  <img
                    src={`https://openweathermap.org/img/wn/${city.weather.weather[0].icon}.png`}  
                    alt={city.weather.weather[0].description}
                  />
                  <div>
                    <span className="temp">{Math.round(city.weather.main.temp)}°C</span>
                    <span className="weather-desc">{city.weather.weather[0].description}</span>
                  </div>
                </div>

                {/* Pollen levels */}
                <div className="pollen-summary">
                  <div className="pollen-item">
                    <span>Graspollen</span>
                    <div className={`pollen-indicator ${pollenClass(city.pollen.risk?.grass_pollen)}`}></div>
                  </div>
                  <div className="pollen-item">
                    <span>Boompollen</span>
                    <div className={`pollen-indicator ${pollenClass(city.pollen.risk?.tree_pollen)}`}></div>
                  </div>
                  <div className="pollen-item">
                    <span>Onkruidpollen</span>
                    <div className={`pollen-indicator ${pollenClass(city.pollen.risk?.weed_pollen)}`}></div>
                  </div>
                </div>
              </div>

              {/* I showed in the below code the additional metrics like UV index and air quality */}
              <div className="additional-metrics">
                {city.uvIndex !== null && (
                  <div className="metric">
                    <span className="metric-label">UV Index</span>
                    {/* Conditionally render UV index metric when available, formatting value to 1 decimal with toFixed and styling with dynamic class.  */}
                    <span className={`metric-value ${uvClass(city.uvIndex)}`}>{city.uvIndex.toFixed(1)}</span>
                  </div>
                )}
                <div className="metric">
                  <span className="metric-label">Luchtkwaliteit</span>
                  {/* Round air quality value with Math.round() for cleaner display and combine with dynamic class for AQI styling */}
                  <span className={`metric-value ${aqiClass(city.airQuality)}`}>{Math.round(city.airQuality)}</span>
                </div>
              </div>

              {/* Link to detailed advice for this city */}
              <Link to={`/advice/${city.name}`} className="btn btn-secondary view-advice-btn">
                Bekijk advies
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Message shown when no results are found */}
      {cityResults.length === 0 && (
        <div className="no-results">
          <p>Geen resultaten gevonden. Selecteer steden om te vergelijken.</p>
          <Link to="/city-selection" className="btn btn-primary">
            Kies steden
          </Link>
        </div>
      )}
    </div>
  );
}

// Helper functions for transforming and categorizing data and it Convert pollen risk level to numeric value

function riskToNum(risk) {
  const map = { low: 1, moderate: 2, high: 3 };
  return map[risk?.toLowerCase()] ?? 1;////I have added a riskToNum here to convert risk text to number with default 1
}

// Determine CSS class for pollen risk level
function pollenClass(level) {
  const classes = {
    low: "pollen-low",
    moderate: "pollen-moderate",
    high: "pollen-high",
    "very high": "pollen-very-high"
  };
  return classes[level?.toLowerCase()] || "pollen-low";///Add fallback to return "pollen-low" when pollen level is undefined or unrecognized.
}

// Determine CSS class for UV index level
function uvClass(index) {
  if (index < 3) return "uv-low";
  if (index < 6) return "uv-moderate";
  if (index < 8) return "uv-high";
  if (index < 11) return "uv-very-high";
  return "uv-extreme";
}

// Determine CSS class for air quality index
function aqiClass(aqi) {
  if (aqi <= 50) return "aqi-good";
  if (aqi <= 100) return "aqi-moderate";
  if (aqi <= 150) return "aqi-unhealthy-sensitive";
  if (aqi <= 200) return "aqi-unhealthy";
  if (aqi <= 300) return "aqi-very-unhealthy";
  return "aqi-hazardous";
}

export default Results; 