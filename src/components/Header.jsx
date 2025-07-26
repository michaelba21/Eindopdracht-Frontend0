import { useContext } from "react";
import { Link, useNavigate, NavLink } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import "./header.css";

const Header = () => {
  // Get authentication state and logout function from context
  const { isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate(); // Here I made a hook for programmatic navigation

  // Handle logout action
  const handleLogout = () => {
    logout(); // Call logout function from context.
    navigate("/login"); // I have applied here a redirect to login page after logout
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* here I have set the Logo linking to home page */}
        <Link to="/" className="logo">
          <h1>Hooikoorts Helper</h1>
        </Link>

        {/* I have shown here the main navigation */}
        <nav className="nav">
          {isAuthenticated ? (
            <>
              {/* In below I have generated different links (e.g.a link into Dashboard)*/}
              <NavLink 
                to="/dashboard"
                className={({ isActive }) => `nav-link ${isActive && "active"}`}
              >
                Dashboard
              </NavLink>

              {/* I have demonstrated here the preferences link */}
              <NavLink
                to="/preferences"
                className={({ isActive }) => `nav-link ${isActive && "active"}`}
              >
                Voorkeuren
              </NavLink>

              {/* I have shown in below the City selection link */}
              <NavLink
                to="/city-selection"
                className={({ isActive }) => `nav-link ${isActive && "active"}`}
              >
                Steden
              </NavLink>

              {/* I have generated in below the results link */}
              <NavLink
                to="/results"
                className={({ isActive }) => `nav-link ${isActive && "active"}`}
              >
                Resultaten
              </NavLink>

              {/* Profile link */}
              <NavLink
                to="/profile"
                className={({ isActive }) => `nav-link ${isActive && "active"}`}
              >
                Profiel
              </NavLink>

              {/* Help link */}
              <NavLink
                to="/help"
                className={({ isActive }) => `nav-link ${isActive && "active"}`}
              >
                Help
              </NavLink>

              {/* Logout button */}
              <button onClick={handleLogout} className="nav-link logout-btn">
                Uitloggen
              </button>
            </>
          ) : (
            /* Unauthenticated user navigation */
            <>
              {/* Login link */}
              <NavLink
                to="/login"
                className={({ isActive }) => `nav-link ${isActive && "active"}`}
              >
                Inloggen
              </NavLink>

              {/* Register link */}
              <NavLink
                to="/register"
                className={({ isActive }) => `nav-link ${isActive && "active"}`}
              >
                Registreren
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
