import React, { createContext, useState } from 'react';

const lightTheme = {
  container: { backgroundColor: '#FFFFFF' },
  cardBackground: { backgroundColor: '#F8F9FA' },
  titleText: { color: '#2D2D2D' },
  text: { color: '#495057' },
  input: { 
    backgroundColor: '#FFFFFF', 
    borderColor: '#DEE2E6', 
    color: '#495057' 
  },
  inputPlaceholder: { color: '#6C757D' },
  linkText: { color: '#007BFF' },
  popupContainer: { backgroundColor: '#FFFFFF' },
  searchContainer: { backgroundColor: '#F8F9FA' },
  searchInput: { color: '#495057' },
  iconColor: { color: '#6C757D' },
  headerBorder: { borderBottomColor: '#DEE2E6' },
  primaryColor: '#6A4C93'
};

const darkTheme = {
  container: { backgroundColor: '#1A1A1A' },
  cardBackground: { backgroundColor: '#2D2D2D' },
  titleText: { color: '#FFFFFF' },
  text: { color: '#E9ECEF' },
  input: { 
    backgroundColor: '#343A40', 
    borderColor: '#495057', 
    color: '#FFFFFF' 
  },
  inputPlaceholder: { color: '#ADB5BD' },
  linkText: { color: '#17A2B8' },
  popupContainer: { backgroundColor: '#2D2D2D' },
  searchContainer: { backgroundColor: '#343A40' },
  searchInput: { color: '#FFFFFF' },
  iconColor: { color: '#ADB5BD' },
  headerBorder: { borderBottomColor: '#495057' },
  primaryColor: '#9B7EDE'
};

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const theme = isDarkMode ? darkTheme : lightTheme;

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};