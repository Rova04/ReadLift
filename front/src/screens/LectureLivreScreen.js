import React, { useEffect, useState, useRef, useLayoutEffect, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Alert,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemeContext } from '../context/themeContext';

// Configuration des couleurs avec support du thème sombre
const getColors = (isDark) => ({
  backgroundGradient: isDark ? ['#232344', '#1E1E3C'] : ['#F8F6FF', '#F0ECFF'],
  card: isDark ? '#2F2F4A' : '#FFFFFF',
  cardBorder: isDark ? '#4A4A70' : '#E8DFFF',
  primary: isDark ? '#B48EED' : '#7A5CCC',
  primaryLight: isDark ? '#C9A6F5' : '#9B7EDE',
  softAccent: isDark ? '#47476B' : '#E8DFFF',
  darkPurple: isDark ? '#8A2BE2' : '#4B0082',
  text: isDark ? '#FFFFFF' : '#2D2D2D',
  secondaryText: isDark ? '#D0CFEA' : '#6B5B95',
  border: isDark ? '#5A5A80' : '#D8BFD8',
  lightGray: isDark ? '#35354D' : '#f9f9f9',
  toolbarBg: isDark ? '#2F2F4A' : '#FFFFFF',
  toolbarShadow: isDark ? '#000000' : '#E8DFFF',
  word: isDark ? '#C9A6F5' : '#6C40B5',
  modalOverlay: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)',
  // Couleurs spécifiques pour la lecture
  bookAreaBg: isDark ? '#2A2A44' : '#FFFFFF', // Zone de lecture claire même en mode sombre
  bookText: isDark ? '#E8E8E8' : '#2D2D2D', // Texte toujours sombre pour la lisibilité
});

const API_BASE = 'http://192.168.1.135:3001'; 

