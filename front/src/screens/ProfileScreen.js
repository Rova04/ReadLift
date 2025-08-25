import React, { useState, useContext, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Image,
  Modal,
  TouchableWithoutFeedback,
  TextInput,
  Alert,
  StyleSheet
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import mainStyles from '../styles/mainStyles';
import { ThemeContext } from '../context/themeContext';
import BottomNavBar from '../components/BottomNavBar';

const USERS_STORAGE_KEY = '@myApp:users';
const LOGGED_IN_USER_EMAIL_KEY = '@myApp:loggedInUserEmail';

// Configuration des couleurs unifiées avec support du thème (même logique que SettingsScreen)
const getColors = (isDark) => ({
  backgroundGradient: isDark ? ['#232344', '#1E1E3C'] : ['#F8F6FF', '#F0ECFF'],
  headerGradient: isDark ? ['#5C3FBF', '#7A5CCC'] : ['#7A5CCC', '#9B7EDE'],

  card: isDark ? '#2F2F4A' : '#FFFFFF',
  cardBorder: isDark ? '#4A4A70' : '#E8DFFF',

  primary: isDark ? '#B48EED' : '#7A5CCC',
  primaryLight: isDark ? '#C9A6F5' : '#9B7EDE',
  softAccent: isDark ? '#47476B' : '#E8DFFF',
  darkPurple: '#4B0082',

  text: isDark ? '#FFFFFF' : '#2D2D2D',
  secondaryText: isDark ? '#D0CFEA' : '#6B5B95',

  border: isDark ? '#5A5A80' : '#D8BFD8',
  separator: isDark ? '#47476B' : '#E8DFFF',

  lightGray: isDark ? '#35354D' : '#f9f9f9',
  success: '#4CAF50',
  warning: '#FF9800',
  danger: '#F44336',

  modalOverlay: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
});

// =========================
// Popup édition profil
// =========================
const EditProfilePopup = ({ isVisible, onClose, currentEmail, onSave, isDarkMode }) => {
  const COLORS = getColors(isDarkMode);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const handleSave = () => {
    if (newPassword && newPassword !== confirmNewPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }
    onSave(currentEmail, newPassword);
    onClose();
    setNewPassword('');
    setConfirmNewPassword('');
  };

  if (!isVisible) return null;

  // Styles dynamiques pour le popup
  const popupStyles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: COLORS.modalOverlay,
      justifyContent: 'center',
      alignItems: 'center',
    },
    editProfilePopupContainer: {
      backgroundColor: COLORS.card,
      borderRadius: 14,
      padding: 22,
      width: '90%',
      maxWidth: 400,
      shadowColor: isDarkMode ? '#000' : COLORS.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDarkMode ? 0.7 : 0.15,
      shadowRadius: 12,
      elevation: 8,
      borderWidth: isDarkMode ? 1 : 0,
      borderColor: COLORS.cardBorder,
    },
    popupHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
    },
    popupTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: COLORS.text,
      flex: 1,
    },
    closeButton: {
      padding: 4,
    },
    popupContent: {
      marginTop: 5,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.softAccent,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginBottom: 10,
      borderWidth: isDarkMode ? 1 : 0,
      borderColor: COLORS.border,
    },
    inputIcon: {
      marginRight: 8,
    },
    popupInput: {
      flex: 1,
      fontSize: 14,
      color: COLORS.text,
      paddingVertical: 6,
    },
    popupButtons: {
      flexDirection: 'row',
      marginTop: 6,
      gap: 8,
    },
    saveButton: {
      flex: 1,
      backgroundColor: COLORS.primary,
      paddingVertical: 8,
      borderRadius: 8,
      alignItems: 'center',
    },
    saveButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '500',
    },
    cancelButton: {
      flex: 1,
      backgroundColor: COLORS.softAccent,
      paddingVertical: 8,
      borderRadius: 8,
      alignItems: 'center',
      borderWidth: isDarkMode ? 1 : 0,
      borderColor: COLORS.border,
    },
    cancelButtonText: {
      color: COLORS.primary,
      fontSize: 14,
      fontWeight: '500',
    },
  });

  return (
    <Modal transparent animationType="fade" visible={isVisible} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={popupStyles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={popupStyles.editProfilePopupContainer}>
              <View style={popupStyles.popupHeader}>
                <Text style={popupStyles.popupTitle}>Changer le mot de passe</Text>
                <TouchableOpacity onPress={onClose} style={popupStyles.closeButton}>
                  <Ionicons name="close" size={24} color={COLORS.secondaryText} />
                </TouchableOpacity>
              </View>

              <View style={popupStyles.popupContent}>
                <View style={popupStyles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color={COLORS.primary} style={popupStyles.inputIcon} />
                  <TextInput
                    style={popupStyles.popupInput}
                    placeholder="Nouveau mot de passe"
                    placeholderTextColor={COLORS.secondaryText}
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                </View>

                <View style={popupStyles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color={COLORS.primary} style={popupStyles.inputIcon} />
                  <TextInput
                    style={popupStyles.popupInput}
                    placeholder="Confirmer le mot de passe"
                    placeholderTextColor={COLORS.secondaryText}
                    secureTextEntry
                    value={confirmNewPassword}
                    onChangeText={setConfirmNewPassword}
                  />
                </View>

                <View style={popupStyles.popupButtons}>
                  <TouchableOpacity style={popupStyles.cancelButton} onPress={onClose}>
                    <Text style={popupStyles.cancelButtonText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={popupStyles.saveButton} onPress={handleSave}>
                    <Text style={popupStyles.saveButtonText}>Enregistrer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default function ProfileScreen() {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const navigation = useNavigation();
  const [loggedInUserEmail, setLoggedInUserEmail] = useState('');
  const [userNameDisplay, setUserNameDisplay] = useState('Chargement...');
  const [profileImageUri, setProfileImageUri] = useState('https://www.w3schools.com/howto/img_avatar.png');
  const [isEditPopupVisible, setIsEditPopupVisible] = useState(false);
  const [isLogoutVisible, setIsLogoutVisible] = useState(false);

  // Utilisation des couleurs dynamiques
  const COLORS = getColors(isDarkMode);

  // Chargement des infos utilisateur
  useEffect(() => {
    const fetchUserEmail = async () => {
      const email = await AsyncStorage.getItem(LOGGED_IN_USER_EMAIL_KEY);
      if (email) {
        setLoggedInUserEmail(email);
        setUserNameDisplay(email.split('@')[0]);
      } else {
        setUserNameDisplay('Invité');
        console.warn('Aucun utilisateur connecté trouvé.');
      }
    };
    fetchUserEmail();
  }, []);

  const loadUsers = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(USERS_STORAGE_KEY);
      return jsonValue ? JSON.parse(jsonValue) : [];
    } catch (e) {
      console.error("Erreur de lecture des utilisateurs:", e);
      return [];
    }
  };

  const saveUsers = async (users) => {
    try {
      await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.error("Erreur d'écriture des utilisateurs:", e);
    }
  };

  const handleLogout = async () => {
    setIsLogoutVisible(true);
  };

  const handleSaveProfile = async (emailToUpdate, newPassword) => {
    if (!emailToUpdate) {
      Alert.alert('Erreur', 'Impossible d\'identifier l\'utilisateur.');
      return;
    }
    const users = await loadUsers();
    const userIndex = users.findIndex(u => u.email === emailToUpdate);
    if (userIndex > -1) {
      if (newPassword) {
        users[userIndex].password = newPassword;
        Alert.alert('Succès', 'Mot de passe mis à jour !');
      }
      await saveUsers(users);
    } else {
      Alert.alert('Erreur', 'Utilisateur non trouvé.');
    }
  };

  const handleChangeProfilePicture = () => {
    Alert.alert(
      'Changer la photo de profil',
      'Choisissez une option',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Caméra', onPress: () => Alert.alert('Info', 'Fonctionnalité à venir...') },
        { text: 'Galerie', onPress: () => Alert.alert('Info', 'Fonctionnalité à venir...') },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Vider le cache',
      'Cette action supprimera tous les données temporaires.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Vider', style: 'destructive', onPress: () => Alert.alert('Cache', 'Cache vidé avec succès!') }
      ]
    );
  };

  // Styles dynamiques avec useMemo
  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
    },
    content: {
      flex: 1,
    },
    
    // Header styles améliorés
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 16,
      paddingTop: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.5 : 0.1,
      shadowRadius: 4,
      elevation: 5,
    },
    backButton: {
      padding: 8,
      borderRadius: 12,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      minWidth: 44,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#FFFFFF',
      flex: 1,
      textAlign: 'center',
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 2,
    },
    editHeaderButton: {
      padding: 8,
      borderRadius: 12,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      minWidth: 44,
      justifyContent: 'center',
      alignItems: 'center',
    },

    // ScrollView styles
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 100,
    },

    // User card styles améliorés
    userCard: {
      backgroundColor: COLORS.card,
      borderRadius: 20,
      padding: 24,
      alignItems: 'center',
      marginBottom: 24,
      shadowColor: isDarkMode ? '#000' : COLORS.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDarkMode ? 0.6 : 0.15,
      shadowRadius: 8,
      elevation: 6,
      borderWidth: isDarkMode ? 1.5 : 0,
      borderColor: COLORS.cardBorder,
    },
    profileImageContainer: {
      position: 'relative',
      marginBottom: 16,
    },
    profileImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: COLORS.lightGray,
      borderWidth: 2,
      borderColor: isDarkMode ? '#B48EED' : '#7A5CCC',
    },
    changePictureButton: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: COLORS.softAccent,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: COLORS.card,
      shadowColor: COLORS.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
    },
    userName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: COLORS.text,
      marginBottom: 4,
      textShadowColor: isDarkMode ? 'rgba(0, 0, 0, 0.5)' : 'transparent',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 2,
    },
    userEmail: {
      fontSize: 16,
      color: COLORS.secondaryText,
    },

    // Section styles améliorés
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: COLORS.text,
      marginBottom: 12,
      marginLeft: 4,
      textShadowColor: isDarkMode ? 'rgba(0, 0, 0, 0.5)' : 'transparent',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 2,
    },

    // Setting card styles améliorés
    settingCard: {
      backgroundColor: COLORS.card,
      borderRadius: 16,
      shadowColor: isDarkMode ? '#000' : COLORS.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.6 : 0.1,
      shadowRadius: 4,
      elevation: 5,
      overflow: 'hidden',
      borderWidth: isDarkMode ? 1.5 : 0,
      borderColor: COLORS.cardBorder,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    iconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: COLORS.softAccent,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
      shadowColor: COLORS.primary,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    settingTextContainer: {
      flex: 1,
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: COLORS.text,
      marginBottom: 2,
    },
    settingDescription: {
      fontSize: 14,
      color: COLORS.secondaryText,
    },

    // Logout card styles améliorés
    logoutCard: {
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: COLORS.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.6 : 0.15,
      shadowRadius: 6,
      elevation: 5,
      borderWidth: isDarkMode ? 1.2 : 0,
      borderColor: COLORS.cardBorder,
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 12, // plus simple, pas besoin de "pill effect"
      backgroundColor: COLORS.primary,
    },
    logoutButtonText: {
      fontSize: 16, 
      fontWeight: '600',
      color: '#FFFFFF',
      marginLeft: 6,
    },

    // Version styles améliorés
    versionContainer: {
      alignItems: 'center',
      marginTop: 16,
      paddingVertical: 20,
      paddingHorizontal: 16,
      backgroundColor: COLORS.card,
      borderRadius: 12,
      marginHorizontal: 8,
      shadowColor: isDarkMode ? '#000' : COLORS.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.4 : 0.1,
      shadowRadius: 4,
      elevation: 3,
      borderWidth: isDarkMode ? 1 : 0,
      borderColor: COLORS.cardBorder,
    },
    versionText: {
      fontSize: 14,
      color: COLORS.text,
      fontWeight: '600',
    },
    versionSubText: {
      fontSize: 12,
      color: COLORS.secondaryText,
      marginTop: 4,
      opacity: 0.8,
    },
  }), [COLORS, isDarkMode]);

  return (
    <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Header avec gradient amélioré */}
          <LinearGradient colors={COLORS.headerGradient} style={styles.header}>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Accueil')} 
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Mon Profil</Text>
          </LinearGradient>

          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Carte utilisateur */}
            <View style={styles.userCard}>
              <View style={styles.profileImageContainer}>
                <Image source={{ uri: profileImageUri }} style={styles.profileImage} />
                <TouchableOpacity 
                  style={styles.changePictureButton} 
                  onPress={handleChangeProfilePicture}
                >
                  <Ionicons name="camera" size={16} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.userName}>{userNameDisplay}</Text>
              <Text style={styles.userEmail}>{loggedInUserEmail}</Text>
            </View>

            {/* Section Compte */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>👤 Compte</Text>
              
              <View style={styles.settingCard}>
                <TouchableOpacity 
                  style={styles.settingItem} 
                  onPress={() => setIsEditPopupVisible(true)}
                >
                  <View style={styles.settingLeft}>
                    <View style={styles.iconContainer}>
                      <Ionicons name="key-outline" size={20} color={COLORS.primary} />
                    </View>
                    <View style={styles.settingTextContainer}>
                      <Text style={styles.settingTitle}>Modifier le mot de passe</Text>
                      <Text style={styles.settingDescription}>Changer votre mot de passe</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.secondaryText} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Section Favoris */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⭐ Mes Favoris</Text>
              
              <View style={styles.settingCard}>
                <TouchableOpacity style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <View style={styles.iconContainer}>
                      <Ionicons name="heart-outline" size={20} color={COLORS.primary} />
                    </View>
                    <View style={styles.settingTextContainer}>
                      <Text style={styles.settingTitle}>Documents favoris</Text>
                      <Text style={styles.settingDescription}>Aucun favori pour l'instant</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.secondaryText} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Bouton de déconnexion */}
            <View style={styles.section}>
              <View style={styles.logoutCard}>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton} activeOpacity={0.7}>
                  <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.logoutButtonText}>Se déconnecter</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Modal de déconnexion */}
            <Modal transparent animationType="fade" visible={isLogoutVisible} onRequestClose={() => setIsLogoutVisible(false)}>
              <TouchableWithoutFeedback onPress={() => setIsLogoutVisible(false)}>
                <View style={{
                  flex: 1,
                  backgroundColor: COLORS.modalOverlay,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <TouchableWithoutFeedback>
                    <View style={{
                      backgroundColor: COLORS.card,
                      borderRadius: 16,
                      padding: 20,
                      width: '85%',
                      maxWidth: 350,
                      alignItems: 'center'
                    }}>
                      <Text style={{ fontSize: 17, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 }}>Déconnexion</Text>
                      <Text style={{ fontSize: 15, color: COLORS.secondaryText, marginBottom: 20 }}>
                        Êtes-vous sûr de vouloir vous déconnecter ?
                      </Text>

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', gap: 10 }}>
                        <TouchableOpacity 
                          onPress={() => setIsLogoutVisible(false)}
                          style={{
                            flex: 1,
                            paddingVertical: 10,
                            borderRadius: 10,
                            backgroundColor: COLORS.softAccent,
                            alignItems: 'center',
                            borderWidth: isDarkMode ? 1 : 0,
                            borderColor: COLORS.border
                          }}
                        >
                          <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Annuler</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          onPress={async () => {
                            await AsyncStorage.removeItem(LOGGED_IN_USER_EMAIL_KEY);
                            setIsLogoutVisible(false);
                            navigation.navigate('Login');
                          }}
                          style={{
                            flex: 1,
                            paddingVertical: 10,
                            borderRadius: 10,
                            backgroundColor: COLORS.primary,
                            alignItems: 'center'
                          }}
                        >
                          <Text style={{ color: '#FFF', fontWeight: '600' }}>Déconnecter</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                </View>
              </TouchableWithoutFeedback>
            </Modal>
            
          </ScrollView>
        </View>

        <BottomNavBar activeScreen="Profil" onNavigate={navigation.navigate} />

        <EditProfilePopup
          isVisible={isEditPopupVisible}
          onClose={() => setIsEditPopupVisible(false)}
          currentEmail={loggedInUserEmail}
          onSave={handleSaveProfile}
          isDarkMode={isDarkMode}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}