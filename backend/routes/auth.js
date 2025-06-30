const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

const router = express.Router();

// JWT Secret (w produkcji powinna być w zmiennych środowiskowych)
const JWT_SECRET = process.env.JWT_SECRET || 'twoj-secret-klucz-jwt-tutaj';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Utility function do generowania JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Middleware do walidacji rejestracji
const registerValidation = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Imię musi mieć od 2 do 50 znaków')
    .matches(/^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s]+$/)
    .withMessage('Imię może zawierać tylko litery'),
  
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Nazwisko musi mieć od 2 do 50 znaków')
    .matches(/^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s]+$/)
    .withMessage('Nazwisko może zawierać tylko litery'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Podaj prawidłowy adres email'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Hasło musi mieć co najmniej 6 znaków')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Hasło musi zawierać co najmniej jedną małą literę, jedną wielką literę i jedną cyfrę'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Hasła nie są identyczne');
      }
      return true;
    })
];

// @route   POST /api/auth/register
// @desc    Rejestracja nowego użytkownika
// @access  Public
router.post('/register', registerValidation, async (req, res) => {
  try {
    // Sprawdź błędy walidacji
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Błędy walidacji',
        errors: errors.array()
      });
    }

    const { firstName, lastName, email, password } = req.body;

    // Sprawdź czy użytkownik już istnieje
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Użytkownik z tym adresem email już istnieje'
      });
    }

    // Utwórz nowego użytkownika
    const user = new User({
      firstName,
      lastName,
      email,
      password
    });

    // Wygeneruj token weryfikacyjny
    const verificationToken = user.generateVerificationToken();

    // Zapisz użytkownika
    await user.save();

    // Wygeneruj JWT token
    const token = generateToken(user._id);

    // TODO: Wyślij email weryfikacyjny (implementacja w przyszłości)
    console.log(`📧 Token weryfikacyjny dla ${email}: ${verificationToken}`);

    // Odpowiedź z danymi użytkownika (bez hasła)
    res.status(201).json({
      success: true,
      message: 'Użytkownik został pomyślnie zarejestrowany',
      data: {
        user: user.toAuthJSON(),
        token,
        expiresIn: JWT_EXPIRES_IN
      }
    });

  } catch (error) {
    console.error('❌ Błąd rejestracji:', error);
    
    // MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Użytkownik z tym adresem email już istnieje'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Błąd serwera podczas rejestracji',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/auth/login
// @desc    Logowanie użytkownika
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Podaj prawidłowy adres email'),
  body('password').exists().withMessage('Hasło jest wymagane')
], async (req, res) => {
  try {
    // Sprawdź błędy walidacji
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Błędy walidacji',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Znajdź użytkownika i uwzględnij hasło
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Nieprawidłowy email lub hasło'
      });
    }

    // Sprawdź czy konto jest aktywne
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Konto zostało dezaktywowane'
      });
    }

    // Sprawdź hasło
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Nieprawidłowy email lub hasło'
      });
    }

    // Aktualizuj czas ostatniego logowania
    user.lastLogin = new Date();
    await user.save();

    // Wygeneruj JWT token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Pomyślnie zalogowano',
      data: {
        user: user.toAuthJSON(),
        token,
        expiresIn: JWT_EXPIRES_IN
      }
    });

  } catch (error) {
    console.error('❌ Błąd logowania:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd serwera podczas logowania',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/auth/me
// @desc    Pobierz dane aktualnego użytkownika
// @access  Private
router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Użytkownik nie został znaleziony'
      });
    }

    res.json({
      success: true,
      data: {
        user: user.toAuthJSON()
      }
    });
  } catch (error) {
    console.error('❌ Błąd pobierania profilu:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd serwera podczas pobierania profilu'
    });
  }
});

module.exports = router;