import React from "react";
// i made this code to import the createRoot method specifically from react-dom/client (modern React 18)
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

// Find the root element in the HTML
const container = document.getElementById("root");
// i use this code to make a React root container with using the new React 18 API and toReactDOM.render() from previous versions 
const root = createRoot(container);

// i made this code in below to Render the main application within React's strict mode
root.render(
  <React.StrictMode>
      {/* The App component here can help as the root component of my API's */}
    {/* All other components are children of this App component in my opnion */}
    <App />
  </React.StrictMode>
);
