import React, { useState, useContext, useEffect } from 'react';
import {
  SafeAreaView, ScrollView, Text, View, TextInput, TouchableOpacity, Modal,
  TouchableWithoutFeedback, Alert, StyleSheet, ActivityIndicator, FlatList, Keyboard,
} from 'react-native';
import mainStyles from '../styles/mainStyles';
import { ThemeContext } from '../context/themeContext';
import BottomNavBar from '../components/BottomNavBar';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

const API_BASE = 'http://192.168.1.135:3001';

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
  red: '#dc3545',
  modalOverlay: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)',
});

// Composant popup pour les options de document
const DocumentOptionsPopup = ({ isVisible, onClose, book, navigation, isDarkMode }) => {
  const COLORS = getColors(isDarkMode);

  const handleAddToFavorites = () => {
    Alert.alert('Action', `Livre "${book.title}" ajouté aux favoris ! (Fonctionnalité à implémenter)`);
    onClose();
  };

  const handleReadBook = () => {
    if (book && book.id) {
      navigation.navigate('Lecture', { bookId: book.id });
    } else {
      Alert.alert('Erreur', 'Impossible de lire le livre: ID manquant.');
    }
    onClose();
  };

  if (!isVisible || !book) return null;

  const popupStyles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: COLORS.modalOverlay,
      justifyContent: 'center',
      alignItems: 'center',
    },
    popupContainer: {
      width: '80%',
      backgroundColor: COLORS.card,
      borderRadius: 16,
      paddingVertical: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDarkMode ? 0.6 : 0.2,
      shadowRadius: 12,
      elevation: 8,
      borderWidth: isDarkMode ? 1 : 0,
      borderColor: COLORS.cardBorder,
    },
    popupButton: {
      padding: 16,
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: COLORS.softAccent,
    },
    popupButtonText: {
      fontSize: 16,
      color: COLORS.text,
      fontWeight: '500',
    },
  });

  return (
    <Modal transparent={true} animationType="fade" visible={isVisible} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={popupStyles.modalOverlay}> 
          <TouchableWithoutFeedback>
            <View style={popupStyles.popupContainer}> 
              <TouchableOpacity style={popupStyles.popupButton} onPress={handleAddToFavorites}>
                <Text style={popupStyles.popupButtonText}>Ajouter aux favoris</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[popupStyles.popupButton, { borderBottomWidth: 0 }]} onPress={handleReadBook}>
                <Text style={popupStyles.popupButtonText}>Lire le livre</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// Composant principal HomeScreen
