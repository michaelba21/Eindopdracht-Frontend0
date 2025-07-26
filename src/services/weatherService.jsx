import storageManager from '../utils/storageManager';

// with blow code I have got OpenWeather API key from environment variables
const OPENWEATHER_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY_1 || process.env.VITE_OPENWEATHER_API_KEY_1;
// Base URL for OpenWeather API endpoints
const BASE_WEATHER_ENDPOINT = "https://api.openweathermap.org/data/2.5";

// I used here helper function to check API key availability
const hasWeatherApiKey = () => {
  const available = Boolean(OPENWEATHER_KEY);
  if (!available) console.warn("OpenWeather API key is missing.");
  return available;
};

// I illustrate here the main function to fetch current weather data for a city. 
export const retrieveWeatherData = async (cityName) => {
  try {
    console.log(`Fetching weather for ${cityName}`);
    console.log(`API key check: ${OPENWEATHER_KEY ? "Present" : "Missing"}`);

    // Fallback to simulated data if no API key
    if (!hasWeatherApiKey()) {
      console.warn("Missing key. Providing simulated weather data instead.");
      return simulateWeather(cityName);
    }

    // Here I made an  API request special for weather data
    const response = await fetch(`${BASE_WEATHER_ENDPOINT}/weather?q=${cityName},nl&units=metric&lang=nl&appid=${OPENWEATHER_KEY}`);

    // Handle API errors
    if (!response.ok) {
      const errDetails = await response.text();
      throw new Error(`Weather request failed [${response.status}]: ${errDetails || response.statusText}`);
    }

    // Parse successful response
    const data = await response.json();
    console.log("Weather data received:", data);

    // Cache the response
    try {
      storageManager.setItem(`weather_${cityName}`, JSON.stringify(data));
    } catch (cacheErr) {
      console.warn("Failed to cache weather data:", cacheErr);
    }

    return data;
  } catch (err) {
    console.error("Error fetching weather data:", err);

    // here I have Attempted to apply the cached data if available
    try {
      const cached = storageManager.getItem(`weather_${cityName}`);
      if (cached) {
        console.log("Loading cached weather info");
        return JSON.parse(cached);
      }
    } catch (cacheErr) {
      console.warn("Could not access weather cache:", cacheErr);
    }

    // Final fallback to simulated data
    console.log("Returning backup weather info");
    return simulateWeather(cityName);
  }
};

// Function to fetch UV index . 
export const retrieveUVIndex = async (lat, lon) => {
  try {
    console.log(`Fetching UV index for [${lat}, ${lon}]`);//template literals to dynamically insert latitude and longitude values into the UV index fetch log message.

    // Fallback to random value if no API key. 
    if (!hasWeatherApiKey()) {
      console.warn("API key not available. Using default UV value.");
      return { value: Math.floor(Math.random() * 8 + 1) };
    }

    // Heredown I have generated a API request which is special for UV data
    const response = await fetch(`${BASE_WEATHER_ENDPOINT}/uvi?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_KEY}`);

    // Handle API errors
    if (!response.ok) {
      const errMsg = await response.text();
      throw new Error(`UV index request failed [${response.status}]: ${errMsg || response.statusText}`);
    }

    // Here I attempted to return parsed response. parsed converting the raw data received from the API (usually a JSON string) into a JavaScript object that my code can easily work with
    const result = await response.json();
    console.log("UV index data:", result);
    return result;
  } catch (err) {
    console.error("UV index fetch error:", err);
    // Fallback to random UV value
    return { value: Math.floor(Math.random() * 8 + 1) };/// 
  }
};

// Fallback weather data generator
const simulateWeather = (cityLabel) => ({
  name: cityLabel,
  main: {
    temp: 18 + Math.random() * 10,  // Random temp between 18-28°C
    feels_like: 17 + Math.random() * 10,
    temp_min: 16 + Math.random() * 5,// Minimum temp variation within 5°C
    temp_max: 20 + Math.random() * 5,
    pressure: 1010 + Math.random() * 20,  // Pressure range of 20 hPa (1010–1030 hPa)
    humidity: 40 + Math.random() * 40,  // Humidity between 40–80% (range of 40%). 
  },
  weather: [
    {
      id: 800,  // special Weather condition code means clear weather
      main: "Clear",
      description: "heldere hemel",  
      icon: "01d",  // Clear sky day icon. 
    },
  ],
  wind: {
    speed: 1 + Math.random() * 10,  // 1-11 m/s wind speed
    deg: Math.random() * 360,  // Random wind direction.
  },
  clouds: {
    all: Math.floor(Math.random() * 100),  // Random cloud coverage
  },
  sys: {
    country: "NL",  // Here I used the Unix timestamps for sunrise/sunset and geographic coordinates (lat/lon) representing location NL
    sunrise: 1621123456,  // Fixed sample timestamps
    sunset: 1621178901,
  },
  coord: {
    lat: 53.2014,  // Default coordinates (Leeuwarden)
    lon: 5.7999,
  },
});

// Create aliases for external compatibility
export const fetchWeatherData = retrieveWeatherData;
export const fetchUVIndex = retrieveUVIndex;