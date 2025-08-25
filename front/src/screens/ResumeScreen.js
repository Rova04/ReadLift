import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../context/themeContext';
import { LinearGradient } from 'expo-linear-gradient';

const getColors = (isDark) => ({
  backgroundGradient: isDark ? ['#232344', '#1E1E3C'] : ['#F8F6FF', '#F0ECFF'],
  card: isDark ? '#2F2F4A' : '#FFFFFF',
  cardBorder: isDark ? '#4A4A70' : '#E8DFFF',
  primary: isDark ? '#B48EED' : '#7A5CCC',
  primaryLight: isDark ? '#C9A6F5' : '#9B7EDE',
  text: isDark ? '#FFFFFF' : '#2D2D2D',
  secondaryText: isDark ? '#D0CFEA' : '#6B5B95',
  resumeBg: isDark ? '#2A2A44' : '#FFFFFF',
  resumeText: isDark ? '#E8E8E8' : '#2D2D2D',
  shadow: isDark ? '#000' : '#8B7CB8',
});

export default function ResumeScreen({ route, navigation }) {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const COLORS = getColors(isDarkMode);
  const { summary, title } = route.params;

  const [fontSize, setFontSize] = useState(16);

  const adjustFontSize = (increase) => {
    setFontSize((prev) => Math.min(24, Math.max(12, prev + (increase ? 2 : -2))));
  };

  const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 16,
      backgroundColor: COLORS.primary,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.cardBorder,
      shadowColor: COLORS.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.8 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    backButton: {
      padding: 4,
      marginRight: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: COLORS.secondaryText,
    },
    contentWrapper: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: COLORS.secondaryText,
      marginBottom: 16,
      textAlign: 'center',
    },
    scroll: {
      flex: 1,
      backgroundColor: COLORS.resumeBg,
      borderRadius: 16,
      padding: 20,
      shadowColor: COLORS.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.8 : 0.08,
      shadowRadius: 8,
      elevation: 3,
      borderWidth: isDarkMode ? 1 : 0,
      borderColor: COLORS.cardBorder,
    },
    scrollContent: { paddingBottom: 40 },
    text: {
      fontSize,
      lineHeight: 28,
      color: COLORS.resumeText,
      textAlign: 'justify',
    },
    fontControls: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginVertical: 12,
      gap: 12,
    },
    fontButton: {
      backgroundColor: COLORS.primaryLight,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    fontButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 16,
    },
  });

  return (
    <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={COLORS.secondaryText} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>📖 Résumé du livre</Text>
          </View>

          <View style={styles.contentWrapper}>
            <Text style={styles.title}>« {title} »</Text>

            <View style={styles.fontControls}>
              <TouchableOpacity style={styles.fontButton} onPress={() => adjustFontSize(false)}>
                <Text style={styles.fontButtonText}>A-</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.fontButton} onPress={() => adjustFontSize(true)}>
                <Text style={styles.fontButtonText}>A+</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
              indicatorStyle={isDarkMode ? 'white' : 'default'}
            >
              <Text style={styles.text}>{summary}</Text>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
