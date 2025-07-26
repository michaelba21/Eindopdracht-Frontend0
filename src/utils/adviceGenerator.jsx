
// Main entry point that generates a comprehensive advice object based on current conditions
export const createHealthTips = (
  weather, 
  pollen,  
  preferences,
  isExtreme = false, //default value of isExtreme parameter to false to indicate normal conditions when not specified.
  uv = null, 
  air = null // default to null
) => {
  return {
    // Build general advice based on all factors
    general: makeGeneralAdvice(weather, pollen, isExtreme, uv, air),
   
    medication: makeMedicationAdvice(pollen, preferences),
  
    activities: makeActivityAdvice(weather, pollen, isExtreme, uv),
   
    diet: makeDietAdvice(pollen),
  };
};

// Generates general lifestyle advice based on environmental conditions
function makeGeneralAdvice(weather, pollen, isExtreme, uv, air) {
  let msg = ""; // Message string that will contain all advice
  
  // Extract key weather values from the weather object
  const temp = weather.main.temp;
  const humidity = weather.main.humidity;
  const wind = weather.wind.speed * 3.6; // Convert m/s to km/h. 
  const sky = weather.weather[0].main.toLowerCase(); 
  const pollenMax = Math.max(pollen.grass, pollen.tree, pollen.weed); // Here I have shown the highest pollen level

  // Special case: extreme weather conditions
  if (isExtreme) {
    msg += "Let op: Door extreem weer is het verstandig binnen te blijven. Sterke wind verspreidt pollen extra snel. ";
  } else {
    // Weather-based advice. 
    if (sky.includes("rain")) {
      msg += "Regen helpt pollen uit de lucht te halen. ";
    } else if (sky.includes("clear") || sky.includes("sun")) {
      msg += "Als de zon schijnt, nou ja, dan vliegen die pollen echt overal ";
    }
    
    // Wind-related advice
    if (wind > 50) {
      msg += "Bij harde wind komen pollen verder. Houd ramen en deuren dicht. ";
    } else if (wind < 10) {
      msg += "Niet veel wind? Dan blijft dat pollen lekker hangen, hoor. ";
    }
    
    // Humidity advice
    if (humidity > 80) {
      msg += "Hoge luchtvochtigheid zorgt dat pollen sneller neerslaan. ";
    } else if (humidity < 40) {
      msg += "Droge lucht kan je luchtwegen extra prikkelen. Drink voldoende water. ";
    }
  }
  
  // UV-related advice.  
  if (uv !== null) {
    if (uv >= 8) {
      msg += "De zonkracht is te veel. Bescherm je huid en ogen goed. ";
    } else if (uv >= 6) {
      msg += "Hoge UV-waarde. Draag een zonnebril buiten. ";
    }
  }
  
  // Air quality advice
  if (air !== null) {
    if (air.AQI > 150) {
      msg += "De luchtkwaliteit is slecht. Blijf indien mogelijk binnen. ";
    } else if (air.AQI > 100) {
      msg += "De lucht is matig. Wees voorzichtig met buitenactiviteiten. ";
    } else if (air.AQI <= 50) {
      msg += "De lucht is schoon, wat gunstig is voor hooikoorts. ";
    }
  }
  
  // Pollen level advice. 
  if (pollenMax > 3.5) {
    msg += "Bij gek weer? Blijf lekker binnen, zeker 's ochtends, want dan zweven die pollen het fanatiekst rond.";
  } else if (pollenMax > 2) {
    msg += "trouwens, want dan zweven die pollen het meest rond. Niet dat het meteen een ramp is—het is “matig”, zeggen ze—maar alsnog, liever geen ellende toch? Hou je klachten gewoon een beetje in de gaten en grijp in als je begint te snotteren of jeukende ogen krijgt ";
  } else {
    msg += "Weinig pollen: ideaal voor buitenactiviteiten. ";
  }
  
  return msg.trim(); // Return final advice with no leading/trailing spaces
}

// Creates personalized medication advice based on pollen levels and user sensitivity
function makeMedicationAdvice(pollen, preferences) {
  const pollenMax = Math.max(pollen.grass, pollen.tree, pollen.weed); // Highest pollen level
  // Get user's sensitivity settings or use defaults
  const sens = preferences?.pollenSensitivity || { grass: 3, tree: 3, weed: 3 };// nr.3 is defaults option 
  const sensMax = Math.max(sens.grass, sens.tree, sens.weed); // Highest sensitivity setting
  const tips = []; // Array to store medication tips
  
  // General recommendation about consulting a doctor.
  tips.push("Serieus, overleg gewoon even met je arts voordat je aan de pillen gaat, oké? ");
  
  // Antihistamine recommendations
  if (pollenMax > 2.5 || sensMax > 3) {
    tips.push(" Maar als je echt helemaal gek wordt van die ellendige pollen, slik dan gewoon zo’n tabletje, cetirizine of loratadine bijvoorbeeld. Scheelt je echt een hoop gezeur, geloof me.");
  } else {
    tips.push("Bij lichte klachten is een niet-sufmakende antihistamine vaak voldoende.");
  }
  
  // Nasal spray recommendations. soure info:"https://rhinohorn.nl/veelgestelde-vragen/helpt-neusspoelen-bij-hooikoorts/"
  if (pollenMax > 3.5 || sensMax > 4) {
    tips.push("Een neusspray met corticosteroïden? Die doet z’n werk echt goed als je neus helemaal overhoop ligt.");
  } else if (pollenMax > 1.5) {
    tips.push("Zoutoplossing? Tja, die spoelt die pollen gewoon uit je neus—beetje alsof je je holtes even doorspoelt onder de douche");////
  }
  
  // Eye drop recommendations when both pollen levels exceed 2.5 and user sensitivity is above 2 for any pollen type.

  if (
    (pollen.grass > 2.5 && sens.grass > 2) ||
    (pollen.tree > 2.5 && sens.tree > 2) ||
    (pollen.weed > 2.5 && sens.weed > 2)
  ) {
    tips.push("Antihistamine oogdruppels kunnen verlichting geven bij jeukende of rode ogen.");
  }
  
  // Proactive medication use
  if (pollenMax > 3) {
    tips.push("Neem je medicatie preventief in voor het beste effect.");
  }
  
  return tips; // Return array of medication tips
}

