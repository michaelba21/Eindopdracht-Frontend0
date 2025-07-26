
import React, { useEffect, useState, useRef, useContext} from "react";
import { useNavigate } from "react-router-dom";
import { PreferencesContext } from "../context/PreferencesContext.jsx";
import "./Preferences.css"; 


const Preferences = () => {
  const { preferences, updatePreferences } = useContext(PreferencesContext); 
  const navigate = useNavigate(); // I used this to hook for navigating to other routes

  // I displayed here a default of preference values that the user can reset to
  const defaultPreferences = {
    temperature: { min: 15, max: 25, weight: 3 }, 
    humidity: { min: 30, max: 60, weight: 2 },
    wind: { min: 0, max: 20, weight: 4 },
    uvIndex: { min: 0, max: 5, weight: 2 },
    pollenSensitivity: { grass: 3, tree: 3, weed: 3, weight: 4 },
  };

  // State for current form data
  const [formData, setFormData] = useState(defaultPreferences);

  // Track if there are unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Loading states for saving and resetting actions
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  
  const originalPreferences = useRef(null);

  // Effect to load saved preferences when component mounts 
  useEffect(() => {
    if (preferences) {
      setFormData(preferences);
      originalPreferences.current = JSON.parse(JSON.stringify(preferences)); // Store initial preferences.
    }

    // If online, check for pending preferences stored during offline usage and make get request 
    if (navigator.onLine) {
      const pending = localStorage.getItem("pendingPreferences");///I displayed here retrieves a string value
      if (pending) {
        try {
          const parsed = JSON.parse(pending);/////i used this because it takes that string and converts (parses) it back into a JavaScript object
          setFormData(parsed);/// use this parsed object as argument
          updatePreferences(parsed);
          localStorage.removeItem("pendingPreferences"); // Clear after syncing
          console.log("Synchronized offline preferences");
        } catch (e) {
          console.warn("Failed to sync offline preferences:", e);
        }
      }
    }
  }, [preferences, updatePreferences]);

  // Effect to detect changes in form data and update unsaved changes flag
  useEffect(() => {
    if (originalPreferences.current && !isSaving) {
      const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalPreferences.current);
      setHasUnsavedChanges(hasChanges);
    }
  }, [formData, isSaving]);

  // I applied effect here to warn user in case of leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges && !isSaving) {
        const message = "Je hebt niet-opgeslagen wijzigingen. wil je dat alsnog doen?";
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    if (hasUnsavedChanges && !isSaving) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, isSaving]);

  // Handle change in numeric input fields (min/max values). 
  const handleChange = (category, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: Number(value),
      },
    }));
  };

  // Handle change in pollen sensitivity levels
  const handlePollenChange = (type, value) => {
    setFormData((prev) => ({
      ...prev,
      pollenSensitivity: {
        ...prev.pollenSensitivity,
        [type]: Number(value), // Ensure numeric value
      },
    }));
  };

  // Validate that at least one criterion is selected and all ranges are valid
  const validateForm = () => {
      // Check at least one criterion has weight > 1
    const hasSelectedCriteria =
      formData.temperature.weight > 1 ||
      formData.humidity.weight > 1 ||
      formData.wind.weight > 1 ||
      formData.uvIndex.weight > 1 ||
      formData.pollenSensitivity.grass > 1 ||
      formData.pollenSensitivity.tree > 1 ||
      formData.pollenSensitivity.weed > 1 ||
      formData.pollenSensitivity.weight > 1;
 // Check all min values are <= max values
    const isValidRanges =
      formData.temperature.min <= formData.temperature.max &&
      formData.humidity.min <= formData.humidity.max &&
      formData.wind.min <= formData.wind.max &&
      formData.uvIndex.min <= formData.uvIndex.max;

    return hasSelectedCriteria && isValidRanges;
  };

  // Check if current form data matches defaults
  const isAtDefaultValues = () => {
    return JSON.stringify(formData) === JSON.stringify(defaultPreferences);
  };

  // Handle reset button click
  const handleReset = () => {
    const confirmReset = window.confirm(
      "Weet je zeker dat je alle voorkeuren wilt resetten naar de standaardwaarden? Deze actie kan niet ongedaan worden gemaakt."
    );
   if (confirmReset) {
      setIsResetting(true);
      try {
        setFormData(JSON.parse(JSON.stringify(defaultPreferences))); // Deep clone defaults
        updatePreferences(defaultPreferences); // Update context
        originalPreferences.current = JSON.parse(JSON.stringify(defaultPreferences)); // Update ref
        setHasUnsavedChanges(false); // No unsaved changes after reset
        alert("Voorkeuren zijn succesvol gereset naar standaardwaarden!");
      } catch (error) {
        console.error("Error resetting preferences:", error);
        alert("Er is een fout opgetreden bij het resetten van je voorkeuren. Probeer het opnieuw.");
      } finally {
        setIsResetting(false);
      }
    }
  };
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      alert("Selecteer minimaal één criterium en zorg dat minimumwaarden niet groter zijn dan maximumwaarden.");
      return;
    }

     // Special warning for potentially problematic settings
    if (formData.humidity.min > 70 && formData.wind.max < 10) {
      if (!window.confirm("Deze combinatie kan weinig resultaten opleveren. Wilt u doorgaan?")) {
        return;
      }
    }

    try {
      setIsSaving(true);

      // Offline handling - store locally if offline
      if (!navigator.onLine) {
        localStorage.setItem("pendingPreferences", JSON.stringify(formData));
        alert("U bent offline. Uw voorkeuren worden lokaal opgeslagen en gesynchroniseerd zodra u weer online bent.");
      }

      // Update preferences in context and navigate
      updatePreferences(formData);
      originalPreferences.current = JSON.parse(JSON.stringify(formData)); // Update ref
      setHasUnsavedChanges(false); // Changes are now saved
      navigate("/city-selection"); // Proceed to next step
    } catch (error) {
      console.error("Error saving preferences:", error);
      alert("Er is een fout opgetreden bij het opslaan van uw voorkeuren. Probeer het opnieuw.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="preferences-container">
      <h2>Stel je voorkeuren in</h2>
      <p className="preferences-intro">
        Pas je voorkeuren aan om de meest geschikte locaties voor jouw hooikoorts te vinden. Geef aan welke
        weersomstandigheden en pollenconcentraties voor jou belangrijk zijn.
      </p>

      {/* Form for user preferences */}
      <form onSubmit={handleSubmit} className="preferences-form">

        {/* Temperature section */}
        <div className="preferences-section">
          <h3>Temperatuur (°C)</h3>
          <div className="range-inputs">
            <div className="range-group">
              <label>Minimum</label>
              <input
                type="range"
                min="0"
                max="30"
                value={formData.temperature.min}
                onChange={(e) => handleChange("temperature", "min", e.target.value)}
              />
              <span>{formData.temperature.min}°C</span>
            </div>
            <div className="range-group">
              <label>Maximum</label>
              <input
                type="range"
                min="0"
                max="40"
                value={formData.temperature.max}
                onChange={(e) => handleChange("temperature", "max", e.target.value)}
              />
              <span>{formData.temperature.max}°C</span>
            </div>
          </div>
          <div className="weight-selector">
            <label>Belang</label>
            <select
              value={formData.temperature.weight}
              onChange={(e) => handleChange("temperature", "weight", e.target.value)}
            >
              <option value="1">Niet belangrijk</option>
              <option value="2">Enigszins belangrijk</option>
              <option value="3">Belangrijk</option>
              <option value="4">Zeer belangrijk</option>
              <option value="5">Cruciaal</option>
            </select>
          </div>
        </div>

        {/* Humidity section */}
        <div className="preferences-section">
          <h3>Luchtvochtigheid (%)</h3>
          <div className="range-inputs">
            <div className="range-group">
              <label>Minimum</label>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.humidity.min}
                onChange={(e) => handleChange("humidity", "min", e.target.value)}
              />
              <span>{formData.humidity.min}%</span>
            </div>
            <div className="range-group">
              <label>Maximum</label>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.humidity.max}
                onChange={(e) => handleChange("humidity", "max", e.target.value)}
              />
              <span>{formData.humidity.max}%</span>
            </div>
          </div>
          <div className="weight-selector">
            <label>Belang</label>
            <select
              value={formData.humidity.weight}
              onChange={(e) => handleChange("humidity", "weight", e.target.value)}
            >
              <option value="1">Niet belangrijk</option>
              <option value="2">Enigszins belangrijk</option>
              <option value="3">Belangrijk</option>
              <option value="4">Zeer belangrijk</option>
              <option value="5">Cruciaal</option>
            </select>
          </div>
        </div>

        {/* Wind speed section. */}
        <div className="preferences-section">
          <h3>Windsnelheid (km/u)</h3>
          <div className="range-inputs">
            <div className="range-group">
              <label>Minimum</label>
              <input
                type="range"
                min="0"
                max="50"
                value={formData.wind.min}
                onChange={(e) => handleChange("wind", "min", e.target.value)}
              />
              <span>{formData.wind.min} km/u</span>
            </div>
            <div className="range-group">
              <label>Maximum</label>
              <input
                type="range"
                min="0"
                max="50"
                value={formData.wind.max}
                onChange={(e) => handleChange("wind", "max", e.target.value)}
              />
              <span>{formData.wind.max} km/u</span>
            </div>
          </div>
          <div className="weight-selector">
            <label>Belang</label>
            <select value={formData.wind.weight} onChange={(e) => handleChange("wind", "weight", e.target.value)}>
              <option value="1">Niet belangrijk</option>
              <option value="2">Enigszins belangrijk</option>
              <option value="3">Belangrijk</option>
              <option value="4">Zeer belangrijk</option>
              <option value="5">Cruciaal</option>
            </select>
          </div>
        </div>

        {/* UV index section */}
        <div className="preferences-section">
          <h3>UV-index</h3>
          <div className="range-inputs">
            <div className="range-group">
              <label>Minimum</label>
              <input
                type="range"
                min="0"
                max="11"
                value={formData.uvIndex.min}
                onChange={(e) => handleChange("uvIndex", "min", e.target.value)}
              />
              <span>{formData.uvIndex.min}</span>
            </div>
            <div className="range-group">
              <label>Maximum</label>
              <input
                type="range"
                min="0"
                max="11"
                value={formData.uvIndex.max}
                onChange={(e) => handleChange("uvIndex", "max", e.target.value)}////(e) is the event parameter and handleChange describe 3 arguments
              />
              <span>{formData.uvIndex.max}</span>
            </div>
          </div>
          <div className="weight-selector">
            <label>Belang</label>
            <select value={formData.uvIndex.weight} onChange={(e) => handleChange("uvIndex", "weight", e.target.value)}>
              <option value="1">Niet belangrijk</option>
              <option value="2">Enigszins belangrijk</option>
              <option value="3">Belangrijk</option>
              <option value="4">Zeer belangrijk</option>
              <option value="5">Cruciaal</option>
            </select>
          </div>
        </div>

        {/* Pollen sensitivity section */}
        <div className="preferences-section">
          <h3>Pollengevoeligheid</h3>
          <p>Geef aan hoe gevoelig je bent voor verschillende soorten pollen.</p>
          <div className="pollen-sensitivity">
            <div className="pollen-type">
              <label>Graspollen</label>
              <div className="sensitivity-buttons">  
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    type="button"
                    className={formData.pollenSensitivity.grass === level&&"active"}///graspolen
                    onClick={() => handlePollenChange("grass", level)}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
            <div className="pollen-type">
              <label>Boompollen</label>
              <div className="sensitivity-buttons">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    type="button"
                    className={formData.pollenSensitivity.tree === level&&"active"}///treepollen
                    onClick={() => handlePollenChange("tree", level)}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
            <div className="pollen-type">
              <label>Onkruidpollen</label>
              <div className="sensitivity-buttons">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    type="button"
                    className={formData.pollenSensitivity.weed === level&&"active"}///weedpollen
                    onClick={() => handlePollenChange("weed", level)}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="weight-selector">
            <label>Belang</label>
            <select
              value={formData.pollenSensitivity.weight}
              onChange={(e) => handleChange("pollenSensitivity", "weight", e.target.value)}
            >
              <option value="1">Niet belangrijk</option>
              <option value="2">Enigszins belangrijk</option>
              <option value="3">Belangrijk</option>
              <option value="4">Zeer belangrijk</option>
              <option value="5">Cruciaal</option>
            </select>
          </div>
          <div className="sensitivity-legend">
            <span>1 = Niet gevoelig</span>
            <span>5 = Zeer gevoelig</span>
          </div>
        </div>

        {/* Form actions (reset & submit) */}
        <div className="form-actions">
          {hasUnsavedChanges && (
            <div className="unsaved-changes-warning">
              <span className="warning-icon">⚠️</span>
              <span>Je hebt niet-opgeslagen wijzigingen</span>
            </div>
          )}
          <div className="action-buttons-group">
            <button 
              type="button" 
              className="btn btn-reset" 
              onClick={handleReset}
              disabled={isSaving || isResetting || isAtDefaultValues()}
              title={isAtDefaultValues() ? "Voorkeuren zijn al op standaardwaarden" : "Reset alle voorkeuren naar standaardwaarden"}
            >
              {isResetting ? "Resetten..." : "Reset naar standaard"}
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving || isResetting}>
              {isSaving ? "Opslaan..." : "Opslaan en doorgaan"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Preferences; 
