import React, { useState } from 'react';
import { SafeAreaView, Text, TextInput, TouchableOpacity, View, Alert, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// AsyncStorage keys
const USERS_STORAGE_KEY = '@myApp:users';
const LOGGED_IN_USER_EMAIL_KEY = '@myApp:loggedInUserEmail';

export const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Erreur', 'Veuillez entrer votre email et mot de passe.');
    const jsonValue = await AsyncStorage.getItem(USERS_STORAGE_KEY);
    const users = jsonValue ? JSON.parse(jsonValue) : [];
    const user = users.find(u => u.email === email.trim() && u.password === password.trim());
    if (user) {
      await AsyncStorage.setItem(LOGGED_IN_USER_EMAIL_KEY, email.trim());
      navigation.navigate('Accueil');
    } else Alert.alert('Erreur', 'Email ou mot de passe incorrect.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.card}>
            <Text style={styles.logo}>ReadLift</Text>
            <Text style={styles.title}>Se connecter</Text>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
              placeholderTextColor="#999"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity style={styles.button} onPress={handleLogin}>
              <Text style={styles.buttonText}>Se connecter</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.link}>Pas encore de compte ? Créer un compte</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export const SignUpScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) return Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
    if (password !== confirmPassword) return Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
    const jsonValue = await AsyncStorage.getItem(USERS_STORAGE_KEY);
    const users = jsonValue ? JSON.parse(jsonValue) : [];
    if (users.some(u => u.email === email.trim())) return Alert.alert('Erreur', 'Cet email est déjà enregistré.');
    users.push({ email: email.trim(), password: password.trim() });
    await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    Alert.alert('Succès', 'Compte créé avec succès !');
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.card}>
            <Text style={styles.logo}>ReadLift</Text>
            <Text style={styles.title}>Créer un compte</Text>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
              placeholderTextColor="#999"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirmer le mot de passe"
              placeholderTextColor="#999"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity style={styles.button} onPress={handleSignUp}>
              <Text style={styles.buttonText}>Créer un compte</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>Déjà un compte ? Se connecter</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EDECF5' },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
    alignItems: 'center'
  },
  logo: { fontSize: 38, fontWeight: '800', color: '#7A5CCC', marginBottom: 12, letterSpacing: 2, textShadowColor: 'rgba(122,92,204,0.3)', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 4 },
  title: { fontSize: 24, fontWeight: '500', color: '#333', marginBottom: 20 },
  input: {
    width: '100%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#DDD',
    backgroundColor: '#F9F9F9'
  },
  button: {
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#9B6AD6',
    alignItems: 'center',
    marginTop: 10,
    width: '100%'
  },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  link: { marginTop: 15, fontSize: 14, textAlign: 'center', color: '#6A4C93', textDecorationLine: 'underline' },
});
