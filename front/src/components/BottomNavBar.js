import { useContext } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { ThemeContext } from '../context/themeContext'; 
import { Ionicons } from '@expo/vector-icons'; 

// Définition des couleurs inspirées du ReaderScreen pour la cohérence
const COLORS = {
  primary: '#7A5CCC',      
  primaryLight: '#9B7EDE', 
  softAccent: '#E8DFFF',   
  text: '#2D2D2D',         
  secondaryText: '#6B5B95',
  card: '#FFFFFF',         
  toolbarBg: '#FFFFFF',    
};

const BottomNavBar = ({ activeScreen, onNavigate }) => {
  const { theme } = useContext(ThemeContext);
  const isCurrent = (screen) => activeScreen === screen;

  return (
    <View style={[styles.navigationBar, theme.navigationBar]}>
      {/* Item Profil */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => onNavigate('Profil')}
      >
        <View style={isCurrent('Profil') ? styles.activeIconContainer : null}>
          {/* Icône Ionicons pour Profil */}
          <Ionicons 
            name={isCurrent('Profil') ? "person" : "person-outline"} 
            size={24} 
            // Couleur de l'icône : blanche si active, accent doux si inactive (sur fond primary)
            color={isCurrent('Profil') ? COLORS.card : COLORS.softAccent} 
            style={styles.navIcon}
          />
        </View>
        {/* Couleur du texte : blanche si active, accent doux si inactive */}
        <Text style={[styles.navText, isCurrent('Profil') ? { color: COLORS.card } : { color: COLORS.softAccent }]}>Profil</Text>
      </TouchableOpacity>

      {/* Item Accueil */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => onNavigate('Accueil')}
      >
        <View style={isCurrent('Accueil') ? styles.activeIconContainer : null}>
          {/* Icône Ionicons pour Accueil */}
          <Ionicons 
            name={isCurrent('Accueil') ? "home" : "home-outline"} 
            size={24} 
            // Couleur de l'icône : blanche si active, accent doux si inactive (sur fond primary)
            color={isCurrent('Accueil') ? COLORS.card : COLORS.softAccent} 
            style={styles.navIcon}
          />
        </View>
        {/* Couleur du texte : blanche si active, accent doux si inactive */}
        <Text style={[styles.navText, isCurrent('Accueil') ? { color: COLORS.card } : { color: COLORS.softAccent }]}>Accueil</Text>
      </TouchableOpacity>

      {/* Item Paramètres */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => onNavigate('Paramètres')}
      >
        <View style={isCurrent('Paramètres') ? styles.activeIconContainer : null}>
          {/* Icône Ionicons pour Paramètres */}
          <Ionicons 
            name={isCurrent('Paramètres') ? "settings" : "settings-outline"} 
            size={24} 
            // Couleur de l'icône : blanche si active, accent doux si inactive (sur fond primary)
            color={isCurrent('Paramètres') ? COLORS.card : COLORS.softAccent} 
            style={styles.navIcon}
          />
        </View>
        {/* Couleur du texte : blanche si active, accent doux si inactive */}
        <Text style={[styles.navText, isCurrent('Paramètres') ? { color: COLORS.card } : { color: COLORS.softAccent }]}>Paramètres</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  navigationBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 70,
    backgroundColor: COLORS.primary, // Couleur du background de la toolbar est maintenant la couleur primary
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    // Ombre douce inspirée du ReaderScreen
    shadowColor: COLORS.primaryLight, 
    shadowOffset: { width: 0, height: -4 }, 
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6, 
    paddingBottom: 5, 
  },
  navItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 5,
  },
  navIcon: {
    // La taille et la couleur sont gérées directement dans le composant Ionicons
    // marginBottom: 4, 
  },
  navText: {
    fontSize: 12,
    fontWeight: '600', 
    marginTop: 4, 
  },
  activeIconContainer: {
    backgroundColor: COLORS.softAccent, // Le fond de l'icône active reste l'accent doux
    padding: 8,
    borderRadius: 20, 
    marginBottom: 4, 
  },
});

export default BottomNavBar;
