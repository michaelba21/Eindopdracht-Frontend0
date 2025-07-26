

// API configuration - using environment variables and proxy
const API_KEY = import.meta.env.VITE_AMBEE_API_KEY; // API key from environment variables.
// 1 hour in milliseconds (for caching responses). 
const CACHE_LIFETIME = 60 * 60 * 1000; 
const API_BASE_URL = '/proxy/'; // Proxy to avoid CORS issues 

// here i have used the Utility function to check if API is available
const apiAvailable = () => {
  const keyExists = Boolean(API_KEY);
  if (!keyExists) console.warn("Ambee API key is not set.");
  return keyExists;
};

// Delay utility for retries
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));/// 

// I have generated a mock pollen data based on city name and weather conditions to ensure they're defined before use
const createPollenMock = (city, weather) => {
  weather = weather || {};
  let values = {
    grass: 1 + Math.random(), // Random value between 1-2
    tree: 0.5 + Math.random() * 0.5, // Random value between 0.5-1.0. 
    weed: 0.2 + Math.random() * 0.4, // Random value between 0.2-0.6
  };

  // I have adjusted the values based on weather conditions
  const conditions = weather?.weather?.[0]?.main?.toLowerCase() || "";
  const temp = weather.main?.temp || 20;
  const wind = weather.wind?.speed || 0;
  const humidity = weather.main?.humidity || 50;///I got here the relative humidity (%) and defaults to 50% (neutral) if main or humidity is missing 

  // i have adjusted pollen levels based on weather conditions
  if (conditions.includes("clear")) {
    values.grass *= 1.6;//// Increase grass pollen by 60%. 
    values.tree *= 1.4;
  }

  if (conditions.includes("rain")) {
    values.grass *= 0.3;
    values.tree *= 0.4;/// Reduce tree pollen to 40% and reduces it to 40% because multiplying by 0.4 shrinks it to 40%
    values.weed *= 0.3;
  }

  if (temp > 21) {
    const scale = 1 + (temp - 20) * 0.025;/// Scale increases by 2.5% for every degree above 20°C
    values.grass *= scale;
    values.tree *= scale;
    values.weed *= scale;//Adjust weed pollen level dynamically by scaling it based on temperature conditions.
  }
///here I adjusted grass pollen mock levels: increase by 15% if wind is low (<2m/s) and by 10% if humidity is low (<45%).
  if (wind < 2) {
    values.grass *= 1.15;
  }

  if (humidity < 45) {
    values.grass *= 1.1;
  }

  // I used a clamp function here to round pollen levels to one decimal with a max of 4 and classify them into low, moderate, or high risk.

  const clamp = (v) => Math.min(Math.round(v * 10) / 10, 4);
  const classify = (v) => (v >= 3 ? "high" : v >= 1.5 ? "moderate" : "low");

  // Create the final mock data object
  const mockData = {
    grass: clamp(values.grass),
    tree: clamp(values.tree),
    weed: clamp(values.weed),
    risk: {
      grass_pollen: classify(values.grass),
      tree_pollen: classify(values.tree),
      weed_pollen: classify(values.weed),
    },
  };

  console.log(`Mock pollen for ${city}:`, mockData);
  return mockData;
};

// Generate mock air quality data
const createMockAirData = () => {
  const data = {
    AQI: Math.round(30 + Math.random() * 20), // Random AQI between 30-50
    PM10: Math.round(15 + Math.random() * 10), // Random PM10 between 15-25. 
    PM25: Math.round(10 + Math.random() * 6), // Random PM2.5 between 10-16
  };
  console.log("Generated mock AQI:", data);
  return data;
};

