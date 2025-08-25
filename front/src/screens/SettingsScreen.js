import React, { useState, useContext } from 'react';
import { 
  SafeAreaView, 
  ScrollView, 
  Text, 
  View, 
  TouchableOpacity, 
  Switch,
  StyleSheet,
  Modal,
  Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import mainStyles from '../styles/mainStyles';
import { ThemeContext } from '../context/themeContext';
import BottomNavBar from '../components/BottomNavBar';
import { useNavigation } from '@react-navigation/native';

// Configuration des couleurs unifiées avec support du thème amélioré
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

  switchTrackOn: isDark ? '#B48EED' : '#7A5CCC',
  switchTrackOff: isDark ? '#47476B' : '#D8BFD8',
  switchThumb: isDark ? '#FFFFFF' : '#FFFFFF',

  // Couleurs pour les modals
  modalOverlay: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)',
  modalBackground: isDark ? '#2F2F4A' : '#FFFFFF',
  modalBorder: isDark ? '#4A4A70' : '#E8DFFF',
});

// Modal ultra simple comme Alert
const SimpleAlert = ({ visible, onClose, title, message, isDarkMode }) => {
  const COLORS = getColors(isDarkMode);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <View style={{
          backgroundColor: COLORS.card,
          borderRadius: 8,
          padding: 16,
          minWidth: 280,
          maxWidth: 300,
        }}>
          <Text style={{ fontSize: 17, fontWeight: '600', color: COLORS.text, marginBottom: 8 }}>
            {title}
          </Text>
          <Text style={{ fontSize: 14, color: COLORS.secondaryText, marginBottom: 16, lineHeight: 20 }}>
            {message}
          </Text>
          <TouchableOpacity 
            onPress={onClose}
            style={{ alignSelf: 'flex-end', paddingVertical: 8, paddingHorizontal: 12 }}
          >
            <Text style={{ color: COLORS.primary, fontSize: 16, fontWeight: '500' }}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { theme, isDarkMode, toggleTheme } = useContext(ThemeContext);
  const [isFirebaseTesting, setIsFirebaseTesting] = useState(false);
  const [firebaseTestResult, setFirebaseTestResult] = useState('');

  // États pour les modals
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', content: '' });

  const COLORS = getColors(isDarkMode);

  const showModal = (title, content) => {
    setModalContent({ title, content });
    setModalVisible(true);
  };

  const handleDeveloperInfo = () => {
    showModal(
      'Informations Développeur',
      'Équipe de développement:\n\n👨‍💻 Rova Navalona - Développeur Full Stack\n👩‍💻 Hope Rakoto - Développeur Full Stack\n👨‍💻 Sarobidy Santatra - Développeur Full Stack\n\nTechnologies utilisées:\n• React Native\n• Expo\n• Firebase\n• Node.js\n\nContact: dev@readingapp.com'
    );
  };

  const handleAbout = () => {
    showModal(
      'À propos',
      'Application de lecture v1.0\n\nDéveloppée avec React Native, Express.js et Firebase pour la gestion des données\n\nUne application pensée pour : lire des textes, rechercher des définitions et générer automatiquement des résumés.\n\nOffrez-vous une expérience de lecture moderne, fluide et intuitive.'
    );
  };

  const handleHelp = () => {
    showModal(
      'Aide',
      'Guide d\'utilisation:\n\n📖 Lecture: Importez vos textes et profitez d\'une lecture optimisée avec des fonctionnalités avancées.\n\n🔍 Définitions: Sélectionnez un mot pour obtenir sa définition instantanément.\n\n📝 Résumés: Générez automatiquement des résumés intelligents de vos textes.\n\n⚙️ Paramètres: Personnalisez votre expérience selon vos préférences.\n\nPour plus d\'aide, contactez notre support technique.'
    );
  };

  // Créer les styles dynamiquement avec useMemo pour qu'ils se mettent à jour
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
    headerSpacer: {
      width: 44,
    },

    // ScrollView styles
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 100, // Space for bottom nav
    },

    // Section styles améliorés
    section: {
      marginBottom: 28,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: COLORS.text,
      marginBottom: 16,
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
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDarkMode ? 0.6 : 0.15,
      shadowRadius: 8,
      elevation: 6,
      overflow: 'hidden',
      borderWidth: isDarkMode ? 1.5 : 0,
      borderColor: COLORS.cardBorder,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      paddingVertical: 18,
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: COLORS.softAccent,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
      shadowColor: COLORS.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
    },
    settingTextContainer: {
      flex: 1,
    },
    settingTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: COLORS.text,
      marginBottom: 3,
    },
    settingDescription: {
      fontSize: 14,
      color: COLORS.secondaryText,
      lineHeight: 18,
    },
    separator: {
      height: 1,
      backgroundColor: COLORS.separator,
      marginLeft: 72,
      opacity: isDarkMode ? 0.6 : 1,
    },

    // Switch personnalisé
    switchContainer: {
      transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
    },

    // Test result styles
    testResultContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 18,
      paddingVertical: 14,
      backgroundColor: COLORS.lightGray,
      borderTopWidth: 1,
      borderTopColor: COLORS.separator,
    },
    testResultText: {
      fontSize: 14,
      marginLeft: 8,
      flex: 1,
      fontWeight: '500',
    },

    // Version styles améliorés
    versionContainer: {
      alignItems: 'center',
      marginTop: 20,
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
      fontSize: 16,
      color: COLORS.text,
      fontWeight: '600',
    },
    versionSubText: {
      fontSize: 13,
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
            <Text style={styles.headerTitle}>Paramètres</Text>
            <View style={styles.headerSpacer} />
          </LinearGradient>

          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Section Apparence */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🎨 Apparence</Text>
              
              <View style={styles.settingCard}>
                <View style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <View style={styles.iconContainer}>
                      <Ionicons 
                        name={isDarkMode ? "moon" : "sunny"} 
                        size={22} 
                        color={COLORS.primary} 
                      />
                    </View>
                    <View style={styles.settingTextContainer}>
                      <Text style={styles.settingTitle}>Mode Sombre</Text>
                      <Text style={styles.settingDescription}>
                        {isDarkMode ? 'Thème sombre activé 🌙' : 'Thème clair activé ☀️'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.switchContainer}>
                    <Switch
                      trackColor={{ 
                        false: COLORS.switchTrackOff, 
                        true: COLORS.switchTrackOn 
                      }}
                      thumbColor={COLORS.switchThumb}
                      ios_backgroundColor={COLORS.switchTrackOff}
                      onValueChange={toggleTheme}
                      value={isDarkMode}
                      style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.3,
                        shadowRadius: 4,
                        elevation: 3,
                      }}
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Section Application */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📱 Application</Text>
              
              <View style={styles.settingCard}>
                <TouchableOpacity style={styles.settingItem} onPress={handleAbout}>
                  <View style={styles.settingLeft}>
                    <View style={styles.iconContainer}>
                      <Ionicons name="information-circle-outline" size={22} color={COLORS.primary} />
                    </View>
                    <View style={styles.settingTextContainer}>
                      <Text style={styles.settingTitle}>À propos</Text>
                      <Text style={styles.settingDescription}>Version et informations</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={22} color={COLORS.secondaryText} />
                </TouchableOpacity>

                <View style={styles.separator} />

                <TouchableOpacity style={styles.settingItem} onPress={handleHelp}>
                  <View style={styles.settingLeft}>
                    <View style={styles.iconContainer}>
                      <Ionicons name="help-circle-outline" size={22} color={COLORS.primary} />
                    </View>
                    <View style={styles.settingTextContainer}>
                      <Text style={styles.settingTitle}>Aide</Text>
                      <Text style={styles.settingDescription}>Guide d'utilisation</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={22} color={COLORS.secondaryText} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Section Développeur */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>👨‍💻 Équipe de Développement</Text>
              
              <View style={styles.settingCard}>
                <TouchableOpacity style={styles.settingItem} onPress={handleDeveloperInfo}>
                  <View style={styles.settingLeft}>
                    <View style={styles.iconContainer}>
                      <Ionicons name="code-slash-outline" size={22} color={COLORS.primary} />
                    </View>
                    <View style={styles.settingTextContainer}>
                      <Text style={styles.settingTitle}>Informations Développeur</Text>
                      <Text style={styles.settingDescription}>Rova, Hope, Sarobidy</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={22} color={COLORS.secondaryText} />
                </TouchableOpacity>

                {firebaseTestResult ? (
                  <>
                    <View style={styles.separator} />
                    <View style={styles.testResultContainer}>
                      <Ionicons 
                        name={firebaseTestResult.includes('réussie') ? "checkmark-circle" : "close-circle"} 
                        size={18} 
                        color={firebaseTestResult.includes('réussie') ? COLORS.success : COLORS.danger} 
                      />
                      <Text style={[
                        styles.testResultText,
                        { color: firebaseTestResult.includes('réussie') ? COLORS.success : COLORS.danger }
                      ]}>
                        {firebaseTestResult}
                      </Text>
                    </View>
                  </>
                ) : null}
              </View>
            </View>

            {/* Version info */}
            <View style={styles.versionContainer}>
              <Text style={styles.versionText}>Version 1.0.0</Text>
              <Text style={styles.versionSubText}>Dernière mise à jour: Août 2025</Text>
            </View>
          </ScrollView>
        </View>

        <BottomNavBar activeScreen="Paramètres" onNavigate={navigation.navigate} />

        {/* Alert simple */}
        <SimpleAlert
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          title={modalContent.title}
          message={modalContent.content}
          isDarkMode={isDarkMode}
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

export default SettingsScreen;