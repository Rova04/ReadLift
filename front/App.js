import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/context/themeContext';

// Importation des écrans
import { LoginScreen, SignUpScreen } from './src/screens/AuthScreens';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ResumeScreen from './src/screens/ResumeScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import LectureLivreScreen from './src/screens/LectureLivreScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator 
      initialRouteName="Login"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="Accueil" component={HomeScreen} />
      <Stack.Screen name="Profil" component={ProfileScreen} />
      <Stack.Screen name="Lecture" component={LectureLivreScreen} />
      <Stack.Screen name="Résumé" component={ResumeScreen} />
      <Stack.Screen name="Paramètres" component={SettingsScreen} />
    </Stack.Navigator>
  </NavigationContainer>
);

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppNavigator />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}