// Fetch with retry logic for API calls
const fetchWithRetries = async (endpoint, opts = {}, maxAttempts = 3) => {
  const url = API_BASE_URL + endpoint; // Construct full URL
  
  // Set up request headers
  const headers = {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json',
    ...opts.headers
  };

  // here I have Attempted to generate request multiple times if needed
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Attempt ${attempt}: Fetching ${url}`);
      const response = await fetch(url, { ...opts, headers });

      // Check for HTML response instead of JSON to detect unexpected HTML responses from API and throw error instead of attempting JSON parsing
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        const text = await response.text();
        console.error('HTML response received:', text.slice(0, 200));
        throw new Error('API returned HTML instead of JSON');
      } 

      // Handle rate limiting
      if (response.status === 429) {
        const wait = response.headers.get("Retry-After") || attempt * 2;
        console.warn(`Rate limited. Retrying in ${wait}s...`);
        await delay(wait * 1000);
        continue;
      }

      // Handle non-success status codes
      if (!response.ok) {
        let errorMsg = `${response.status} ${response.statusText}`;
        try {
          const json = await response.json();
          errorMsg = json.message || JSON.stringify(json);
        } catch (e) {
          const text = await response.text();
          errorMsg += ` - ${text.slice(0, 100)}`;
        }
        throw new Error(errorMsg);
      }

      // Return parsed JSON on success
      return await response.json();
    } catch (error) {
      console.warn(`Attempt ${attempt} failed:`, error.message);
      if (attempt === maxAttempts) {
        console.error('Final attempt failed. Using fallback data.');
        throw error;
      }
      await delay(attempt * 1000); // Wait longer on each subsequent failure
    }
  }
};

// Coordinate lookup for known cities in Friesland region
const getCoordinates = (place) => {
  // Coordinates for various cities in Friesland. 
  const map = {
    Leeuwarden: { lat: 53.2014, lng: 5.7999 },
    Sneek: { lat: 53.0327, lng: 5.6559 },
    Drachten: { lat: 53.1108, lng: 6.0997 },
    Heerenveen: { lat: 52.9615, lng: 5.9208 },
    Harlingen: { lat: 53.1748, lng: 5.4218 },/// I have added here  latitude and longitude coordinates for Harlingen to map city locations accurately.The numbers are geographic coordinates for Harlingen in the Netherlands 
    Franeker: { lat: 53.1872, lng: 5.5414 },
    Bolsward: { lat: 53.0669, lng: 5.5319 },
    Dokkum: { lat: 53.3249, lng: 5.9976 },
    Joure: { lat: 52.9658, lng: 5.8019 },
    Lemmer: { lat: 52.8455, lng: 5.7114 },
    Wolvega: { lat: 52.8764, lng: 6.0036 },
    Gorredijk: { lat: 53.0056, lng: 6.0667 },
    Buitenpost: { lat: 53.2547, lng: 6.1453 },
    Kollum: { lat: 53.2786, lng: 6.1539 },
    Burgum: { lat: 53.1925, lng: 5.9917 },
    Grou: { lat: 53.0953, lng: 5.8333 },
    Akkrum: { lat: 53.0475, lng: 5.8431 },
    Workum: { lat: 52.9792, lng: 5.4481 },
    Makkum: { lat: 53.0561, lng: 5.4064 },
    Oosterwolde: { lat: 52.9917, lng: 6.2917 },
  };
  
  // Default to Leeuwarden if place not found
  return map[place] || map["Leeuwarden"];
};


// with code in below I got pollen levels for a specific city
export const getPollenLevels = async (cityName, weatherContext = null) => {
  const cacheKey = `pollen_${cityName}`;
  
  // Try to use cached data first
  try {
    const cache = localStorage.getItem(cacheKey);
    if (cache) {
      const { timestamp, data } = JSON.parse(cache);////
      if (Date.now() - timestamp < CACHE_LIFETIME) {
        console.log(`Using cached pollen for ${cityName}`);
        return data;
      }
    }
  } catch (err) {
    console.warn("Failed to parse pollen cache:", err);
  }

  // I have used here mock data just in case if API isn't available
  if (!apiAvailable()) {
    console.log("API key missing. Generating fallback pollen data.");
    const backupData = createPollenMock(cityName, weatherContext);
    localStorage.setItem(cacheKey, JSON.stringify({ data: backupData, timestamp: Date.now() }));
    return backupData;
  }

  // I made here the actual API calls when possible
  try {
    const { lat, lng } = getCoordinates(cityName);
    const endpoint = `latest/pollen/by-lat-lng?lat=${lat}&lng=${lng}`;
    
    const json = await fetchWithRetries(endpoint, {
      method: "GET"///  get request
    });

    // Format and cache successful response
    const result = json?.data?.[0];
    if (json.message === "success" && result) {
      const formatted = {
        grass: Number(result.grass_pollen || 0),
        tree: Number(result.tree_pollen || 0),////fallback of 0 for pollen values to handle missing or undefined API data safely
        weed: Number(result.weed_pollen || 0),
        risk: {
          grass_pollen: result.Risk?.grass_pollen || "low",
          //default "low" risk classification for pollen levels when no specific risk data is available.
          tree_pollen: result.Risk?.tree_pollen || "low",
          weed_pollen: result.Risk?.weed_pollen || "low",
        },
      };
      localStorage.setItem(cacheKey, JSON.stringify({ 
        data: formatted, 
        timestamp: Date.now() 
      }));
      return formatted;
    }

    // Throw error if response format is unexpected
    throw new Error(json?.message || "Unexpected pollen response format");
  } catch (err) {
    console.error("Failed to fetch pollen data:", err.message);
    const fallback = createPollenMock(cityName, weatherContext);
    localStorage.setItem(cacheKey, JSON.stringify({ 
      data: fallback, 
      timestamp: Date.now() 
    }));
    return fallback;
  }
};

// Get air quality stats for a specific city
export const getAirStats = async (city) => {
  const key = `air_${city}`;
  
  // Try to use cached data first
  try {
    const cache = localStorage.getItem(key);
    if (cache) {
      const { timestamp, data } = JSON.parse(cache);
      if (Date.now() - timestamp < CACHE_LIFETIME) {
        console.log(`Using cached air quality for ${city}`);
        return data;
      }
    }
  } catch (e) {
    console.warn("Air quality cache error:", e);
  }

  // I used here mock data if API isn't available
  if (!apiAvailable()) {
    console.warn("No API key. Returning mock AQI values.");
    const dummy = createMockAirData();
    localStorage.setItem(key, JSON.stringify({ data: dummy, timestamp: Date.now() }));
    return dummy;
  }

  // I generate actual API call when possible
  try {
    const { lat, lng } = getCoordinates(city);
    const endpoint = `latest/airquality/by-lat-lng?lat=${lat}&lng=${lng}`;
    
    const json = await fetchWithRetries(endpoint, {
      method: "GET"
    });

    // Format and cache successful response
    const record = json?.data?.[0];
    if (json.message === "success" && record) {
      const result = {
        AQI: Number(record.aqiInfo?.aqi || record.AQI || 0),
        PM10: Number(record.PM10 || 0),///PM10 and PM25 represent airborne particles of different sizes
        PM25: Number(record.PM25 || 0),
      };
      localStorage.setItem(key, JSON.stringify({ 
        data: result, 
        timestamp: Date.now() 
      }));
      return result;
    }

    // Throw error if response format is unexpected. 
    throw new Error(json?.message || "Air quality data missing");
  } catch (error) {
    console.error("AQI fetch error:", error.message);
    const mock = createMockAirData();
    localStorage.setItem(key, JSON.stringify({ 
      data: mock, 
      timestamp: Date.now() 
    }));
    return mock;
  }
};

// Export aliases for compatibility with other modules
export const fetchPollenData = getPollenLevels;

export const fetchAirQuality = async (city) => {
  const stats = await getAirStats(city);
  return { stations: [stats] };
};

console.log("Environmental service ready."); // Log when module is loaded
