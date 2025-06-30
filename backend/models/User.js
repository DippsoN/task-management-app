const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Imię jest wymagane'],
    trim: true,
    minlength: [2, 'Imię musi mieć co najmniej 2 znaki'],
    maxlength: [50, 'Imię nie może mieć więcej niż 50 znaków']
  },
  lastName: {
    type: String,
    required: [true, 'Nazwisko jest wymagane'],
    trim: true,
    minlength: [2, 'Nazwisko musi mieć co najmniej 2 znaki'],
    maxlength: [50, 'Nazwisko nie może mieć więcej niż 50 znaków']
  },
  email: {
    type: String,
    required: [true, 'Email jest wymagany'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Podaj prawidłowy adres email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Hasło jest wymagane'],
    minlength: [6, 'Hasło musi mieć co najmniej 6 znaków'],
    select: false // Nie zwracaj hasła w zapytaniach
  },
  avatar: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String,
    default: null
  },
  passwordResetToken: {
    type: String,
    default: null
  },
  passwordResetExpires: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indeksy dla lepszej wydajności
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });

// Virtual dla pełnego imienia
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware do hashowania hasła
userSchema.pre('save', async function(next) {
  // Jeśli hasło nie zostało zmodyfikowane, przejdź dalej
  if (!this.isModified('password')) return next();

  try {
    // Zahashuj hasło z siłą 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Metoda do porównywania haseł
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Błąd podczas porównywania haseł');
  }
};

// Metoda do generowania tokenu weryfikacyjnego
userSchema.methods.generateVerificationToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  this.verificationToken = token;
  return token;
};

// Metoda do czyszczenia wrażliwych danych
userSchema.methods.toAuthJSON = function() {
  return {
    id: this._id,
    firstName: this.firstName,
    lastName: this.lastName,
    fullName: this.fullName,
    email: this.email,
    avatar: this.avatar,
    role: this.role,
    isActive: this.isActive,
    emailVerified: this.emailVerified,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Middleware do usuwania powiązanych danych przy usuwaniu użytkownika
userSchema.pre('remove', async function(next) {
  try {
    // Usuń wszystkie zadania użytkownika
    await this.model('Task').deleteMany({ owner: this._id });
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;