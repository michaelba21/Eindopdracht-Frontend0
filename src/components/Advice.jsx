// Import required React hooks and components
import { useState, useContext, useEffect} from "react";
import { useParams, Link } from "react-router-dom";
import { PreferencesContext } from "../context/PreferencesContext.jsx";
import { fetchWeatherData, fetchUVIndex } from "../services/weatherService.jsx";
import { fetchPollenData, fetchAirQuality } from "../services/pollenService.jsx";
import { generateAdvice } from "../utils/adviceGenerator.jsx";
import "./Advice.css";
import { prepareSecureShare } from '../utils/encryption';

const CityAdvice = () => { 
  // Get cityId from URL parameters
  const { cityId } = useParams();
  
  // Get user preferences from context
  const { preferences } = useContext(PreferencesContext);
  
  // State for storing location data and advice
  const [locationInfo, setLocationInfo] = useState(null);
  const [tips, setTips] = useState(null);
  const [isFetching, setIsFetching] = useState(true);
  const [issueMsg, setIssueMsg] = useState("");

  // Main data fetching effect
  useEffect(() => {
    const gatherInfo = async () => {
      try {
        console.log(`Collecting data for ${cityId}...`);
        
        // Fetch primary weather and pollen data
        const weatherInfo = await fetchWeatherData(cityId);
        const pollenLevels = await fetchPollenData(cityId);

        // Initialize optional data points
        let uvValue = null;
        let airStatus = null;

        // I have generated here a code with special charater that only fetch UV and air quality if coordinates are available
        if (weatherInfo.coord) {
          try {
            // Fetch UV index data
            const uvResult = await fetchUVIndex(
              weatherInfo.coord.lat, 
              weatherInfo.coord.lon
            );
            uvValue = uvResult.value;
          } catch (uvIssue) {
            console.warn(`UV data unavailable for ${cityId}:`, uvIssue);
          }

          try {
            // Fetch air quality data
            const aqResult = await fetchAirQuality(cityId);
            if (aqResult.stations?.length) {
              airStatus = aqResult.stations[0];
            }
          } catch (aqIssue) {
            console.warn(`Air quality data missing for ${cityId}:`, aqIssue);
          }
        }

        // Check for severe weather conditions
        const hasSevereWeather =
          weatherInfo.wind.speed > 15 || // High winds
          weatherInfo.weather[0].main.toLowerCase().includes("storm") || 
          weatherInfo.weather[0].main.toLowerCase().includes("thunder"); 

        // Update state with all collected data
        setLocationInfo({
          name: cityId,
          weather: weatherInfo,
          pollen: pollenLevels,
          uvIndex: uvValue,
          airQuality: airStatus,
        });

        // Generate personalized advice based on all data
        const adviceContent = generateAdvice(
          weatherInfo,
          pollenLevels,
          preferences,
          hasSevereWeather,
          uvValue,
          airStatus
        );
        setTips(adviceContent);
      } catch (err) {
        console.warn("Data retrieval issue:", err);
        setIssueMsg("Fout bij het laden van de gegevens."); // "Error loading data"
      } finally {
        setIsFetching(false); 
      }
    };

    gatherInfo();
  }, [cityId, preferences]); // Re-run when cityId or preferences change

  /**
   * JSDoc @param annotations to document function parameters and improve code clarity
   * @param {string} channel - Sharing method ('email', 'whatsapp', 'clipboard')
   */
  const shareTips = async (channel) => {
    if (!locationInfo || !tips) {
      alert("Geen advies beschikbaar om te delen."); 
      return;
    }

    try {
      // Prepare email content in advance
      const emailContent = {
        subject: `Hooikoortsadvies voor ${locationInfo.name}`,
        body: `Van: michael.barak@novi-education.nl\n\n` +
              `Stad: ${locationInfo.name}\n\n` +
              `Weer: ${locationInfo.weather.weather[0].description}, ` +
              `${Math.round(locationInfo.weather.main.temp)}°C\n\n` +
              ///+ concatenates strings and \n\n adds line breaks for formatting the email content. 
              `Pollen niveaus:\n` +
              `- Gras: ${ratePollen(locationInfo.pollen.grass)}\n` +
              `- Boom: ${ratePollen(locationInfo.pollen.tree)}\n` +
              `- Onkruid: ${ratePollen(locationInfo.pollen.weed)}\n\n` +
              `Advies:\n${tips.general}\n\n` +
              `Medicatie tips:\n${tips.medication.join('\n')}\n\n` +
              `Activiteiten suggesties:\n${tips.activities.join('\n')}\n\n` +
              `Verzonden via Hooikoorts Stadwijzer`
      };

      if (channel === "email") {
        // Get email button for visual feedback
        const emailButton = document.querySelector('.btn-secondary[type="button"]');
        if (emailButton) {
          emailButton.textContent = "Bezig met openen..."; 
          emailButton.disabled = true;
        }

        try {
          // Create mailto URL
          const mailtoUrl = `mailto:michael.barak@novi-education.nl?subject=${
            encodeURIComponent(emailContent.subject)}&body=${
            encodeURIComponent(emailContent.body)}`;

          // Programmatically click a hidden link
          const link = document.createElement('a');
          link.href = mailtoUrl;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // Reset button after delay
          setTimeout(() => {
            if (emailButton) {
              emailButton.textContent = "E-mail advies"; 
              emailButton.disabled = false;
            }
          }, 1000);

        } catch (error) {
          console.error("E-mail openen mislukt:", error);
          // Fallback to alert if mail client fails
          alert(`Kon e-mailclient niet openen. Kopieer deze tekst:\n\n${
            emailContent.subject}\n\n${emailContent.body}`);
          
          // Reset button
          if (emailButton) {
            emailButton.textContent = "E-mail advies";
            emailButton.disabled = false;
          }
        }
      } else if (channel === "whatsapp") {
        //I have Prepared here WhatsApp message
        const whatsappText = `Hooikoortsadvies voor ${locationInfo.name}:\n\nWeer: ${locationInfo.weather.weather[0].description}\nPollenlevels: Gras (${ratePollen(locationInfo.pollen.grass)}), Boom (${ratePollen(locationInfo.pollen.tree)})\n\n${tips.general}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(whatsappText)}`, "_blank");
      } else {
        // I have Prepared in below clipboard text
        const clipboardText = `Hooikoortsadvies voor ${locationInfo.name}\n\nWeer: ${Math.round(locationInfo.weather.main.temp)}°C, ${locationInfo.weather.weather[0].description}\nPollenlevels:\n- Gras: ${ratePollen(locationInfo.pollen.grass)}\n- Boom: ${ratePollen(locationInfo.pollen.tree)}\n- Onkruid: ${ratePollen(locationInfo.pollen.weed)}\n\n${tips.general}`;
        
        // Try modern clipboard API first
        navigator.clipboard.writeText(clipboardText)
          .then(() => alert("Advies gekopieerd naar klembord!")) 
          .catch((err) => {
            console.error("Kopiëren mislukt:", err);
            // I have shwn here a fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = clipboardText;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            alert("Advies gekopieerd naar klembord!");
          });
      }
    } catch (error) {
      console.error("Delen mislukt:", error);
      alert("Er ging iets mis bij het delen. Probeer het later opnieuw."); // "Sharing failed"
    }
  };

  // Handle keyboard accessibility for share buttons
  const handleKeyPress = (event, action) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };

  // Loading state
  if (isFetching) {
    return (
      <div className="advice-loading">
        <div className="loading-spinner"></div>
        <p>Gegevens worden opgehaald...</p> {/* "Fetching data..." */}
      </div>
    );
  }

  // Error state
  if (issueMsg) {
    return (
      <div className="advice-error">
        <h2>Probleem</h2>
        <p>{issueMsg}</p>
        <Link to="/results" className="btn btn-primary">
          Terug naar overzicht 
        </Link>
      </div>
    );
  }

  // Main render
  return (
    <div className="advice-container" role="main">
      <h2>Advies voor {locationInfo.name}</h2>

      {/* Weather overview section */}
      <div className="advice-summary">
        <div className="weather-overview" tabIndex="0" role="region" aria-label="Weeroverzicht">
          <img
          ///I mean from @2x.png the image is twice the normal resolution 
            src={`https://openweathermap.org/img/wn/${locationInfo.weather.weather[0].icon}@2x.png`}
            alt={locationInfo.weather.weather[0].description}
          />
          <div className="weather-details">
            <h3>{locationInfo.name}</h3>
            {/* Rounding (Math.round()): Simplifies decimal numbers */}
            <p className="temp">{Math.round(locationInfo.weather.main.temp)}°C</p>
            <p className="weather-desc">{locationInfo.weather.weather[0].description}</p>
            {locationInfo.uvIndex !== null && (
              <p className="uv-index">
                UV-index: <span className={styleUV(locationInfo.uvIndex)}>{locationInfo.uvIndex}</span>
              </p>
            )}
          </div>
        </div>

        {/* Pollen overview section */}
        <div className="pollen-overview" tabIndex="0" role="region" aria-label="Pollenoverzicht">
          <h3>Pollenstatus</h3> 
          <div className="pollen-levels">
            {/* Grass pollen level */}
            <div 
              className="pollen-level" 
              tabIndex="0" 
              role="region" 
              aria-label={`Graspollen niveau: ${ratePollen(locationInfo.pollen.grass)}`}
            >
              <span>Graspollen</span> 
              <div className="level-bar">
                <div
                  className="level-fill"
                  // I applied here a percentage Calculation.it Converts pollen level from a 0-5 scale to a percentage width for visual bar display and apply corresponding background color.
                  style={{
                    width: `${(locationInfo.pollen.grass / 5) * 100}%`,
                    backgroundColor: shadePollen(locationInfo.pollen.grass),
                  }}
                ></div>
              </div>
              <span style={{ color: shadePollen(locationInfo.pollen.grass) }}>
                {ratePollen(locationInfo.pollen.grass)}
              </span>
            </div>
            
            {/* Tree pollen level */}
            <div 
              className="pollen-level" 
              tabIndex="0" 
              role="region" 
              aria-label={`Boompollen niveau: ${ratePollen(locationInfo.pollen.tree)}`}
            >
              <span>Boompollen</span> 
              <div className="level-bar">
                <div
                  className="level-fill"
                  style={{
                    width: `${(locationInfo.pollen.tree / 5) * 100}%`,
                    backgroundColor: shadePollen(locationInfo.pollen.tree),
                  }}
                ></div>
              </div>
              <span style={{ color: shadePollen(locationInfo.pollen.tree) }}>
                {ratePollen(locationInfo.pollen.tree)}
              </span>
            </div>
            
            {/* Weed pollen level */}
            <div 
              className="pollen-level" 
              tabIndex="0" 
              role="region" 
              aria-label={`Onkruidpollen niveau: ${ratePollen(locationInfo.pollen.weed)}`}
            >
              <span>Onkruidpollen</span> 
              <div className="level-bar">
                <div
                  className="level-fill"
                  style={{
                    width: `${(locationInfo.pollen.weed / 5) * 100}%`,
                    backgroundColor: shadePollen(locationInfo.pollen.weed),
                  }}
                ></div>
              </div>
              <span style={{ color: shadePollen(locationInfo.pollen.weed) }}>
                {ratePollen(locationInfo.pollen.weed)}
              </span>
            </div>
          </div>

          {/* Air quality section */}
          {locationInfo.airQuality && (
            <div className="air-quality" tabIndex="0" role="region" aria-label="Luchtkwaliteit">
              <p>
                Luchtkwaliteit:{" "} 
                <span style={{ color: shadeAQI(locationInfo.airQuality.AQI) }}>
                  {locationInfo.airQuality.status}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* I have generated here the advice text */}
      <div className="advice-text" tabIndex="0" role="region" aria-label="Advies tekst">
        <p>{tips.general}</p>
      </div>

      {/* I have shown here the medication tips */}
      <div className="advice-medication" tabIndex="0" role="region" aria-label="Medicatie tips">
        <h3>Medicatie tips</h3>
        <ul>
          {tips.medication.map((tip, idx) => (
            <li key={idx}>{tip}</li>
          ))}
        </ul>
      </div>

      {/* You see in below the activities suggestions */}
      <div className="advice-activities" tabIndex="0" role="region" aria-label="Activiteiten suggesties">
        <h3>Activiteiten suggesties</h3>
        <ul>
          {tips.activities.map((activity, idx) => (
            <li key={idx}>{activity}</li>
          ))}
        </ul>
      </div>

      {/* I have created here the Share buttons */}
      <div className="share-buttons" role="region" aria-label="Delen opties">
        <button
          className="btn btn-primary"
          onClick={() => shareTips("email")}
          onKeyDown={(e) => handleKeyPress(e, () => shareTips("email"))}
          aria-label="E-mail advies delen"
        >
          E-mail advies
        </button>
        <button
          className="btn btn-success"
          onClick={() => shareTips("whatsapp")}
          onKeyDown={(e) => handleKeyPress(e, () => shareTips("whatsapp"))}
          aria-label="WhatsApp advies delen"
        >
          WhatsApp advies
        </button>
        <button
          className="btn btn-info"
          onClick={() => shareTips("clipboard")}
          onKeyDown={(e) => handleKeyPress(e, () => shareTips("clipboard"))}
          aria-label="Advies kopiëren naar klembord"
        >
          Kopieer advies
        </button>
      </div>

      <Link to="/results" className="btn btn-secondary">
        Terug naar overzicht
      </Link>
    </div>
  );
};

