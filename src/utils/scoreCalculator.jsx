///in code below i have attempted to set default user preferences (e.g., temp, humidity, ...etc.) if 'prefs' is null or undefined
export function computeCityScore(weather, pollen, prefs, uv = null, air = null) {
  const userPrefs = prefs || {
    temperature: { min: 15, max: 25, weight: 3 },
    humidity: { min: 30, max: 60, weight: 2 },////
    wind: { min: 0, max: 20, weight: 4 },
    uvIndex: { min: 0, max: 5, weight: 2 },
    pollenSensitivity: { grass: 3, tree: 3, weed: 3 },
  };

  // Individual aspect scores
  const tempScore = tempSuitability(weather, userPrefs.temperature);
  const humidityScore = humiditySuitability(weather, userPrefs.humidity);
  const windScore = windSuitability(weather, userPrefs.wind);
  const pollenScore = pollenSuitability(pollen, userPrefs.pollenSensitivity);
  const uvScore = uv !== null && userPrefs.uvIndex ? uvSuitability(uv, userPrefs.uvIndex) : 0.5;
  const airScore = air !== null ? airQualitySuitability(air) : 0.5;///I have put the air quality score based on available data or default to neutral 0.5 if air data is missing 

  // I have set here a fixed and conditional weights for pollen, air quality, and UV. Then i have summed it with user preference weights to calculate total scoring weight
  const pollenWeight = 5;
  const airWeight = air !== null ? 2 : 0;
  const uvWeight = uv !== null ? userPrefs.uvIndex.weight : 0;
  const totalWeight =
    userPrefs.temperature.weight +
    userPrefs.humidity.weight +///// adds numeric weights to compute the total combined weight
    userPrefs.wind.weight +
    pollenWeight +
    uvWeight +
    airWeight;

  // Weighted sum
  const score =
    (tempScore * userPrefs.temperature.weight +
      humidityScore * userPrefs.humidity.weight +
      windScore * userPrefs.wind.weight +
      pollenScore * pollenWeight +
      uvScore * uvWeight +
      airScore * airWeight) /
    totalWeight;

  // Return as percentage
  return score * 100;
}


//// Here I have returned a suitability score for temperature based on user preferences: 1 if within range, decreasing gradually outside the range down to 0
function tempSuitability(weather, pref) {
  const t = weather.main.temp;
  if (t >= pref.min && t <= pref.max) return 1;// here I show a perfect score if temperature in range
  if (t < pref.min) return Math.max(0, 1 - (pref.min - t) / 10);
  return Math.max(0, 1 - (t - pref.max) / 10); // Here I demonstrate a score drops down gradually if temperature above max
}


// Humidity score is the best if within range, but outside range it drops off gradually
function humiditySuitability(weather, pref) {
  const h = weather.main.humidity;
  if (h >= pref.min && h <= pref.max) return 1;
  if (h < pref.min) return Math.max(0, 1 - (pref.min - h) / 50);// here I show score decreases gradually if below min
  return Math.max(0, 1 - (h - pref.max) / 50);// also score decreases gradually if above max
}

// Wind: best if within range, drops off outside range
function windSuitability(weather, pref) {
  const w = weather.wind.speed * 3.6;// I have attempted here to convert m/s to km/h
  if (w >= pref.min && w <= pref.max) return 1; // with this I illustrate a full score if wind speed in range
  if (w < pref.min) return Math.max(0, 1 - (pref.min - w) / 20);
  return Math.max(0, 1 - (w - pref.max) / 20);// score lowers gradually if above max
}

// Pollen: lower is better, weighted by user sensitivity
function pollenSuitability(pollen, sens) {
  const grass = Math.max(0, 1 - (pollen.grass * sens.grass) / 15);// grass pollen score adjusted by sensitivity
  const tree = Math.max(0, 1 - (pollen.tree * sens.tree) / 15);
  const weed = Math.max(0, 1 - (pollen.weed * sens.weed) / 15);
  const total = sens.grass + sens.tree + sens.weed;
  return (grass * sens.grass + tree * sens.tree + weed * sens.weed) / total;// I calculat here a weighted average pollen score
}

// UV: best if within range, drops off above
function uvSuitability(uv, pref) {
  if (uv >= pref.min && uv <= pref.max) return 1;// full score if UV within range
  if (uv < pref.min) return 0.8;
  return Math.max(0, 1 - (uv - pref.max) / 5);// score decreases gradually if UV above max
}

// Air quality: best if AQI is low
function airQualitySuitability(aqi) {
  if (aqi <= 50) return 1;
  if (aqi <= 100) return 0.8;
  if (aqi <= 150) return 0.6;
  if (aqi <= 200) return 0.4;
  if (aqi <= 300) return 0.2;// very poor air quality
  return 0;
}
