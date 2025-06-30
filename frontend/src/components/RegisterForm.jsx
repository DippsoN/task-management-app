import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import authService from '../services/authService';
import './RegisterForm.css';

const RegisterForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  const password = watch('password');

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await authService.register(data);
      
      if (response.success) {
        toast.success('Konto zostało utworzone pomyślnie! Sprawdź email aby zweryfikować konto.');
        navigate('/login', { 
          state: { 
            message: 'Rejestracja przebiegła pomyślnie. Możesz się teraz zalogować.' 
          }
        });
      }
    } catch (error) {
      console.error('Błąd rejestracji:', error);
      
      if (error.response?.data?.errors) {
        // Obsługa błędów walidacji z serwera
        error.response.data.errors.forEach(err => {
          toast.error(err.msg);
        });
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Wystąpił błąd podczas rejestracji. Spróbuj ponownie.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const passwordValidation = {
    required: 'Hasło jest wymagane',
    minLength: {
      value: 6,
      message: 'Hasło musi mieć co najmniej 6 znaków'
    },
    pattern: {
      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      message: 'Hasło musi zawierać co najmniej jedną małą literę, jedną wielką literę i jedną cyfrę'
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h2>Załóż konto</h2>
          <p>Rozpocznij zarządzanie swoimi zadaniami już dziś</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="register-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">Imię</label>
              <div className="input-wrapper">
                <FaUser className="input-icon" />
                <input
                  type="text"
                  id="firstName"
                  {...register('firstName', {
                    required: 'Imię jest wymagane',
                    minLength: {
                      value: 2,
                      message: 'Imię musi mieć co najmniej 2 znaki'
                    },
                    maxLength: {
                      value: 50,
                      message: 'Imię nie może mieć więcej niż 50 znaków'
                    },
                    pattern: {
                      value: /^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s]+$/,
                      message: 'Imię może zawierać tylko litery'
                    }
                  })}
                  placeholder="Wprowadź swoje imię"
                  className={errors.firstName ? 'error' : ''}
                />
              </div>
              {errors.firstName && (
                <span className="error-message">{errors.firstName.message}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Nazwisko</label>
              <div className="input-wrapper">
                <FaUser className="input-icon" />
                <input
                  type="text"
                  id="lastName"
                  {...register('lastName', {
                    required: 'Nazwisko jest wymagane',
                    minLength: {
                      value: 2,
                      message: 'Nazwisko musi mieć co najmniej 2 znaki'
                    },
                    maxLength: {
                      value: 50,
                      message: 'Nazwisko nie może mieć więcej niż 50 znaków'
                    },
                    pattern: {
                      value: /^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s]+$/,
                      message: 'Nazwisko może zawierać tylko litery'
                    }
                  })}
                  placeholder="Wprowadź swoje nazwisko"
                  className={errors.lastName ? 'error' : ''}
                />
              </div>
              {errors.lastName && (
                <span className="error-message">{errors.lastName.message}</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Adres email</label>
            <div className="input-wrapper">
              <FaEnvelope className="input-icon" />
              <input
                type="email"
                id="email"
                {...register('email', {
                  required: 'Adres email jest wymagany',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Podaj prawidłowy adres email'
                  }
                })}
                placeholder="twoj@email.com"
                className={errors.email ? 'error' : ''}
              />
            </div>
            {errors.email && (
              <span className="error-message">{errors.email.message}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Hasło</label>
            <div className="input-wrapper">
              <FaLock className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                {...register('password', passwordValidation)}
                placeholder="Wprowadź hasło"
                className={errors.password ? 'error' : ''}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Pokaż/ukryj hasło"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.password && (
              <span className="error-message">{errors.password.message}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Potwierdź hasło</label>
            <div className="input-wrapper">
              <FaLock className="input-icon" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                {...register('confirmPassword', {
                  required: 'Potwierdzenie hasła jest wymagane',
                  validate: value =>
                    value === password || 'Hasła nie są identyczne'
                })}
                placeholder="Potwierdź hasło"
                className={errors.confirmPassword ? 'error' : ''}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label="Pokaż/ukryj potwierdzenie hasła"
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="error-message">{errors.confirmPassword.message}</span>
            )}
          </div>

          <button
            type="submit"
            className={`register-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading-spinner">Tworzenie konta...</span>
            ) : (
              'Załóż konto'
            )}
          </button>
        </form>

        <div className="register-footer">
          <p>
            Masz już konto?{' '}
            <Link to="/login" className="login-link">
              Zaloguj się
            </Link>
          </p>
        </div>
      </div>

      <div className="register-info">
        <h3>Dlaczego warto się zarejestrować?</h3>
        <ul>
          <li>📝 Twórz i zarządzaj zadaniami</li>
          <li>📊 Śledź postępy w projektach</li>
          <li>🔔 Otrzymuj powiadomienia o deadlinach</li>
          <li>👥 Współpracuj z zespołem</li>
          <li>📈 Analizuj swoją produktywność</li>
        </ul>
      </div>
    </div>
  );
};

export default RegisterForm;