export default CityAdvice;

/**
 * Utility: Rates pollen level (0-5) as descriptive string. 
 * @param {number} level 
 * @returns {string}
 */
function ratePollen(level) {
  if (level <= 1) return "Laag";
  if (level <= 3) return "Gemiddeld";
  if (level <= 5) return "Hoog";
  return "Onbekend";
}

/**
 *  Returns a color based on pollen severity
 * @param {number} level 
 * @returns {string}
 */
function shadePollen(level) {
  if (level <= 1) return "#4caf50"; // Green= low pollen concentration
  if (level <= 3) return "#ffeb3b"; // Yellow
  if (level <= 5) return "#f44336"; // Red
  return "#9e9e9e"; // Gray= high pollen concentration
}

/**
 * I mean from @param here a describtion of a parameter. It returns color for air quality index
 * @param {number} aqi 
 * @returns {string}
 */
function shadeAQI(aqi) {
  if (aqi <= 50) return "#4caf50";/// this color indicates Good air quality index
  if (aqi <= 100) return "#ffeb3b";
  if (aqi <= 150) return "#ff9800";
  if (aqi <= 200) return "#f44336";
  if (aqi <= 300) return "#9c27b0";
  return "#b71c1c";///this color indicates Hazardous air quality index
}

/**
 * Returns a CSS class for UV index color coding
 * @param {number} uv 
 * @returns {string}
 */
function styleUV(uv) {
  if (uv <= 2) return "uv-low";
  if (uv <= 5) return "uv-moderate";
  if (uv <= 7) return "uv-high";
  if (uv <= 10) return "uv-very-high";
  return "uv-extreme";
}
