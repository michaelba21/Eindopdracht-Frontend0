
import React, { useState,useEffect, useContext} from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import axios from 'axios';
import './login.css';

const SignIn = () => {
  // You see in below the State initialization for form inputs and UI states
  const [username, setUsername] = useState(''); 
  const [password, setPassword] = useState(''); 
  const [loading, setLoading] = useState(false); 
  const [error, setError] = useState(''); 
  const [successMessage, setSuccessMessage] = useState('');
  
  // Get URL search parameters
  const [searchParams] = useSearchParams();
  
  const { login } = useContext(AuthContext);

  // Effect to pre-fill username from URL parameter
  useEffect(() => {
    const usernameFromUrl = searchParams.get('username');
    if (usernameFromUrl) {
      setUsername(decodeURIComponent(usernameFromUrl));
      setSuccessMessage(`Welkom ${decodeURIComponent(usernameFromUrl)}! Je account is aangemaakt—nice! Gooi even je wachtwoord erin om in te loggen`);
    }
  }, [searchParams]);

  // I have showed here the main form submission handler with user input
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    
    // Basic form validation
    if (!username || !password) {
      setError(' you should fill out both username and password. Don’t slack off!');
      return;
    }
    
    // I have Set loading state here and clear previous errors
    setLoading(true);
    setError('');
    setSuccessMessage(''); // Clear success message when attempting login

    try {
      console.log('Attempting login with user credentials...');
      console.log('Username:', username);
      console.log('Password length:', password.length);
      
      // Try to login with user-provided credentials
      const response = await axios.post('https://frontend-educational-backend.herokuapp.com/api/auth/signin', {
        username: username,
        password: password,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Login successful:', response.data);

      // In below the token will be Extracted from response
      const token = response.data.accessToken || 
                   response.data.token || 
                   response.data.access_token || 
                   response.data.jwt ||
                   response.data.authToken;
      
      // I have Validated here the token existence
      if (!token) {
        console.error('No token in response:', response.data);
        throw new Error('No token received from server');
      }

      console.log('Token received:', token);
      
      // Call global login function with obtained token
      login(token);
      
    } catch (err) {
      console.error('Login failed:', err);
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  // I have generated the Centralize error handling function for authentication failures
  const handleAuthError = (err) => {
    if (err.response) {
      console.log('Final error response:', err.response.data);
      console.log('Final error status:', err.response.status);
      
     
      let errorMessage = 'Please try again';
      
      if (err.response.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        }
      }
      
      // i have showed here the Status-specific error messages with extracted message
      switch (err.response.status) {
        case 401:
          setError(`Nope, die inloggegevens kloppen niet. Weet je zeker dat je je GEBRUIKERSNAAM (dus niet je e-mail) en wachtwoord goed hebt ingevuld? Of misschien moet je je eerst registreren.`);
          break;
        case 400:
          setError(`Hmmm, er ging iets mis met je verzoek: ${errorMessage}. Check even of je gebruikersnaam en wachtwoord er netjes uitzien.`);
          break;
        case 404:
          setError(`Gebruiker niet gevonden: ${errorMessage}. Kijk of je de juiste gebruikersnaam hebt ingevuld, of maak anders eerst een account aan.`);
          break;
        case 500:
          setError(`server heeft er geen zin in vandaag: ${errorMessage}. Probeer het straks nog eens, misschien heeft je dan weer z’n dag.`);
          break;
        default:
          setError(`Login failed (${err.response.status}): ${errorMessage}`);
      }
    } else if (err.request) {
      // Network error handling
      setError('Internetproblemen? Lijkt erop dat je verbinding hapert. Check je wifi of mobiele data even.');
    } else {
      // Generic error handling
      setError('Login failed. Please try again.');
    }
  };

  // You see in below a render sign-in form UI
  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Inloggen</h1>
        <p>Log in om bij je account te komen.</p>
        
        {/* I created here the Success message for new registrations.  */}
        {successMessage && <div className="success-message">{successMessage}</div>}
        
        <div className="important-notice">
          <p>
            <strong>Belangrijk:</strong> Gebruik je <strong>gebruikersnaam</strong> om in te loggen, NIET je email adres!<br/>
            Als je je gebruikersnaam bent vergeten, registreer dan opnieuw.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          {/* I generated here the username input field */}
          <div className="form-field">
            <label htmlFor="username">Gebruikersnaam:</label>
            <input 
              type="text" 
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
              placeholder="Type graag je gebruikersnaam hier"
            />
          </div>
          
          {/* i have shown here the Password input field */}
          <div className="form-field">
            <label htmlFor="password">Wachtwoord:</label>
            <input 
              type="password" 
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="Voer graag hier even je wachtwoord in"
            />
          </div>
          
          {/* I displayed here Error message with styling */}
          {error && <div className="error-message">{error}</div>}
          
          {/* in below you see the submit button with loading state */}
          <button 
            type="submit"
            className="form-button"
            disabled={loading}
          >
            {loading ? 'Bezig met inloggen...' : 'Inloggen'}
          </button>
        </form>
        
        {/* I have generated here a Link to registration page */}
        <div className="register-link">
          <p>
            Nog geen account? <Link to="/register">Registreer hier</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;