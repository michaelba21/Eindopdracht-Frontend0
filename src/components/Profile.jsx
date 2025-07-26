// Profile component where users can view and edit their account information
import { useContext, useState, useEffect } from "react";///
import { AuthContext } from "../context/AuthContext.jsx"; 
import { ProfileLoadingScreen } from "./LoadingScreen.jsx"; 
import "./Profile.css"; 

const Profile = () => {
  const { user, updateUserProfile } = useContext(AuthContext); 
  // State for managing UI (user interface) behavior
  const [isEditing, setIsEditing] = useState(false); //  editing mode
  const [isSaving, setIsSaving] = useState(false); // saving changes
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    location: "",
    bio: ""
  }); // Form state for user input
  const [originalData, setOriginalData] = useState({}); 
  const [errors, setErrors] = useState({}); 

  //I have applied Load user data and it will be triggered when component mounts or user changes
  useEffect(() => {
    if (user) {
      const userData = {
        username: user.username || "",
        email: user.email || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        dateOfBirth: user.dateOfBirth || "",
        location: user.location || "",
        bio: user.bio || ""
      };
      setFormData(userData);
      setOriginalData(userData);
    }
  }, [user]);

  // Handle input change in form fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  // Validate form before submission
  const validateForm = () => {
    const newErrors = {};
    
    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = "Gebruikersnaam is verplicht";
    } else if (formData.username.length < 3) {
      newErrors.username = "Gebruikersnaam moet minimaal 3 karakters zijn";
    }
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "E-mailadres is verplicht";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Ongeldig e-mailadres";
    }
    
    // First name validation
    if (formData.firstName && formData.firstName.length < 2) {
      newErrors.firstName = "Voornaam moet minimaal 2 karakters zijn";
    }
    
    // Last name validation
    if (formData.lastName && formData.lastName.length < 2) {
      newErrors.lastName = "Achternaam moet minimaal 2 karakters zijn";
    }
    
    // Date of birth validation
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 13 || age > 120) {
        newErrors.dateOfBirth = "Ongeldige geboortedatum";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save button click
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }
    setIsSaving(true);
    try {
      await updateUserProfile(formData); // Update user profile via context
      setOriginalData(formData); 
      setIsEditing(false); // Exit editing mode
      alert("Profiel succesvol bijgewerkt!"); // Show success message
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Er is een fout opgetreden bij het bijwerken van je profiel. Probeer het opnieuw.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel button click to discard changes and exit editing mode
  const handleCancel = () => {
    setFormData(originalData); // Revert to original data
    setErrors({}); 
    setIsEditing(false); // Exit editing mode
  };

  // I used this code because it checks if there are unsaved changes by comparing current form data with original data
  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  // My intention of using below code is If no user is available, show then an error message
  if (!user) {
    return (
      <div className="profile-container">
        <div className="profile-error">
          <h2>Geen gebruiker gevonden</h2>
          <p>Je moet ingelogd zijn om je profiel te bekijken.</p>
        </div>
      </div>
    );
  }

  // Main render to display the user profile
  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>Mijn Profiel</h2>
        {/* Show edit button only when not editing */}
        {!isEditing && (
          <button 
            className="btn btn-secondary"
            onClick={() => setIsEditing(true)}
          >
            Bewerken
          </button>
        )}
      </div>
      
      <div className="profile-content">
     
        <div className="profile-section">
          <h3>Basisinformatie</h3>
          
          {/* Username field */}
          <div className="form-group">
            <label htmlFor="username">Gebruikersnaam *</label>
            {isEditing ? (
              <div>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={errors.username ? "error" : ""}
                />
                {errors.username && <span className="error-message">{errors.username}</span>}
              </div>
            ) : (
              <p className="profile-value">{formData.username || "Niet ingevuld"}</p>
            )}
          </div>
          
          {/* Email field */}
          <div className="form-group">
            <label htmlFor="email">E-mailadres *</label>
            {isEditing ? (
              <div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={errors.email ? "error" : ""}
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>
            ) : (
              <p className="profile-value">{formData.email || "Niet ingevuld"}</p>
            )}
          </div>
        </div>
        
        {/* Personal info section */}
        <div className="profile-section">
          <h3>Persoonlijke informatie</h3>
          
          {/* First name and last name row */}
          <div className="form-row">
         
            <div className="form-group">
              <label htmlFor="firstName">Voornaam</label>
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={errors.firstName ? "error" : ""}
                  />
                  {errors.firstName && <span className="error-message">{errors.firstName}</span>}
                </div>
              ) : (
                <p className="profile-value">{formData.firstName || "Niet ingevuld"}</p>
              )}
            </div>
            
            {/* Last name field */}
            <div className="form-group">
              <label htmlFor="lastName">Achternaam</label>
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={errors.lastName ? "error" : ""}
                  />
                  {errors.lastName && <span className="error-message">{errors.lastName}</span>}
                </div>
              ) : (
                <p className="profile-value">{formData.lastName || "Niet ingevuld"}</p>
              )}
            </div>
          </div>
          
          {/* Date of birth field */}
          <div className="form-group">
            <label htmlFor="dateOfBirth">Geboortedatum</label>
            {isEditing ? (
              <div>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className={errors.dateOfBirth&&"error"}
                />
                {errors.dateOfBirth && <span className="error-message">{errors.dateOfBirth}</span>}
              </div>
            ) : (
              <p className="profile-value">
                {formData.dateOfBirth ? 
                  new Date(formData.dateOfBirth).toLocaleDateString('nl-NL') : 
                  "Niet ingevuld"
                }
              </p>
            )}
          </div>
          
          {/* Location field */}
          <div className="form-group">
            <label htmlFor="location">Locatie</label>
            {isEditing ? (
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Bijv. Amsterdam, Nederland"
              />
            ) : (
              <p className="profile-value">{formData.location || "Niet ingevuld"}</p>
            )}
          </div>
          
          {/* Bio field */}
          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            {isEditing ? (
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows="4"
                placeholder="Vertel iets over jezelf..."
                maxLength="500"
              />
            ) : (
              <p className="profile-value bio-text">
                {formData.bio || "Geen bio toegevoegd"}
              </p>
            )}
            {isEditing && (
              <small className="char-count">
                {formData.bio.length}/500 karakters
              </small>
            )}
          </div>
        </div>
        
        {/* Action buttons shown only when editing */}
        {isEditing && (
          <div className="profile-actions">
            {/* Warning about unsaved changes */}
            {hasChanges && (
              <div className="unsaved-changes-notice">
                <span className="warning-icon">⚠️</span>
                <span>Je hebt niet-opgeslagen wijzigingen</span>
              </div>
            )}
            
            {/* Save and cancel buttons */}
            <div className="action-buttons">
              <button 
                className="btn btn-secondary"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Annuleren
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
              >
                {isSaving ? "Opslaan..." : "Opslaan"}
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Account information section */}
      <div className="profile-info">
        <h3>Account informatie</h3>
        <div className="account-details">
          <p><strong>Account ID:</strong> {user.id}</p>
          <p><strong>Lid sinds:</strong> {user.createdAt ? 
            new Date(user.createdAt).toLocaleDateString('nl-NL') : 
            "Onbekend"
          }</p>
          <p><strong>Laatste login:</strong> {user.lastLogin ? 
            new Date(user.lastLogin).toLocaleDateString('nl-NL') : 
            "Onbekend"
          }</p>
        </div>
      </div>
    </div>
  );
};

export default Profile; 
