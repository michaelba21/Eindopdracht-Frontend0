
// Base API URL for backend requests
const API_BASE = "https://frontend-educational-backend.herokuapp.com/api";
// Boolean switch used to determine whether the app operates with simulated data or communicates with the actual backend service
const USE_DEMO_MODE = true;
// API key for authentication
const API_KEY = import.meta.env.VITE_NOVI_API_KEY;

// Mock user data for demo mode
const DEMO_USERS = [
  {
    id: "mock-1",
    username: "Demo User",
    email: "demo@example.com",
    password: "demo123",
    roles: ["user"],
  },
  {
    id: "mock-2",
    username: "Test User",
    email: "test@example.com",
    password: "test123",
    roles: ["user"],
  },
];

// Cache configuration for different data types
//maxSize=100 = Maximum number of entries and Older entries are removed when the limit is reached
const CACHE_CONFIG = {
  weather: { ttl: 3600000, maxSize: 100 },      // TTL (Time-To-Live), 3600000 = 1 hour (in milliseconds).
  pollen: { ttl: 21600000, maxSize: 50 },       // 6 hours cache
  uv: { ttl: 7200000, maxSize: 50 },           
  userPrefs: { ttl: Infinity, maxSize: 1 }      // Persistent cache for user prefs
};

// User registration function
export const registerUser = async (email, username, password) => {
  if (USE_DEMO_MODE) {
    console.log("[DEMO] Simulating user registration...");

    
    await wait(1000);// Simulate network delay

    // with this code I have Checked if email already exists in demo users
    if (DEMO_USERS.some((user) => user.email === email)) {////
      throw new Error("Dit e-mailadres is al in gebruik.");
    }

    // Create new demo user
    const newUser = {
      id: `mock-${Date.now()}`,
      username,
      email,
      password,
      roles: ["user"],
    };

    // Add to demo users array
    DEMO_USERS.push(newUser);

    // Return mock auth response
    return {
      token: `mock-token-${Date.now()}`,
      user: {
        id: newUser.id,
        username,
        email,
        roles: newUser.roles,
      },
    };
  }

  // Real API registration flow
  try {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-Api-Key": API_KEY
      },
      body: JSON.stringify({
        email,
        username,
        password,
        role: ["user"],
      }),
    });

    // I have used parse response here to safely convert API data to JSON. 
    const data = await parseJSON(res);

    // Handle errors
    if (!res.ok) {
      if (data.message?.includes("already in use")) {
        throw new Error("Dit e-mailadres is al in gebruik.");
      }
      if (data.message?.includes("username")) {
        throw new Error("Deze gebruikersnaam is al in gebruik.");
      }
      throw new Error(data.message || "Registratie mislukt. Probeer het later opnieuw.");
    }

    // Automatically login after registration
    return await loginUser(email, password);
  } catch (error) {
    console.error("Registratiefout:", error);
    throw error;
  }
};

// User login function
export const loginUser = async (email, password) => {
  if (USE_DEMO_MODE) {
    console.log("[DEMO] Simulating login...");

    // Simulate network delay
    await wait(800);///800 milliseconds (0.8 seconds) 

    // Find matching demo user
    const user = DEMO_USERS.find((u) => u.email === email && u.password === password);

    // Fallback user if not found
    const fallback = {
      id: `mock-${Date.now()}`,
      username: email.split("@")[0] || "DemoUser",
      email,
      roles: ["user"],
    };

    // Return mock auth response
    return {
      token: `mock-token-${Date.now()}`,
      user: user || fallback,
    };
  }

  // Real API login flow
  try {
    const res = await fetch(`${API_BASE}/auth/signin`, {///// 
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-Api-Key": API_KEY
      },
      body: JSON.stringify({ username: email, password }),
    });

    const result = await parseJSON(res);

    // Handle errors
    if (!res.ok) {
      if (res.status === 401) {
        throw new Error("Onjuiste inloggegevens. Controleer je e-mail en wachtwoord.");
      }
      throw new Error(result.message || "Inloggen mislukt. Probeer het later opnieuw.");
    }

    // Return auth response
    return {
      token: result.accessToken,
      user: {
        id: result.id,
        username: result.username,
        email: result.email,
        roles: result.roles,
      },
    };
  } catch (error) {
    console.error("Login mislukt:", error);
    throw error;
  }
};

// Get user info function
 export const getUserInfo = async (token) => {  // require token for user info requests 
  if (USE_DEMO_MODE) {
    console.log("[DEMO] Fetching demo user info...");
    const userId = token.replace("mock-token-", "");// Extract user ID from mock token. 
    const user = DEMO_USERS.find((u) => u.id.includes(userId)) || DEMO_USERS[0];// Find matching demo user or use first one as fallback

    // Return demo user info
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      roles: user.roles,
    };
  }

  // Real API user info flow. 
  try {
    const res = await fetch(`${API_BASE}/user`, {
      method: "GET",
      headers: { 
        Authorization: `Bearer ${token}`,
        "X-Api-Key": API_KEY
      },
    });

    if (!res.ok) {
      throw new Error("Kon gebruikersgegevens niet ophalen");
    }

    return await res.json();
  } catch (error) {
    console.error("Gebruikersgegevens ophalen mislukt:", error);
    throw error;
  }
};

// Helper function to simulate delay
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));/// 

// Helper function to safely parse JSON responses
const parseJSON = async (response) => {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch (err) {
    console.warn("Ongeldige JSON response:", text);
    return {};
  }
};


const checkErrorRate = () => {
  const errorRate = calculateErrorRate(); 
  ///alert if API error rate exceeds 5% threshold 
  if (errorRate > 5) {
    console.error(`WARNING: API error rate is ${errorRate.toFixed(2)}%, exceeding 5% threshold`);//toFixed(2)=format error rates to 2 decimal places. 
  }
};

//to retry logic with exponential backoff (unimplemented). 
const retryFetch = async (url, options, retries = 3) => {
  for (let i = 1; i <= retries; i++) {
    try {
      // here I have implemented exponential backoff
      await new Promise(r => setTimeout(r, i * 1000));
    } catch (err) {
      if (i === retries) throw err;
    }
  }
}