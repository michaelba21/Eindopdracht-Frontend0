
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// here a root ReactDOM container will be generated and it assist to find the my HTML element with the id of "root"
// The React application here will be mounted 
const root = ReactDOM.createRoot(document.getElementById("root"));// it Render the application inside the root container as you see in code

root.render(
  // This is a wrapper that helps to catch potential problems in my API's
  <React.StrictMode>
    {/* the App associated with the root of the component tree in my Api's*/}
    <App />
  </React.StrictMode>
)