export default function HomeScreen({ navigation }) {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const COLORS = getColors(isDarkMode);
  
  // États principaux
  const [searchText, setSearchText] = useState('');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);

  // États pour l'upload
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');

  // États pour l'édition
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editAuthor, setEditAuthor] = useState('');

  // États pour la suppression et options
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [documentOptionsPopupVisible, setDocumentOptionsPopupVisible] = useState(false);

  // Chargement initial des livres
  useEffect(() => {
    fetchBooks();
  }, []);

  // Fonctions API - Récupération des livres
  const fetchBooks = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/books`);
      if (Array.isArray(response.data)) {
        setBooks(response.data);
      } else if (Array.isArray(response.data.books)) {
        setBooks(response.data.books);
      } else {
        console.warn('Payload inattendu:', response.data);
        setBooks([]);
      }
    } catch (error) {
      console.error('Erreur de récupération des livres:', error);
      Alert.alert('Erreur', "Impossible de charger les livres. Vérifiez votre connexion et le serveur.");
    } finally {
      setLoading(false);
    }
  };

  // Fonctions d'upload de fichiers
  const pickDocument = async () => {
    try {
      Keyboard.dismiss();
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain'],
      });
      
      if (result.canceled) {
        console.log('Sélection du fichier annulée par l\'utilisateur.');
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSelectedFile(file);
        const fileName = file.name;
        const titleWithoutExtension = fileName.replace(/\.[^/.]+$/, "");
        setBookTitle(titleWithoutExtension);
        setBookAuthor('');
        setUploadModalVisible(true);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection du document:', error);
      Alert.alert('Erreur', "Erreur lors de la sélection du fichier.");
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) return;

    try {
      setUploadModalVisible(false);
      setLoading(true);

      const formData = new FormData();
      formData.append('file', {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.mimeType || 'application/octet-stream',
      });

      formData.append('title', bookTitle.trim() || selectedFile.name);
      formData.append('author', bookAuthor.trim() || 'Auteur inconnu');

      console.log('Uploading to', `${API_BASE}/upload-book`);

      const res = await axios.post(`${API_BASE}/upload-book`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000, 
      });

      if (res.status === 200 || res.status === 201) {
        Alert.alert('Succès', 'Livre importé avec succès !');
        const newBook = res.data.book || res.data;
        setBooks(prevBooks => [newBook, ...prevBooks]); 
      } else {
        Alert.alert('Erreur', "L'import a échoué.");
      }
    } catch (error) {
      console.error('Erreur d\'upload:', error);
      if (axios.isCancel(error)) {
        Alert.alert('Erreur', "L'import a été annulé ou a expiré (timeout).");
      } else {
        Alert.alert('Erreur', "Une erreur est survenue lors de l'import.");
      }
    } finally {
      setLoading(false);
      setSelectedFile(null);
      setBookTitle('');
      setBookAuthor('');
    }
  };

  const cancelUpload = () => {
    setUploadModalVisible(false);
    setSelectedFile(null);
    setBookTitle('');
    setBookAuthor('');
  };

  // Fonctions d'édition de livre
  const openEditModal = (book) => {
    setSelectedBook(book);
    setEditTitle(book.title || '');
    setEditAuthor(book.author || '');
    setEditModalVisible(true);
    setActiveMenuId(null);
  };

  const updateBook = async () => {
    if (!selectedBook) return;

    try {
      setEditModalVisible(false);
      setLoading(true);

      const response = await axios.put(`${API_BASE}/books/${selectedBook.id}`, {
        title: editTitle.trim(),
        author: editAuthor.trim(),
      });

      if (response.status === 200) {
        Alert.alert('Succès', 'Livre modifié avec succès !');
        setBooks(prevBooks =>
          prevBooks.map(b =>
            b.id === selectedBook.id ? { ...b, title: editTitle.trim(), author: editAuthor.trim() } : b
          )
        );
      } else {
        Alert.alert('Erreur', "La modification a échoué.");
      }
    } catch (error) {
      console.error('Erreur de mise à jour:', error);
      Alert.alert('Erreur', "Une erreur est survenue lors de la modification.");
    } finally {
      setLoading(false);
      setSelectedBook(null);
      setEditTitle('');
      setEditAuthor('');
    }
  };

  const cancelEdit = () => {
    setEditModalVisible(false);
    setSelectedBook(null);
    setEditTitle('');
    setEditAuthor('');
  };

  // Fonctions de suppression de livre
  const openDeleteModal = (book) => {
    setSelectedBook(book);
    setDeleteModalVisible(true);
    setActiveMenuId(null);
  };

  const deleteBook = async () => {
    if (!selectedBook) return;

    try {
      setDeleteModalVisible(false);
      setLoading(true);

      const response = await axios.delete(`${API_BASE}/books/${selectedBook.id}`);

      if (response.status === 200) {
        Alert.alert('Succès', 'Livre supprimé avec succès !');
        setBooks(prevBooks => prevBooks.filter(b => b.id !== selectedBook.id));
      } else {
        Alert.alert('Erreur', "La suppression a échoué.");
      }
    } catch (error) {
      console.error('Erreur de suppression:', error);
      Alert.alert('Erreur', "Une erreur est survenue lors de la suppression.");
    } finally {
      setLoading(false);
      setSelectedBook(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setSelectedBook(null);
  };

  // Fonctions de gestion des menus et popups
  const toggleMenu = (bookId) => {
    setActiveMenuId(activeMenuId === bookId ? null : bookId);
  };

  const openDocumentOptionsPopup = (book) => {
    setSelectedBook(book);
    setDocumentOptionsPopupVisible(true);
    setActiveMenuId(null);
  };

  const closeDocumentOptionsPopup = () => {
    setDocumentOptionsPopupVisible(false);
    setSelectedBook(null);
  };

  // Filtrage des livres pour la recherche
  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchText.toLowerCase()) ||
    book.author.toLowerCase().includes(searchText.toLowerCase())
  );

  // Rendu des éléments de liste
  const renderItem = ({ item }) => (
    <View style={combinedStyles.cardContainer}>
      <TouchableOpacity
        style={combinedStyles.card}
        onPress={() => navigation.navigate('Lecture', { bookId: item.id })}
      >
        <View style={combinedStyles.cardContent}>
          <View style={combinedStyles.docIconContainer}>
            <Ionicons name="book" size={24} color={COLORS.primary} />
          </View>
          <View style={combinedStyles.docInfo}>
            <Text style={combinedStyles.cardTitle} numberOfLines={1} ellipsizeMode="tail">
              {item.title}
            </Text>
            <Text style={combinedStyles.cardAuthor}>
              {item.author || 'Auteur inconnu'}
            </Text>
            {item.summary && (
              <Text style={combinedStyles.summary} numberOfLines={1}>
                {item.summary}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={combinedStyles.menuButton}
        onPress={() => toggleMenu(item.id)}
      >
        <Ionicons name="ellipsis-vertical" size={20} color={COLORS.secondaryText} />
      </TouchableOpacity>

      {activeMenuId === item.id && (
        <View style={combinedStyles.menuDropdown}>
          <TouchableOpacity
            style={combinedStyles.menuItem}
            onPress={() => openEditModal(item)}
          >
            <Ionicons name="create-outline" size={18} color={COLORS.text} style={combinedStyles.menuItemIcon} />
            <Text style={combinedStyles.menuItemText}>Modifier</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[combinedStyles.menuItem, combinedStyles.deleteMenuItem]}
            onPress={() => openDeleteModal(item)}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.red} style={combinedStyles.menuItemIcon} />
            <Text style={[combinedStyles.menuItemText, combinedStyles.deleteMenuItemText]}>Supprimer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={combinedStyles.menuItem}
            onPress={() => openDocumentOptionsPopup(item)}
          >
            <Ionicons name="ellipsis-horizontal-circle-outline" size={18} color={COLORS.secondaryText} style={combinedStyles.menuItemIcon} />
            <Text style={combinedStyles.menuItemText}>Plus d'options</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Styles dynamiques avec le thème
  const combinedStyles = StyleSheet.create({
    innerContainer: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 16,
      backgroundColor: COLORS.backgroundGradient[0],
    },
    welcomeText: {
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 4,
      color: COLORS.text,
    },
    descriptionText: {
      fontSize: 16,
      color: COLORS.secondaryText,
      marginBottom: 20,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: COLORS.softAccent,
      paddingHorizontal: 12,
      marginBottom: 16,
      height: 50,
      shadowColor: isDarkMode ? '#000' : COLORS.primaryLight,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.6 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: COLORS.text,
      paddingVertical: 0,
    },
    searchIconContainer: {
      paddingLeft: 8,
    },
    uploadBtn: {
      flexDirection: 'row',
      backgroundColor: COLORS.softAccent,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      shadowColor: isDarkMode ? '#000' : COLORS.primary,
      shadowOpacity: isDarkMode ? 0.6 : 0.1,
      shadowRadius: 4,
      elevation: 2,
      gap: 8,
      borderWidth: isDarkMode ? 1 : 0,
      borderColor: COLORS.cardBorder,
    },
    uploadBtnText: {
      color: COLORS.darkPurple,
      fontSize: 16,
      fontWeight: '600',
    },
    booksSection: {
      flex: 1,
      backgroundColor: COLORS.card,
      borderRadius: 16,
      padding: 12,
      marginBottom: 80,
      shadowColor: isDarkMode ? '#000' : COLORS.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.6 : 0.1,
      shadowRadius: 4,
      elevation: 3,
      borderWidth: isDarkMode ? 1 : 0,
      borderColor: COLORS.cardBorder,
    },
    booksHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 4,
      marginBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.softAccent,
      paddingBottom: 10,
    },
    booksTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: COLORS.text,
    },
    flatListContent: {
      paddingVertical: 10,
    },
    cardContainer: {
      position: 'relative',
      marginBottom: 10,
    },
    card: {
      flexDirection: 'row',
      backgroundColor: COLORS.card,
      padding: 16,
      borderRadius: 10,
      borderLeftWidth: 4,
      borderLeftColor: COLORS.primaryLight,
      shadowColor: isDarkMode ? '#000' : COLORS.primary,
      shadowOpacity: isDarkMode ? 0.4 : 0.1,
      shadowRadius: 5,
      elevation: 2,
      alignItems: 'center',
      borderWidth: isDarkMode ? 1 : 0,
      borderColor: COLORS.cardBorder,
    },
    cardContent: {
      flexDirection: 'row',
      flex: 1,
      alignItems: 'center',
    },
    docIconContainer: {
      backgroundColor: COLORS.softAccent,
      borderRadius: 20,
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    docInfo: {
      flex: 1,
      paddingRight: 10,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: COLORS.text,
    },
    cardAuthor: {
      fontSize: 13,
      color: COLORS.secondaryText,
      marginTop: 2,
    },
    summary: {
      fontSize: 12,
      color: COLORS.secondaryText,
      marginTop: 4,
      fontStyle: 'italic',
    },
    menuButton: {
      position: 'absolute',
      right: 5,
      top: 5,
      padding: 8,
      borderRadius: 20,
      zIndex: 1,
    },
    menuDropdown: {
      position: 'absolute',
      right: 15,
      top: 50,
      backgroundColor: COLORS.card,
      borderRadius: 10,
      shadowColor: isDarkMode ? '#000' : COLORS.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDarkMode ? 0.8 : 0.2,
      shadowRadius: 8,
      elevation: 8,
      zIndex: 1000,
      minWidth: 150,
      paddingVertical: 5,
      borderWidth: isDarkMode ? 1 : 0,
      borderColor: COLORS.cardBorder,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.softAccent,
    },
    deleteMenuItem: {
      borderBottomWidth: 0,
    },
    menuItemIcon: {
      marginRight: 10,
    },
    menuItemText: {
      fontSize: 15,
      color: COLORS.text,
    },
    deleteMenuItemText: {
      color: COLORS.red,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: COLORS.modalOverlay,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: COLORS.card,
      margin: 20,
      borderRadius: 16,
      padding: 24,
      alignItems: 'stretch',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDarkMode ? 0.8 : 0.25,
      shadowRadius: 12,
      elevation: 8,
      minWidth: 320,
      borderWidth: isDarkMode ? 1 : 0,
      borderColor: COLORS.cardBorder,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 20,
      textAlign: 'center',
      color: COLORS.primary,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
      color: COLORS.text,
    },
    input: {
      borderWidth: 1,
      borderColor: COLORS.softAccent,
      borderRadius: 10,
      padding: 14,
      fontSize: 16,
      marginBottom: 16,
      backgroundColor: COLORS.lightGray,
      color: COLORS.text,
    },
    fileInfo: {
      fontSize: 14,
      color: COLORS.secondaryText,
      marginBottom: 20,
      textAlign: 'center',
      fontStyle: 'italic',
      padding: 12,
      backgroundColor: COLORS.softAccent,
      borderRadius: 8,
    },
    deleteText: {
      fontSize: 16,
      color: COLORS.text,
      textAlign: 'center',
      marginBottom: 20,
      lineHeight: 22,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    modalBtn: {
      flex: 1,
      padding: 14,
      borderRadius: 10,
      alignItems: 'center',
    },
    cancelBtn: {
      backgroundColor: COLORS.softAccent,
      borderWidth: 1,
      borderColor: COLORS.primaryLight,
    },
    confirmBtn: {
      backgroundColor: COLORS.primary,
    },
    deleteBtn: {
      backgroundColor: COLORS.red,
    },
    cancelBtnText: {
      color: COLORS.primary,
      fontSize: 16,
      fontWeight: '600',
    },
    confirmBtnText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    deleteBtnText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 150,
    },
    loadingText: {
      marginTop: 10,
      color: COLORS.secondaryText,
      fontSize: 16,
    },
    emptyText: {
      textAlign: 'center',
      marginTop: 20,
      color: COLORS.secondaryText,
      fontSize: 16,
      fontStyle: 'italic',
    },
  });

  return (
    <SafeAreaView style={[mainStyles.container, { backgroundColor: COLORS.backgroundGradient[0] }]}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={combinedStyles.innerContainer}>
          {/* En-tête */}
          <Text style={combinedStyles.welcomeText}>Bienvenue !</Text>
          <Text style={combinedStyles.descriptionText}>Explorez et gérez vos livres.</Text>

          {/* Barre de recherche */}
          <View style={combinedStyles.searchContainer}>
            <TextInput
              style={combinedStyles.searchInput}
              placeholder="Rechercher des livres..."
              placeholderTextColor={COLORS.secondaryText}
              value={searchText}
              onChangeText={setSearchText}
            />
            <TouchableOpacity style={combinedStyles.searchIconContainer} onPress={() => Keyboard.dismiss()}>
              <Ionicons name="search" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {/* Bouton d'import */}
          <TouchableOpacity style={combinedStyles.uploadBtn} onPress={pickDocument}>
            <Ionicons name="cloud-upload-outline" size={20} color={COLORS.darkPurple} />
            <Text style={combinedStyles.uploadBtnText}>Importer un livre</Text>
          </TouchableOpacity>

          {/* Liste des livres */}
          <View style={combinedStyles.booksSection}>
            <View style={combinedStyles.booksHeader}>
              <Text style={combinedStyles.booksTitle}>Mes Livres</Text>
              <TouchableOpacity onPress={() => fetchBooks()}>
                <Ionicons name="refresh-outline" size={24} color={COLORS.secondaryText} />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={combinedStyles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={combinedStyles.loadingText}>Chargement des livres...</Text>
              </View>
            ) : (
              <FlatList
                data={filteredBooks}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderItem}
                contentContainerStyle={combinedStyles.flatListContent}
                ListEmptyComponent={
                  <Text style={combinedStyles.emptyText}>Aucun livre importé pour l'instant.</Text>
                }
              />
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>

      <BottomNavBar activeScreen="Accueil" onNavigate={navigation.navigate} />

      {/* Modaux */}
      <Modal animationType="fade" transparent={true} visible={uploadModalVisible} onRequestClose={cancelUpload}>
        <View style={combinedStyles.modalOverlay}>
          <View style={combinedStyles.modalContent}>
            <Text style={combinedStyles.modalTitle}>Importer un livre</Text>
            
            <Text style={combinedStyles.label}>Titre du livre</Text>
            <TextInput
              style={combinedStyles.input}
              value={bookTitle}
              onChangeText={setBookTitle}
              placeholder="Titre du livre"
              placeholderTextColor={COLORS.secondaryText}
              maxLength={200}
            />
            
            <Text style={combinedStyles.label}>Auteur</Text>
            <TextInput
              style={combinedStyles.input}
              value={bookAuthor}
              onChangeText={setBookAuthor}
              placeholder="Nom de l'auteur (optionnel)"
              placeholderTextColor={COLORS.secondaryText}
              maxLength={100}
            />

            {selectedFile && (
              <Text style={combinedStyles.fileInfo}>📄 {selectedFile.name}</Text>
            )}
            
            <View style={combinedStyles.modalButtons}>
              <TouchableOpacity style={[combinedStyles.modalBtn, combinedStyles.cancelBtn]} onPress={cancelUpload}>
                <Text style={combinedStyles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[combinedStyles.modalBtn, combinedStyles.confirmBtn]} onPress={uploadFile}>
                <Text style={combinedStyles.confirmBtnText}>Importer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" transparent={true} visible={editModalVisible} onRequestClose={cancelEdit}>
        <View style={combinedStyles.modalOverlay}>
          <View style={combinedStyles.modalContent}>
            <Text style={combinedStyles.modalTitle}>Modifier le livre</Text>
            
            <Text style={combinedStyles.label}>Titre du livre</Text>
            <TextInput
              style={combinedStyles.input}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Titre du livre"
              placeholderTextColor={COLORS.secondaryText}
              maxLength={200}
            />
            
            <Text style={combinedStyles.label}>Auteur</Text>
            <TextInput
              style={combinedStyles.input}
              value={editAuthor}
              onChangeText={setEditAuthor}
              placeholder="Nom de l'auteur (optionnel)"
              placeholderTextColor={COLORS.secondaryText}
              maxLength={100}
            />
            
            <View style={combinedStyles.modalButtons}>
              <TouchableOpacity style={[combinedStyles.modalBtn, combinedStyles.cancelBtn]} onPress={cancelEdit}>
                <Text style={combinedStyles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[combinedStyles.modalBtn, combinedStyles.confirmBtn]} onPress={updateBook}>
                <Text style={combinedStyles.confirmBtnText}>Modifier</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" transparent={true} visible={deleteModalVisible} onRequestClose={cancelDelete}>
        <View style={combinedStyles.modalOverlay}>
          <View style={combinedStyles.modalContent}>
            <Text style={combinedStyles.modalTitle}>Confirmer la suppression</Text>
            
            {selectedBook && (
              <Text style={combinedStyles.deleteText}>
                Êtes-vous sûr de vouloir supprimer le livre "{selectedBook.title}" ?{'\n'}
                Cette action est irréversible.
              </Text>
            )}
            
            <View style={combinedStyles.modalButtons}>
              <TouchableOpacity style={[combinedStyles.modalBtn, combinedStyles.cancelBtn]} onPress={cancelDelete}>
                <Text style={combinedStyles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[combinedStyles.modalBtn, combinedStyles.deleteBtn]} onPress={deleteBook}>
                <Text style={combinedStyles.deleteBtnText}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <DocumentOptionsPopup 
        isVisible={documentOptionsPopupVisible} 
        onClose={closeDocumentOptionsPopup} 
        book={selectedBook} 
        navigation={navigation}
        isDarkMode={isDarkMode}
      />
    </SafeAreaView>
  );
}