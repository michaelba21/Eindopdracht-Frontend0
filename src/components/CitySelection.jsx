import React, { useEffect,useContext, useState} from "react";
import { useNavigate } from "react-router-dom";
import { PreferencesContext } from "../context/PreferencesContext.jsx";
import { AuthContext } from "../context/AuthContext.jsx";
import { CityDataLoadingScreen } from "./LoadingScreen.jsx";
import "./CitySelection.css";

// In below I have shown a list of available cities in Friesland region
const availableCities = [
  "Leeuwarden", "Sneek", "Drachten", "Heerenveen", "Harlingen",
  "Franeker", "Bolsward", "Dokkum", "Joure", "Lemmer",
  "Wolvega", "Gorredijk", "Buitenpost", "Kollum", "Burgum",
  "Grou", "Akkrum", "Workum", "Makkum", "Oosterwolde",
];

const MAX_SELECTION = 10; // I have showed here the maximum number of selectable cities

const CitySelection = () => {
  // Context hooks for preferences and authentication
  const { preferences, updatePreferences, loading: isLoadingPrefs } = useContext(PreferencesContext);
  const { isAuthenticated, createDemoUser } = useContext(AuthContext);
  const navigate = useNavigate();

  // Component state management
  const [chosenCities, setChosenCities] = useState([]); // Currently selected cities
  const [query, setQuery] = useState(""); 
  const [saving, setSaving] = useState(false); // Loading state for form submission
  const [csvImporting, setCsvImporting] = useState(false); // Loading state for CSV import
  const [csvError, setCsvError] = useState("");
  const [csvSuccess, setCsvSuccess] = useState("");

  // I have applied here a useEffect to create demo user if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      const user = createDemoUser();
      if (user) console.log("Demo user created.");
    }
  }, [isAuthenticated, createDemoUser]);

  // Effect to initialize selected cities from preferences
  useEffect(() => {
    if (!isLoadingPrefs && preferences) {
      if (preferences.selectedCities?.length > 0) {
        // Use cities from preferences if available
        setChosenCities(preferences.selectedCities);
      } else {
        // Fallback to default cities if no preferences exist
        const fallbackCities = ["Leeuwarden", "Sneek", "Drachten"];
        setChosenCities(fallbackCities);
        updatePreferences({ selectedCities: fallbackCities });
      }
    }
  }, [preferences, isLoadingPrefs, updatePreferences]);

  // Toggles city selection, enforcing maximum selection limit
  const toggleCitySelection = (city) => {
    setChosenCities((prev) => {
      if (prev.includes(city)) {
        // Remove city if already selected
        return prev.filter((c) => c !== city);
      } else {
        // Add city if under selection limit
        if (prev.length >= MAX_SELECTION) {
          alert(`Je kunt maximaal ${MAX_SELECTION} steden selecteren.`);
          return prev;
        }
        return [...prev, city];
      }
    });
  };

  // I have Parsed the CSV text into an array of city names in order to splits lines, trims, and stores city names.
  const parseCSV = (csvText) => {
    const lines = csvText.split("\n").map((line) => line.trim()).filter(line => line);
   
    const cities = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip header row if it contains common header terms
      if (i === 0 && /^(stad|city|naam|name|plaats)/i.test(line)) {
        continue;
      }

      // I have Parsed the CSV line here in order to handle quotes and commas. 
      const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
      if (matches && matches.length > 0) {
        // Take the first column and clean it
        let city = matches[0].replace(/^"|"$/g, "").trim();
        if (city) {
          cities.push(city);
        }
      } else {
        // // I used below code in order to handles lines with only city name, no commas
        if (line && !line.includes(",")) {
          cities.push(line);
        }
      }
    }

    return cities;
  };

  // Validates cities against availableCities list
  const validateCities = (cities) => {
    const validCities = [];
    const invalidCities = [];

    cities.forEach((city) => {
      // Case-insensitive comparison with available cities
      const foundCity = availableCities.find(
        (availableCity) => availableCity.toLowerCase() === city.toLowerCase()
      );

      if (foundCity) {
        validCities.push(foundCity); // Use correctly cased version
      } else {
        invalidCities.push(city);
      }
    });

    return { validCities: [...new Set(validCities)], invalidCities }; // Remove duplicates.
  };

  // Handles CSV file import
  const handleCSVImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Reset messages
    setCsvError("");
    setCsvSuccess("");
    setCsvImporting(true);

    try {
      // Validate file type.  
      if (!file.name.toLowerCase().endsWith(".csv")) {
        throw new Error("Alleen CSV-bestanden zijn toegestaan.");
      }

      // Validate file size (max 1MB)
      if (file.size > 1024 * 1024) {
        throw new Error("Bestand is te groot. Maximaal 1MB toegestaan.");
      }

      // Read file content
      const text = await file.text();

      if (!text.trim()) {
        throw new Error("Het CSV-bestand is leeg.");
      }

      //I have extracted here city names from CSV text
      const parsedCities = parseCSV(text);

      if (parsedCities.length === 0) {
        throw new Error("Geen geldige steden gevonden in het CSV-bestand.");
      }

      // Validate cities
      const { validCities, invalidCities } = validateCities(parsedCities);

      if (validCities.length === 0) {
        throw new Error(`Geen van de steden in het bestand zijn beschikbaar in Friesland. Beschikbare steden: ${availableCities.join(", ")}`);
      }

      // Check selection limit
      const citiesToAdd = validCities.filter((city) => !chosenCities.includes(city));
      const totalAfterImport = chosenCities.length + citiesToAdd.length;

      if (totalAfterImport > MAX_SELECTION) {
        const canAdd = MAX_SELECTION - chosenCities.length;
        if (canAdd <= 0) {
          throw new Error(`Je hebt al ${MAX_SELECTION} steden geselecteerd. Verwijder eerst enkele steden.`);
        } else {
          const confirmMessage = `Je kunt nog maar ${canAdd} steden toevoegen. Wil je de eerste ${canAdd} geldige steden uit het bestand importeren?`;
          if (window.confirm(confirmMessage)) {
            const limitedCities = citiesToAdd.slice(0, canAdd);
            setChosenCities((prev) => [...prev, ...limitedCities]);
            setCsvSuccess(`${limitedCities.length} steden geïmporteerd (beperkt door maximum van ${MAX_SELECTION}).`);
          }
        }
      } else {
        // Add all valid cities
        setChosenCities((prev) => [...prev, ...citiesToAdd]);

        // I have Shown here the success message with details
        let successMessage = `${citiesToAdd.length} nieuwe steden geïmporteerd.`;
        if (invalidCities.length > 0) {
          successMessage += ` ${invalidCities.length} steden werden overgeslagen (niet beschikbaar in Friesland): ${invalidCities.join(", ")}.`;
        }
        setCsvSuccess(successMessage);
      }
    } catch (error) {
      setCsvError(error.message);
    } finally {
      setCsvImporting(false);
      // I have Reseted here the file input
      event.target.value = "";
    }
  };

  // Downloads a CSV template with sample cities
  const downloadCSVTemplate = () => {
    const csvContent = "stad\n" + availableCities.slice(0, 5).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "steden_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Exports selected cities to CSV file
  const exportSelectedCities = () => {
    if (chosenCities.length === 0) {
      alert("Geen steden geselecteerd om te exporteren.");
      return;
    }

    const csvContent = "stad\n" + chosenCities.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "geselecteerde_steden.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handles form submission to save preferences.
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (saving || chosenCities.length === 0) {
      if (chosenCities.length === 0) alert("Selecteer minimaal één stad.");
      return;
    }

    setSaving(true);

    const updated = updatePreferences({ selectedCities: chosenCities });
    if (updated) {
      setTimeout(() => navigate("/results"), 300); // Navigate after short delay
    } else {
      alert("Fout bij opslaan van voorkeuren. Probeer opnieuw.");
      setSaving(false);
    }
  };

  // Filter cities based on search query
  const matchingCities = availableCities.filter((city) =>
    city.toLowerCase().includes(query.trim().toLowerCase())
  );

  // Show loading screen while preferences are loading
  if (isLoadingPrefs) {
    return <CityDataLoadingScreen message="Voorkeuren worden geladen..." />;
  }

  return (
    <div className="city-selection-container">
      <h2>Steden Selecteren</h2>
      <p className="city-selection-intro">
        Kies tot {MAX_SELECTION} steden in Friesland die je met elkaar wilt vergelijken.
      </p>

      {/* Search input for filtering cities */}
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Zoek stad..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* CSV Import/Export section.  */}
      <div className="csv-import-section">
        <h3>CSV Import/Export</h3>
        <div className="csv-actions">
          {/* I have made here CSV Import Button */}
          <div className="csv-import">
            <label htmlFor="csv-file" className="btn btn-secondary csv-import-btn">
              {csvImporting ? "Importeren..." : "📁 Importeer CSV"}
            </label>
            <input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleCSVImport}
              disabled={csvImporting}
              style={{ display: "none" }}
            />
          </div>

          {/* i have generated here the template Download Button */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={downloadCSVTemplate}
            disabled={csvImporting}
          >
            📄 Download Template
          </button>

          {/* you see here the export Button */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={exportSelectedCities}
            disabled={chosenCities.length === 0 || csvImporting}
          >
            💾 Exporteer Selectie
          </button>
        </div>

        {/* Error/Success messages for CSV operations */}
        {csvError && (
          <div className="csv-message csv-error">
            <span className="error-icon">❌</span>
            <span>{csvError}</span>
          </div>
        )}

        {csvSuccess && (
          <div className="csv-message csv-success">
            <span className="success-icon">✅</span>
            <span>{csvSuccess}</span>
          </div>
        )}

        {/* CSV format help text */}
        <div className="csv-help">
          <p>
            <strong>CSV Formaat:</strong> Een kolom met stadsnamen, optioneel met header "stad".
          </p>
          <p>
            <strong>Voorbeeld:</strong> Leeuwarden, Sneek, Drachten (elk op een nieuwe regel)
          </p>
        </div>
      </div>

      {/* Selected cities counter */}
      <div className="selected-count">
        {chosenCities.length} van {MAX_SELECTION} geselecteerd
      </div>

      {/* Main form with city selection grid */}
      <form onSubmit={handleFormSubmit}>
        <div className="cities-grid">
          {matchingCities.map((city) => (
            <div
              key={city}
              className={`city-card ${chosenCities.includes(city) ? "selected" : ""}`}
              onClick={() => toggleCitySelection(city)}
            >
              <div className="city-name">{city}</div>
              {chosenCities.includes(city) && <div className="selected-indicator">✓</div>}
            </div>
          ))}
        </div>

        {/* No results message */}
        {matchingCities.length === 0 && (
          <div className="no-results">Geen steden gevonden voor "{query}"</div>
        )}

        {/* Form submission button */}
        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving || chosenCities.length === 0}
          >
            {saving ? "Bezig..." : "Vergelijk Geselecteerde Steden"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CitySelection;

