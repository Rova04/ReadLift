import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const mainStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
    paddingHorizontal: 20,
  },
  homeScrollView: {
    flex: 1,
    width: '100%',
  },
  homeContentContainer: {
    alignItems: 'center',
    paddingBottom: 80,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },

  // Navigation Bar Styles
  navigationBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    width: width,
    height: 70,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    paddingBottom: 5,
  },
  navItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 5,
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  navText: {
    fontSize: 12,
  },
  activeNavItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIconContainer: {
    marginBottom: 4,
  },
  activeNavIcon: {
    fontSize: 24,
  },
  activeNavText: {
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Header Styles (Profile and Settings Screens)
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    width: '100%',
  },
  backButton: {
    padding: 5,
  },
  backIcon: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  editButton: {
    padding: 5,
  },
  editIcon: {
    fontSize: 20,
  },
  userInfo: {
    alignItems: 'center',
    paddingVertical: 30,
    marginBottom: 20,
    width: '100%',
  },
  profileImageContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    marginBottom: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#007AFF', // Remains blue
  },
  changePictureButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF', // White border for contrast
    elevation: 5,
  },
  changePictureButtonText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 16,
    marginTop: 5,
  },
  actionsContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    padding: 20,
    paddingBottom: 20,
    width: '100%',
  },
  logoutButton: {
    backgroundColor: '#FF3B30', // Remains red
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  logoutButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Auth Screens Styles (Login/SignUp)
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  authTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  input: {
    width: '100%',
    height: 50,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  authButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  authButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkText: {
    fontSize: 16,
  },

  // Search Bar Styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    width: '100%',
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  searchIconContainer: {
    paddingLeft: 10,
  },
  searchIcon: {
    fontSize: 20,
  },

  // Recent and Favorites Sections Styles
  recentSection: {
    width: '100%',
    borderRadius: 15,
    padding: 15,
    marginTop: 0,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  recentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  recentFilterIcon: {
    fontSize: 20,
    padding: 5,
  },
  recentDocumentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  docIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  docIcon: {
    fontSize: 20,
  },
  docInfo: {
    flex: 1,
  },
  docTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  docSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  docOptionsButton: {
    padding: 5,
    marginLeft: 10,
  },
  docOptionsIcon: {
    fontSize: 20,
  },
  noFavoritesText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },

  // Document Popup Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  popupContainer: {
    borderRadius: 10,
    paddingVertical: 10,
    width: width * 0.7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  popupButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  popupButtonWithBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  popupButtonText: {
    fontSize: 16,
    textAlign: 'center',
  },

  // Edit Profile Popup Styles
  editProfilePopupContainer: {
    borderRadius: 10,
    padding: 20,
    width: width * 0.85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    alignItems: 'center',
  },
  editProfilePopupTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  editProfileSaveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  editProfileSaveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  editProfileCancelButton: {
    backgroundColor: '#E0E0E0',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  editProfileCancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Settings Section Styles
  settingsSection: {
    width: '100%',
    borderRadius: 15,
    padding: 15,
    marginTop: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  settingsSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingItemText: {
    fontSize: 16,
  },
  settingItemIcon: {
    fontSize: 20,
  },
  firebaseResultText: {
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export const lightTheme = {
  isDark: false,
  container: { backgroundColor: '#F5F5F5' },
  cardBackground: { backgroundColor: '#FFF' },
  titleText: { color: '#333' },
  text: { color: '#666' },
  iconColor: { color: '#666' },
  input: { backgroundColor: '#FFF', borderColor: '#E0E0E0', color: '#333' },
  inputPlaceholder: { color: '#999' },
  linkText: { color: '#007AFF' },
  searchContainer: { backgroundColor: '#FFF', borderColor: '#E0E0E0' },
  searchInput: { color: '#333' },
  docIconBackground: { backgroundColor: '#E0E0E0' },
  docIconColor: { color: '#000' },
  docTitleText: { color: '#333' },
  docSubtitleText: { color: '#666' },
  listItemBorder: { borderBottomColor: '#F0F0F0' },
  headerBorder: { borderBottomColor: '#EEE', backgroundColor: '#FFF' },
  navigationBar: { backgroundColor: '#333' },
  navText: { color: '#CCC' },
  navIcon: { color: '#CCC' },
  activeIconContainer: { backgroundColor: '#007AFF', borderRadius: 24, width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  activeNavIcon: { color: '#FFF' },
  activeNavText: { color: '#FFF' },
  popupContainer: { backgroundColor: '#FFF' },
  popupButtonText: { color: '#333' },
};

export const darkTheme = {
  isDark: true,
  container: { backgroundColor: '#121212' },
  cardBackground: { backgroundColor: '#1E1E1E' },
  titleText: { color: '#FFF' },
  text: { color: '#E0E0E0' },
  iconColor: { color: '#B0B0B0' },
  input: { backgroundColor: '#2C2C2C', borderColor: '#404040', color: '#FFF' },
  inputPlaceholder: { color: '#A0A0A0' },
  linkText: { color: '#8AB4F8' },
  searchContainer: { backgroundColor: '#2C2C2C', borderColor: '#404040' },
  searchInput: { color: '#FFF' },
  docIconBackground: { backgroundColor: '#3A3A3A' },
  docIconColor: { color: '#FFF' },
  docTitleText: { color: '#FFF' },
  docSubtitleText: { color: '#B0B0B0' },
  listItemBorder: { borderBottomColor: '#3A3A3A' },
  headerBorder: { borderBottomColor: '#3A3A3A', backgroundColor: '#1E1E1E' },
  navigationBar: { backgroundColor: '#1E1E1E' },
  navText: { color: '#A0A0A0' },
  navIcon: { color: '#A0A0A0' },
  activeIconContainer: { backgroundColor: '#8AB4F8', borderRadius: 24, width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  activeNavIcon: { color: '#FFF' },
  activeNavText: { color: '#FFF' },
  popupContainer: { backgroundColor: '#1E1E1E' },
  popupButtonText: { color: '#FFF' },
};

export default mainStyles;