import axios from 'axios';

// Konfiguracja axios
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Tworzenie instancji axios z domyślną konfiguracją
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor dla żądań - dodawanie tokenu autoryzacji
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor dla odpowiedzi - obsługa błędów autoryzacji
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token wygasł lub jest nieprawidłowy
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      
      // Przekieruj do strony logowania jeśli nie jest to strona publiczna
      const currentPath = window.location.pathname;
      const publicPaths = ['/login', '/register', '/'];
      
      if (!publicPaths.includes(currentPath)) {
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

class AuthService {
  /**
   * Rejestracja nowego użytkownika
   * @param {Object} userData - Dane użytkownika
   * @param {string} userData.firstName - Imię
   * @param {string} userData.lastName - Nazwisko
   * @param {string} userData.email - Email
   * @param {string} userData.password - Hasło
   * @param {string} userData.confirmPassword - Potwierdzenie hasła
   * @returns {Promise<Object>} Odpowiedź z serwera
   */
  async register(userData) {
    try {
      const response = await apiClient.post('/auth/register', userData);
      
      if (response.data.success && response.data.data.token) {
        // Zapisz token i dane użytkownika w localStorage
        this.setAuthToken(response.data.data.token);
        this.setUserData(response.data.data.user);
      }
      
      return response.data;
    } catch (error) {
      console.error('Auth Service - Register error:', error);
      throw error;
    }
  }

  /**
   * Logowanie użytkownika
   * @param {Object} credentials - Dane logowania
   * @param {string} credentials.email - Email
   * @param {string} credentials.password - Hasło
   * @returns {Promise<Object>} Odpowiedź z serwera
   */
  async login(credentials) {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      
      if (response.data.success && response.data.data.token) {
        // Zapisz token i dane użytkownika w localStorage
        this.setAuthToken(response.data.data.token);
        this.setUserData(response.data.data.user);
      }
      
      return response.data;
    } catch (error) {
      console.error('Auth Service - Login error:', error);
      throw error;
    }
  }

  /**
   * Wylogowanie użytkownika
   */
  logout() {
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      
      // Opcjonalnie wyślij żądanie do serwera o wylogowaniu
      // await apiClient.post('/auth/logout');
      
      window.location.href = '/login';
    } catch (error) {
      console.error('Auth Service - Logout error:', error);
      // Mimo błędu, usuń dane z localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      window.location.href = '/login';
    }
  }

  /**
   * Pobieranie danych aktualnego użytkownika
   * @returns {Promise<Object>} Dane użytkownika
   */
  async getCurrentUser() {
    try {
      const response = await apiClient.get('/auth/me');
      
      if (response.data.success) {
        this.setUserData(response.data.data.user);
        return response.data.data.user;
      }
      
      throw new Error('Nie udało się pobrać danych użytkownika');
    } catch (error) {
      console.error('Auth Service - Get current user error:', error);
      throw error;
    }
  }

  /**
   * Sprawdzenie czy użytkownik jest zalogowany
   * @returns {boolean} True jeśli użytkownik jest zalogowany
   */
  isAuthenticated() {
    const token = this.getAuthToken();
    if (!token) return false;

    try {
      // Sprawdź czy token nie wygasł
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      return payload.exp > currentTime;
    } catch (error) {
      console.error('Auth Service - Token validation error:', error);
      return false;
    }
  }

  /**
   * Pobieranie tokenu autoryzacji
   * @returns {string|null} Token autoryzacji
   */
  getAuthToken() {
    return localStorage.getItem('authToken');
  }

  /**
   * Zapisywanie tokenu autoryzacji
   * @param {string} token - Token autoryzacji
   */
  setAuthToken(token) {
    localStorage.setItem('authToken', token);
  }

  /**
   * Pobieranie danych użytkownika
   * @returns {Object|null} Dane użytkownika
   */
  getUserData() {
    try {
      const userData = localStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Auth Service - Parse user data error:', error);
      return null;
    }
  }

  /**
   * Zapisywanie danych użytkownika
   * @param {Object} userData - Dane użytkownika
   */
  setUserData(userData) {
    localStorage.setItem('userData', JSON.stringify(userData));
  }

  /**
   * Aktualizacja danych użytkownika
   * @param {Object} updateData - Nowe dane użytkownika
   * @returns {Promise<Object>} Zaktualizowane dane użytkownika
   */
  async updateProfile(updateData) {
    try {
      const response = await apiClient.put('/users/profile', updateData);
      
      if (response.data.success) {
        this.setUserData(response.data.data.user);
        return response.data.data.user;
      }
      
      throw new Error('Nie udało się zaktualizować profilu');
    } catch (error) {
      console.error('Auth Service - Update profile error:', error);
      throw error;
    }
  }

  /**
   * Zmiana hasła
   * @param {Object} passwordData - Dane zmiany hasła
   * @param {string} passwordData.currentPassword - Aktualne hasło
   * @param {string} passwordData.newPassword - Nowe hasło
   * @returns {Promise<Object>} Odpowiedź z serwera
   */
  async changePassword(passwordData) {
    try {
      const response = await apiClient.put('/users/change-password', passwordData);
      return response.data;
    } catch (error) {
      console.error('Auth Service - Change password error:', error);
      throw error;
    }
  }

  /**
   * Reset hasła
   * @param {string} email - Adres email
   * @returns {Promise<Object>} Odpowiedź z serwera
   */
  async requestPasswordReset(email) {
    try {
      const response = await apiClient.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      console.error('Auth Service - Password reset request error:', error);
      throw error;
    }
  }

  /**
   * Konfirmacja resetu hasła
   * @param {Object} resetData - Dane resetu hasła
   * @param {string} resetData.token - Token resetu
   * @param {string} resetData.newPassword - Nowe hasło
   * @returns {Promise<Object>} Odpowiedź z serwera
   */
  async resetPassword(resetData) {
    try {
      const response = await apiClient.post('/auth/reset-password', resetData);
      return response.data;
    } catch (error) {
      console.error('Auth Service - Password reset error:', error);
      throw error;
    }
  }
}

// Eksportuj instancję serwisu
const authService = new AuthService();
export default authService;