// Provides activity recommendations based on current conditions. 
function makeActivityAdvice(weather, pollen, isExtreme, uv) {
  
  const wind = weather.wind.speed * 3.6; // I have applied this to convert wind speed to km/h
  const sky = weather.weather[0].main.toLowerCase(); 
  const pollenMax = Math.max(pollen.grass, pollen.tree, pollen.weed); // Max pollen level
  const tips = []; 
  
  // Extreme weather advice. 
  if (isExtreme) {
    tips.push("Blijf binnen bij extreem weer. Pollen worden dan extra verspreid.");
    tips.push("Moet je toch naar buiten? En ja hoor, zonnebril op en desnoods een mondkapje erbij – het is geen fashion statement, maar je ogen en neus zullen je dankbaar zijn.");
    tips.push("En ja, hou die ramen en deuren dicht, hoe suf dat ook klinkt.");
    return tips;
  }
  
  // General activity advice
  tips.push("Plan buitenactiviteiten bij voorkeur in de middag of na regen.");
  
  // Pollen-specific activity advice. 
  if (pollenMax > 3.5) {
    tips.push("Sporten? Doe dat lekker binnen of ga zwemmen als het buiten vol pollen is, scheelt weer een snotbui.");
  } else if (sky.includes("rain")) {
    tips.push("Oh, en na een goeie regenbui kun je weer veilig naar buiten, want dan zijn die pollen een beetje weggespoeld.");
  }
  
  // UV protection advice. 
  if (uv !== null) {
    if (uv >= 8) {
      tips.push("En als de zon echt loeihard schijnt (die knetterende UV tussen 11 en 3), blijf lekker binnen. Niemand zit te wachten op een hoofd als een tomaat, toch?");
    } else if (uv >= 6) {
      tips.push("Gebruik zonnebrandcrème en ergens een schaduw naast je zoeken");
    }
  }
  
  // Wind-specific advice
  if (wind > 20) {
    tips.push("Vermijd open plekken bij harde wind, want pollen verspreiden dan verder.");
  }
  
  // Gras pollen advice
  if (pollen.grass > 2.5) {
    tips.push("Vermijd grasvelden, zeker als er net gemaaid is.");
  }
  
  // Tree pollen advice
  if (pollen.tree > 2.5) {
    tips.push("Oh ja, blijf vooral ver uit de buurt van die bloeiende bomen – het voorjaar is echt één grote pollenrave");
  }
  
  // General protective measures
  tips.push("En serieus, een zonnebril is geen overbodige luxe, gooi er desnoods zo’n mondkapje bij als de pollen echt tekeergaan.");///
  
  return tips; 
}

// Dietary recommendations based on pollen types
function makeDietAdvice(pollen) {
  const tips = []; // Array to store dietary advice
  
  // General hydration and anti-inflammatory food advice. 
  tips.push("Zorg dat je genoeg water naar binnen giet, anders drogen je slijmvliezen uit en geloof me, dat wil je niet.");
  tips.push("Gooi ook wat zalm, walnoten, olijfolie en een handje bessen op je bord—al die spul helpt tegen ontstekingen. Dus ja, skip die zak chips, pak wat gezonds.");
  
  // Grass pollen specific food advice. 
  if (pollen.grass > 2) {
    tips.push("Heb je hooikoorts? Dan kun je trouwens ook freaky gaan reageren op tomaat, meloen of citrus. Let een beetje op wat je eet en waar je last van krijgt.");
  }
  
  // Tree pollen specific food advice. 
  if (pollen.tree > 2) {
    tips.push("Boompollenallergie? Echt bizar eigenlijk, toch? Je bijt gewoon in zo’n onschuldig appeltje en bam—je lijf gaat compleet in de stress. Of je pakt een perzik en het feestje begint opnieuw. Supervervelend. Maar hey, beetje hoop: als je dat fruit eerst ff kookt, kun je ’t meestal gewoon eten zonder gezeik.");
  }
  
  // Weed pollen specific food advice
  if (pollen.weed > 2) {
    tips.push("En die onkruidpollen? Die zijn ook lekker lastig. Soms krijg je daar gedoe van als je selderij, wortels of zelfs bepaalde kruiden eet. Dus als je ineens jeuk ofzo krijgt na zo’n hap, wees een beetje scherp.");
  }
  
  // Probiotics recommendation
  tips.push("Probiotica trouwens, zoals yoghurt of zuurkool, kunnen je weerstand echt wel een zetje geven");
  
  return tips; // Return array of dietary advice
}


export const generateAdvice = createHealthTips;