export default function LectureLivreScreen({ route, navigation }) {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const COLORS = getColors(isDarkMode);
  
  const { bookId } = route.params;
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchWord, setSearchWord] = useState('');
  const [fontSize, setFontSize] = useState(16);
  const scrollRef = useRef(null);

  // --- States for word definition ---
  const [isLoadingWordDefinition, setIsLoadingWordDefinition] = useState(false);
  const [currentClickedWord, setCurrentClickedWord] = useState(null);
  const [showDefinitionModal, setShowDefinitionModal] = useState(false);
  const [definitionData, setDefinitionData] = useState(null);

  // --- States for search functionality ---
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchMatchIndex, setCurrentSearchMatchIndex] = useState(-1);
  const searchOccurrencesRefs = useRef([]);

  // --- BOOK READING AND PROGRESS SAVING LOGIC ---
  useEffect(() => {
    const fetchBook = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/books/${bookId}?includeContent=true`);
        setBook(data);

        setTimeout(() => {
          if (scrollRef.current && data.readingProgress?.currentPosition) {
            scrollRef.current.scrollTo({ y: data.readingProgress.currentPosition, animated: false });
          }
        }, 300);
      } catch (e) {
        console.error("Error loading book:", e);
        Alert.alert('Error', 'Could not load the book. Check your connection.');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [bookId]);

  const handleScroll = async (event) => {
    const y = event.nativeEvent.contentOffset.y;
    try {
      await axios.put(`${API_BASE}/books/${bookId}/progress`, {
        currentPosition: Math.round(y),
      });
    } catch (e) {
      console.error('Progress error:', e);
    }
  };

  // --- WORD DEFINITION LOGIC ---
  const cleanWord = (word) => {
    return word
      .replace(/[.,!?;:"'()[\]{}«»"'"]/g, '')
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  const isValidWord = (word) => {
    const validWordRegex = /^[a-zA-ZÀ-ÿĀ-žœŒæÆçÇ\u00C0-\u017F\u0100-\u024F]+$/;
    const cleanedWord = word.replace(/[.,!?;:"'()[\]{}«»"'"]/g, '').trim();
    return cleanedWord.length > 0 && validWordRegex.test(cleanedWord);
  };

  const handleWordTouch = async (word) => {
    Keyboard.dismiss();

    console.log('🔍 Clicked word:', word);

    if (isLoadingWordDefinition) {
      console.log('⏳ Request already in progress, ignored');
      return;
    }

    const cleanedWordForSearch = word.replace(/[.,!?;:"'()[\]{}«»"'"]/g, '').trim();
    console.log('🧹 Cleaned word for search:', cleanedWordForSearch);

    if (!cleanedWordForSearch || !isValidWord(cleanedWordForSearch)) {
      Alert.alert(
        'Dictionary',
        'This word does not seem valid for a definition search.',
        [{ text: 'Ok', style: 'default' }]
      );
      return;
    }

    setIsLoadingWordDefinition(true);
    setCurrentClickedWord(cleanedWordForSearch);

    try {
      const url = `${API_BASE}/note/definition/${encodeURIComponent(cleanedWordForSearch)}`;
      console.log('📡 Definition URL:', url);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Accept-Language': 'fr-FR,fr;q=0.9',
          'Accept-Charset': 'utf-8',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log('📨 Definition response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Definition data received:', data);

      let formattedDefinition;
      if (data.definitions && Array.isArray(data.definitions)) {
        if (typeof data.definitions[0] === 'string') {
          formattedDefinition = data.definitions.slice(0, 3).join('\n\n');
        } else if (typeof data.definitions[0] === 'object' && data.definitions[0].definition) {
          formattedDefinition = data.definitions.slice(0, 3)
            .map((def, index) => `${index + 1}. (${def.partOfSpeech || 'N/A'}) ${def.definition}`)
            .join('\n\n');
        } else {
            formattedDefinition = 'Unexpected definition format.';
        }
      } else if (data.definition) {
        formattedDefinition = data.definition;
      } else if (data.message) {
        formattedDefinition = data.message;
      } else {
        formattedDefinition = 'Definition not available.';
      }

      setDefinitionData({
        word: cleanedWordForSearch,
        definition: formattedDefinition,
        language: data.language || 'Français'
      });
      setShowDefinitionModal(true);

    } catch (error) {
      console.error('❌ Definition search error:', error);

      let errorMessage = `Could not find definition for "${cleanedWordForSearch}".`;
      if (error.name === 'AbortError') {
        errorMessage += '\n\nThe search timed out.';
      } else if (error.message.includes('Network request failed') || error.message.includes('Failed to fetch')) {
        errorMessage += '\n\nCheck your internet connection or API URL.';
      } else {
          errorMessage += `\n\nError: ${error.message}`;
      }

      Alert.alert(
        'Dictionary',
        errorMessage,
        [{ text: 'Ok', style: 'default' }]
      );

    } finally {
      setIsLoadingWordDefinition(false);
      setCurrentClickedWord(null);
      console.log('🔄 Definition search state reset');
    }
  };

  const adjustFontSize = (increase) => {
    setFontSize((prev) => Math.min(24, Math.max(12, prev + (increase ? 2 : -2))));
  };

  // --- TEXT SEARCH LOGIC ---
  const handleSearch = () => {
    Keyboard.dismiss();
    if (!searchWord.trim()) {
        Alert.alert('Book Search', 'Please enter a word to search.');
        setSearchResults([]);
        setCurrentSearchMatchIndex(-1);
        return;
    }

    const lowerCaseSearchTerm = cleanWord(searchWord);
    const textContent = book.extractedText;
    
    const allWordsInText = [];
    const wordRegexGlobal = /([a-zA-ZÀ-ÿĀ-žœŒæÆçÇ\u00C0-\u017F\u0100-\u024F]+)|([^a-zA-ZÀ-ÿĀ-žœŒæÆçÇ\u00C0-\u017F\u0100-\u024F]+)/g;
    let tempMatch;
    
    while ((tempMatch = wordRegexGlobal.exec(textContent)) !== null) {
        if (tempMatch[1]) {
            allWordsInText.push(tempMatch[1]);
        }
    }

    const newSearchResults = [];
    allWordsInText.forEach(word => {
        if (cleanWord(word) === lowerCaseSearchTerm) {
            newSearchResults.push(word);
        }
    });
    
    const uniqueSearchResults = [...new Set(newSearchResults)];
    searchOccurrencesRefs.current = uniqueSearchResults.map(() => React.createRef());

    if (uniqueSearchResults.length > 0) {
        setSearchResults(uniqueSearchResults);
        setCurrentSearchMatchIndex(0);
        
        setTimeout(() => {
            if (searchOccurrencesRefs.current[0] && searchOccurrencesRefs.current[0].current && scrollRef.current) {
                searchOccurrencesRefs.current[0].current.measureLayout(
                    scrollRef.current,
                    (x, y, width, height) => {
                        scrollRef.current.scrollTo({ y: y - (Dimensions.get('window').height / 4), animated: true });
                    },
                    (error) => console.error('Measure layout error for initial search:', error)
                );
            } else {
                 scrollRef.current?.scrollTo({ y: 0, animated: true });
            }
        }, 100);
    } else {
        setSearchResults([]);
        setCurrentSearchMatchIndex(-1);
        Alert.alert('Book Search', `No occurrences found for "${searchWord}".`);
    }

    setSearchWord('');
};

const navigateSearchResults = (direction) => {
    if (searchResults.length === 0) return;

    let newIndex = currentSearchMatchIndex;
    if (direction === 'next') {
        newIndex = (currentSearchMatchIndex + 1) % searchResults.length;
    } else {
        newIndex = (currentSearchMatchIndex - 1 + searchResults.length) % searchResults.length;
    }
    setCurrentSearchMatchIndex(newIndex);

    const targetRef = searchOccurrencesRefs.current[newIndex];
    if (targetRef && targetRef.current && scrollRef.current) {
        targetRef.current.measureLayout(
            scrollRef.current,
            (x, y, width, height) => {
                scrollRef.current.scrollTo({ y: y - (Dimensions.get('window').height / 4), animated: true });
            },
            (error) => console.error('Measure layout error for navigation:', error)
        );
    } else {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
};

const renderTextWithClickableWords = (text, searchWord, searchResults, currentSearchMatchIndex, currentClickedWord, isLoadingWordDefinition, searchOccurrencesRefs) => {
    if (!text || typeof text !== 'string') {
        return <Text style={[styles.bookText, { color: COLORS.bookText }]}>Error: Invalid text</Text>;
    }
    
    const parts = [];
    let partIndex = 0;
    const wordRegex = /([a-zA-ZÀ-ÿĀ-žœŒæÇç\u00C0-\u017F\u0100-\u024F]+)|([^a-zA-ZÀ-ÿĀ-žœŒæÇç\u00C0-\u017F\u0100-\u024F]+)/g;
    let match;
    
    while ((match = wordRegex.exec(text)) !== null) {
        const fullMatch = match[0];
        const isWord = match[1]; 
        
        const isClickable = isWord && isValidWord(fullMatch);
        const cleanedWordForDefinition = isClickable ? cleanWord(fullMatch) : '';
        const isCurrentlyClickedForDefinition = isClickable && currentClickedWord === cleanedWordForDefinition;
        const isDefinitionLoading = isClickable && isLoadingWordDefinition && isCurrentlyClickedForDefinition;

        let isSearchMatch = false;
        let isActiveSearchMatch = false;
        let refForSearch = null;

        if (searchResults.length > 0 && isWord) {
            const lowerCaseFullMatchCleaned = cleanWord(fullMatch);
            const lowerCaseSearchWordCleaned = cleanWord(searchWord);

            const foundSearchIndex = searchResults.findIndex(resultWord => 
                lowerCaseFullMatchCleaned === cleanWord(resultWord)
            );
            
            if (foundSearchIndex !== -1) {
                isSearchMatch = true;
                if (foundSearchIndex === currentSearchMatchIndex) {
                    isActiveSearchMatch = true;
                    refForSearch = searchOccurrencesRefs.current[foundSearchIndex];
                }
            }
        }

        parts.push(
            <Text 
                key={`part-${partIndex++}`}
                ref={refForSearch}
                onPress={isClickable ? () => handleWordTouch(fullMatch) : undefined} 
                style={[
                    styles.normalText, 
                    { fontSize, color: COLORS.bookText }, // Utilise bookText pour le texte
                    isClickable && styles.clickableWord, 
                    isCurrentlyClickedForDefinition && [styles.wordHighlighted, { backgroundColor: isDarkMode ? 'rgba(196, 166, 245, 0.3)' : 'rgba(234, 221, 255, 0.4)' }],
                    isDefinitionLoading && [styles.wordLoading, { backgroundColor: COLORS.primaryLight, color: '#FFFFFF' }],
                    isSearchMatch && [styles.searchHighlight, { backgroundColor: isDarkMode ? 'rgba(255, 255, 0, 0.6)' : 'rgba(255, 255, 0, 0.4)' }],
                    isActiveSearchMatch && [styles.activeSearchHighlight, { 
                        backgroundColor: isDarkMode ? 'rgba(255, 165, 0, 0.9)' : 'rgba(255, 165, 0, 0.8)',
                        color: isDarkMode ? '#000' : '#333'
                    }]
                ]} 
            >
                {fullMatch}
            </Text>
        );
    }
    return parts;
};

// --- Custom Definition Modal ---
const DefinitionModal = () => (
    <Modal
      visible={showDefinitionModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowDefinitionModal(false)}
    >
      <View style={[styles.modalOverlay, { backgroundColor: COLORS.modalOverlay }]}>
        <TouchableWithoutFeedback onPress={() => setShowDefinitionModal(false)}>
          <View style={styles.modalBackdrop} />
        </TouchableWithoutFeedback>
        
        <View style={[styles.modalContainer, { backgroundColor: COLORS.card, borderColor: COLORS.cardBorder }]}>
          <LinearGradient colors={[COLORS.primary, COLORS.primaryLight]} style={styles.modalHeader}>
            <View style={styles.modalHeaderContent}>
              <Ionicons name="book" size={24} color="#FFFFFF" />
              <Text style={styles.modalTitle}>Dictionary</Text>
              <TouchableOpacity 
                onPress={() => setShowDefinitionModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
          
          <View style={styles.modalBody}>
            <View style={[styles.wordContainer, { borderBottomColor: COLORS.softAccent }]}>
              <Text style={[styles.modalWord, { color: COLORS.primary }]}>
                {definitionData?.word || ''} 
              </Text>
              <Text style={[styles.languageTag, { backgroundColor: COLORS.softAccent, color: COLORS.secondaryText }]}>
                {definitionData?.language || ''}
              </Text>
            </View>
            
            <ScrollView style={styles.definitionScroll} showsVerticalScrollIndicator={false}>
              <Text style={[styles.definitionText, { color: COLORS.text }]}>
                {definitionData?.definition || ''}
              </Text>
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: COLORS.softAccent }]}
                onPress={() => {
                  setShowDefinitionModal(false);
                  Alert.alert('Upcoming Feature', 'Soon you can add this word to your personal notes!');
                }}
              >
                <Ionicons name="bookmark" size={20} color={COLORS.primary} />
                <Text style={[styles.actionButtonText, { color: COLORS.primary }]}>Save</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.primaryButton, { backgroundColor: COLORS.primary }]}
                onPress={() => setShowDefinitionModal(false)}
              >
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                <Text style={[styles.actionButtonText, styles.primaryButtonText]}>Got it!</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  // --- Dynamic Styles ---
  const styles = StyleSheet.create({
    container: { 
      flex: 1, 
    },
    safeArea: { 
      flex: 1 
    },
    content: { 
      flex: 1 
    },

    loadingContainerFull: { 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center',
      backgroundColor: COLORS.backgroundGradient[0],
    },
    loadingTextFull: { 
      marginTop: 16, 
      fontSize: 18, 
      color: COLORS.secondaryText,
      fontWeight: '500',
    },
    goBackButton: {
      marginTop: 20,
      backgroundColor: COLORS.primary,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 10,
    },
    goBackButtonText: {
      color: COLORS.card,
      fontSize: 16,
      fontWeight: 'bold',
    },

    header: {
      backgroundColor: COLORS.primary,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingBottom: 16,
      paddingTop: 8,
      alignItems: 'center',
    },
    backButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      minWidth: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    titleSection: {
      flex: 1,
      alignItems: 'center',
      marginHorizontal: 10,
    },
    titleTextHeader: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#FFFFFF',
      textAlign: 'center',
    },
    authorTextHeader: {
      fontSize: 14,
      color: COLORS.softAccent,
      textAlign: 'center',
      marginTop: 4,
      fontStyle: 'italic',
    },
    summaryButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      minWidth: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },

    toolbar: {
      backgroundColor: COLORS.toolbarBg,
      marginHorizontal: 12,
      marginTop: 12,
      marginBottom: 8,
      borderRadius: 12,
      shadowColor: COLORS.toolbarShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.6 : 0.15,
      shadowRadius: 6,
      elevation: 4,
      borderWidth: isDarkMode ? 1 : 0,
      borderColor: COLORS.cardBorder,
    },
    toolbarContent: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 6,
      height: 72,
    },
    fontControls: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.softAccent,
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 4,
      flex: 0.4,
      height: 44,
      justifyContent: 'center',
    },
    fontButton: {
      padding: 4,
    },
    fontLabel: {
      marginHorizontal: 8,
      color: COLORS.secondaryText,
      fontSize: 14,
      fontWeight: '500',
      minWidth: 35,
      textAlign: 'center',
    },
    iconButton: {
      padding: 8,
      borderRadius: 10,
      backgroundColor: COLORS.softAccent,
      flex: 0.2,
      height: 44,
      justifyContent: 'center',
      alignItems: 'center',
    },
    searchSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 0.4,
      backgroundColor: COLORS.backgroundGradient[0],
      borderRadius: 10,
      borderWidth: 1,
      borderColor: COLORS.softAccent,
      overflow: 'hidden',
      height: 44,
    },
    searchInput: {
      flex: 1,
      paddingHorizontal: 14,
      paddingVertical: 0,
      height: '100%',
      fontSize: 16,
      color: COLORS.text,
      textAlignVertical: 'center',
      includeFontPadding: false,
    },
    searchButton: {
      paddingHorizontal: 14,
      paddingVertical: 12,
      backgroundColor: COLORS.softAccent,
      borderLeftWidth: 1,
      borderLeftColor: COLORS.softAccent,
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },

    searchNavControls: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginHorizontal: 12,
      marginBottom: 8,
      backgroundColor: COLORS.card,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 16,
      shadowColor: COLORS.toolbarShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.6 : 0.1,
      shadowRadius: 4,
      elevation: 2,
      borderWidth: isDarkMode ? 1 : 0,
      borderColor: COLORS.cardBorder,
    },
    searchNavButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 8,
      backgroundColor: COLORS.softAccent,
    },
    searchNavButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: COLORS.primary,
      marginHorizontal: 4,
    },
    searchNavButtonDisabled: {
      opacity: 0.5,
    },
    searchMatchCount: {
      fontSize: 14,
      color: COLORS.secondaryText,
      fontWeight: '500',
    },

    bookArea: {
      flex: 1,
      backgroundColor: COLORS.bookAreaBg, // Zone de lecture claire
      marginHorizontal: 12,
      marginBottom: 12,
      borderRadius: 16,
      shadowColor: COLORS.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.6 : 0.1,
      shadowRadius: 4,
      elevation: 3,
      borderWidth: isDarkMode ? 1 : 0,
      borderColor: COLORS.cardBorder,
    },
    bookContent: {
      padding: 20,
      paddingBottom: 40,
    },
    paragraph: {
      lineHeight: 26,
      color: COLORS.bookText, // Texte toujours sombre
      textAlign: 'justify',
    },

    clickableWord: {
      color: COLORS.bookText, // Texte des mots cliquables sombre
      textDecorationLine: 'underline',
      textDecorationColor: isDarkMode ? 'rgba(122, 92, 204, 0.8)' : 'rgba(122, 92, 204, 0.2)',
      textDecorationStyle: 'dotted',
    },
    normalText: {
      color: COLORS.bookText, // Texte normal toujours sombre
    },
    wordHighlighted: {
      borderRadius: 2,
      textDecorationColor: COLORS.primary,
    },
    wordLoading: {
      textDecorationLine: 'none',
    },
    loadingIndicator: {
      backgroundColor: COLORS.softAccent,
      padding: 16,
      borderRadius: 12,
      marginTop: 20,
      alignItems: 'center',
    },
    loadingContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    loadingText: {
      color: COLORS.secondaryText,
      fontStyle: 'italic',
      fontSize: 16,
    },

    searchHighlight: {
      borderRadius: 2,
    },
    activeSearchHighlight: {
      fontWeight: 'bold',
    },

    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalBackdrop: {
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
    },
    modalContainer: {
      width: Dimensions.get('window').width * 0.9,
      maxHeight: '80%',
      borderRadius: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 10,
      borderWidth: isDarkMode ? 1 : 0,
    },
    modalHeader: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    modalHeaderContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
      flex: 1,
      textAlign: 'center',
      marginHorizontal: 16,
    },
    closeButton: {
      padding: 4,
    },
    modalBody: {
      padding: 20,
    },
    wordContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
    },
    modalWord: {
      fontSize: 24,
      fontWeight: 'bold',
      textTransform: 'capitalize',
    },
    languageTag: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      fontSize: 12,
      fontWeight: '500',
    },
    definitionScroll: {
      maxHeight: 200,
      marginBottom: 20,
    },
    definitionText: {
      fontSize: 16,
      lineHeight: 24,
      textAlign: 'justify',
    },
    modalActions: {
      flexDirection: 'row',
      gap: 12,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      gap: 8,
    },
    primaryButton: {
      backgroundColor: COLORS.primary,
    },
    actionButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    primaryButtonText: {
      color: '#FFFFFF',
    },
  });

  // --- MAIN COMPONENT RENDER ---
  if (loading) {
    return (
      <LinearGradient colors={COLORS.backgroundGradient} style={styles.loadingContainerFull}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingTextFull}>Loading book...</Text>
      </LinearGradient>
    );
  }

  if (!book) {
    return (
      <LinearGradient colors={COLORS.backgroundGradient} style={styles.loadingContainerFull}>
        <Text style={styles.loadingTextFull}>Book not found or loading error.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.goBackButton}>
          <Text style={styles.goBackButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity 
                onPress={() => navigation.goBack()} 
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              
              <View style={styles.titleSection}>
                <Text style={styles.titleTextHeader}>{book.title}</Text>
                {book.author && <Text style={styles.authorTextHeader}>{book.author}</Text>}
              </View>
            </View>

            {/* Toolbar */}
            <View style={styles.toolbar}>
              <View style={styles.toolbarContent}>
                {/* Font Size Controls */}
                <View style={styles.fontControls}>
                  <TouchableOpacity onPress={() => adjustFontSize(false)} style={styles.fontButton}>
                    <Ionicons name="remove" size={20} color={COLORS.primary} />
                  </TouchableOpacity>
                  <Text style={styles.fontLabel}>{fontSize}px</Text>
                  <TouchableOpacity onPress={() => adjustFontSize(true)} style={styles.fontButton}>
                    <Ionicons name="add" size={20} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
                
                {/* Notes Button */}
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => navigation.navigate('Résumé', {
                    summary: book.summary,
                    title: book.title,
                  })}>
                  <Ionicons name="document-text" size={20} color={COLORS.primary} />
                </TouchableOpacity>
                
                {/* Search Bar and Navigation */}
                <View style={styles.searchSection}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search..."
                    value={searchWord}
                    onChangeText={setSearchWord}
                    onSubmitEditing={handleSearch}
                    placeholderTextColor={COLORS.secondaryText}
                  />
                  <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
                    <Ionicons name="search" size={20} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Search Navigation Buttons */}
            {searchResults.length > 0 && (
                <View style={styles.searchNavControls}>
                    <TouchableOpacity 
                        onPress={() => navigateSearchResults('prev')} 
                        style={[styles.searchNavButton, currentSearchMatchIndex === 0 && styles.searchNavButtonDisabled]}
                        disabled={currentSearchMatchIndex === 0}
                    >
                        <Ionicons name="chevron-back-outline" size={20} color={currentSearchMatchIndex === 0 ? COLORS.secondaryText : COLORS.primary} />
                        <Text style={[styles.searchNavButtonText, currentSearchMatchIndex === 0 && { color: COLORS.secondaryText }]}>Previous</Text>
                    </TouchableOpacity>
                    <Text style={styles.searchMatchCount}>{currentSearchMatchIndex + 1} / {searchResults.length}</Text>
                    <TouchableOpacity 
                        onPress={() => navigateSearchResults('next')} 
                        style={[styles.searchNavButton, currentSearchMatchIndex === searchResults.length - 1 && styles.searchNavButtonDisabled]}
                        disabled={currentSearchMatchIndex === searchResults.length - 1}
                    >
                        <Text style={[styles.searchNavButtonText, currentSearchMatchIndex === searchResults.length - 1 && { color: COLORS.secondaryText }]}>Next</Text>
                        <Ionicons name="chevron-forward-outline" size={20} color={currentSearchMatchIndex === searchResults.length - 1 ? COLORS.secondaryText : COLORS.primary} />
                    </TouchableOpacity>
                </View>
            )}

            {/* Book Reading Area */}
            <ScrollView
              ref={scrollRef}
              onScroll={handleScroll}
              scrollEventThrottle={100}
              style={styles.bookArea}
              contentContainerStyle={styles.bookContent}
              indicatorStyle={isDarkMode ? 'white' : 'default'} // ScrollBar lumineux en mode sombre
              showsVerticalScrollIndicator={true}
            >
              {/* Render text with clickable words and search highlighting */}
              <Text style={styles.paragraph}>
                {renderTextWithClickableWords(
                  book.extractedText,
                  searchWord,
                  searchResults,
                  currentSearchMatchIndex,
                  currentClickedWord,
                  isLoadingWordDefinition,
                  searchOccurrencesRefs
                )}
              </Text>
              
              {/* Loading indicator for word definition */}
              {isLoadingWordDefinition && (
                <View style={styles.loadingIndicator}>
                  <View style={styles.loadingContent}>
                    <Ionicons name="book" size={20} color={COLORS.primary} />
                    <Text style={styles.loadingText}>
                      Searching for "{currentClickedWord}"...
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>
            
            {/* Definition Modal */}
            <DefinitionModal />
          </View>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </LinearGradient>
  );
}