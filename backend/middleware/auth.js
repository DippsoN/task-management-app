const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'twoj-secret-klucz-jwt-tutaj';

/**
 * Middleware autoryzacji JWT
 * Sprawdza czy token jest prawidłowy i dodaje dane użytkownika do req.user
 */
const auth = async (req, res, next) => {
  try {
    // Pobierz token z nagłówka Authorization
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Brak tokenu autoryzacji, dostęp zabroniony'
      });
    }

    // Sprawdź format tokenu (Bearer <token>)
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Nieprawidłowy format tokenu'
      });
    }

    try {
      // Weryfikuj token JWT
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Znajdź użytkownika w bazie danych
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Token jest nieprawidłowy - użytkownik nie istnieje'
        });
      }

      // Sprawdź czy konto jest aktywne
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Konto zostało dezaktywowane'
        });
      }

      // Dodaj dane użytkownika do request
      req.user = {
        userId: user._id,
        email: user.email,
        role: user.role,
        fullName: user.fullName
      };

      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token wygasł, zaloguj się ponownie'
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Token jest nieprawidłowy'
        });
      } else {
        throw jwtError;
      }
    }

  } catch (error) {
    console.error('❌ Błąd middleware autoryzacji:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd serwera podczas autoryzacji'
    });
  }
};

/**
 * Middleware sprawdzający role użytkownika
 * @param {...string} roles - Lista dozwolonych ról
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Nie jesteś zalogowany'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Nie masz uprawnień do wykonania tej operacji'
      });
    }

    next();
  };
};

/**
 * Middleware opcjonalnej autoryzacji
 * Jeśli token jest obecny, próbuje go zweryfikować, ale nie wyrzuca błędu jeśli go nie ma
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return next(); // Brak tokenu - kontynuuj bez autoryzacji
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      return next(); // Brak tokenu - kontynuuj bez autoryzacji
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (user && user.isActive) {
        req.user = {
          userId: user._id,
          email: user.email,
          role: user.role,
          fullName: user.fullName
        };
      }
    } catch (jwtError) {
      // Ignoruj błędy JWT w opcjonalnej autoryzacji
      console.log('Opcjonalna autoryzacja - błąd tokenu:', jwtError.message);
    }

    next();
  } catch (error) {
    console.error('❌ Błąd opcjonalnej autoryzacji:', error);
    next(); // Kontynuuj mimo błędu
  }
};

module.exports = {
  auth,
  authorize,
  optionalAuth
};