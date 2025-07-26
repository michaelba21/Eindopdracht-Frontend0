
import { useTheme } from '../context/ThemeContext'; 

// I have applied the themeToggle component here to provide a button to switch between light and dark themes
const ThemeToggle = () => {
  const { currentTheme, switchTheme } = useTheme(); // I have got here the current theme and toggle function from context

  return (
    <button
      className="theme-toggle" 
      onClick={switchTheme} // Call the toggle function when button is clicked
      aria-label={currentTheme === 'light' ? 'Schakel naar donkere modus' : 'Schakel naar lichte modus'} //Accessibility label based on current theme 
    >
      {/* I displayed here different emoji based on current theme */}
      {currentTheme === 'light' ? '🌙' : '☀️'}
    </button>
  );
};

export default ThemeToggle; 
