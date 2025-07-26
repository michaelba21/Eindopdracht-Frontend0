
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './register.css';

function SignUp() {
  // State initialization for form data using single object
  const [formData, setFormData] = useState({
    email: '',       // Stores user email
    username: '',    // this Stores chosen username
    password: ''     // also this Stores user password
  });

  // State for UI functionality
  const [error, setError] = useState('');      // this can store any error messages
  const [loading, setLoading] = useState(false); // This will Track any loading state
  const navigate = useNavigate();              // Hook for programmatic navigation

  // Unified input change handler for all form fields
  const handleChange = (e) => {
    const { name, value } = e.target;  // Extract field name and value
    setFormData(prev => ({
      ...prev,        // Spread previous state
      [name]: value   // this will Update only the changed field
    }));
  };

  // Client-side form validation function
  const validateForm = () => {
    // With below code I Checked for empty fields. 
    if (!formData.email || !formData.username || !formData.password) {
      setError('Alle velden zijn verplicht');
      return false;
    }

    // Basic email validation. 
    if (!formData.email.includes('@')) {
      setError('Voer een geldig emailadres in');
      return false;
    }

    // Username length validation. 
    if (formData.username.length < 3) {
      setError('Gebruikersnaam moet minimaal 3 tekens lang zijn');
      return false;
    }

    // I have created here a password length validation. 
    if (formData.password.length < 6) {
      setError('Wachtwoord moet minimaal 6 tekens lang zijn');
      return false;
    }

    return true;  // Return true if all validations pass
  };

  // Form submission handler. 
  async function handleSubmit(e) {
    e.preventDefault();  // Prevent default form behavior
    setError('');        // Clear previous errors
    
    // Validate form before submission. 
    if (!validateForm()) {
      return;
    }

    setLoading(true);  // this will Set load state

    try {
      // Debug log of form data
      console.log('Sending signup data:', formData);

      // API call to registration endpoint
      const response = await axios.post(
        'https://frontend-educational-backend.herokuapp.com/api/auth/signup',
        {
          email: formData.email,
          username: formData.username,
          password: formData.password,
        },
        {
          headers: {
            'Content-Type': 'application/json',  // Set content type
          },
          timeout: 10000,  // 10 second timeout
        }
      );

      console.log('Registration successful:', response.data);
      
      // I have Shown here the success message with username
      alert(`Registratie succesvol! Je kunt nu inloggen met gebruikersnaam: "${formData.username}"`);
      
      // i have made here the redirection into login page with username as URL parameter
      navigate(`/login?username=${encodeURIComponent(formData.username)}`);
      
    } catch (error) {
      console.error('Registration error:', error);
      
      // Comprehensive error handling
      if (error.response) {
        // Server responded with error status
        console.log('Error response:', error.response.data);
        console.log('Error status:', error.response.status);
        console.log('Error headers:', error.response.headers);
        
        // Error message extraction from various response formats
        let errorMessage = 'Er is een fout opgetreden.';
        
        if (error.response.data) {
          if (typeof error.response.data === 'string') {
            errorMessage = error.response.data;
          } else if (error.response.data.message) {
            errorMessage = error.response.data.message;
          } else if (error.response.data.error) {
            errorMessage = error.response.data.error;
          } else if (error.response.data.errors) {
            // Handle array of validation errors
            if (Array.isArray(error.response.data.errors)) {
              errorMessage = error.response.data.errors.join(', ');
            } else {
              errorMessage = JSON.stringify(error.response.data.errors);
            }
          }
        }
        
        // Status-specific error messages
        switch (error.response.status) {
          case 400:
            setError(`Ongeldige gegevens: ${errorMessage}`);
            break;
          case 409:
            setError('Dit account bestaat al. Probeer een ander emailadres of gebruikersnaam.');
            break;
          case 422:
            setError(`Gegevens voldoen niet aan de eisen: ${errorMessage}`);
            break;
          default:
            setError(`Fout ${error.response.status}: ${errorMessage}`);
        }
      } else if (error.request) {
        // Network error handling
        setError('Netwerkfout. Controleer je internetverbinding.');
      } else {
        // Generic error handling
        setError('Er is een onbekende fout opgetreden.');
      }
    } finally {
      setLoading(false);  // Reset loading state
    }
  }

  // Component render
  return (
    <div className="register-container">
      <div className="register-card">
        <h1>Registreren</h1>
        
        {/* I made here the registration form */}
        <form onSubmit={handleSubmit} className="register-form">
          {/* You see in below the email input field */}
          <div className="form-field">
            <label htmlFor="email-field">Emailadres:</label>
            <input
              type="email"
              id="email-field"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="voorbeeld@email.com"
            />
          </div>

          {/* I have created in below the username input field */}
          <div className="form-field">
            <label htmlFor="username-field">Gebruikersnaam:</label>
            <input
              type="text"
              id="username-field"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              disabled={loading}
              minLength="3"
              placeholder="Minimaal 3 tekens"
            />
          </div>

          {/* I have shown here the password input field */}
          <div className="form-field">
            <label htmlFor="password-field">Wachtwoord:</label>
            <input
              type="password"
              id="password-field"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              minLength="6"
              placeholder="Minimaal 6 tekens"
            />
          </div>
          
          {/* You see in below a error message display */}
          {error && <div className="error-message">{error}</div>}
          
          {/* I generated here a submit button with loading state */}
          <button
            type="submit"
            className="form-button"
            disabled={loading}
          >
            {loading ? 'Bezig met registreren...' : 'Registreren'}
          </button>
        </form>

        {/* I made a Link in below to sign-in page */}
        <div className="login-link">
          <p>Heb je al een account? Je kunt je <Link to="/login">hier</Link> inloggen.</p>
        </div>
      </div>
    </div>
  );
}

export default SignUp;