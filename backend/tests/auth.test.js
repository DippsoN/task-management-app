const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');

// Ustawienia testowe
const testDatabase = 'mongodb://localhost:27017/task-management-test';

describe('Auth Routes', () => {
  beforeAll(async () => {
    // Połącz z testową bazą danych
    await mongoose.connect(testDatabase, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  beforeEach(async () => {
    // Wyczyść bazę danych przed każdym testem
    await User.deleteMany({});
  });

  afterAll(async () => {
    // Zamknij połączenie z bazą danych
    await mongoose.connection.close();
  });

  describe('POST /api/auth/register', () => {
    const validUserData = {
      firstName: 'Jan',
      lastName: 'Kowalski',
      email: 'jan.kowalski@example.com',
      password: 'Test123!',
      confirmPassword: 'Test123!'
    };

    it('powinien zarejestrować nowego użytkownika z prawidłowymi danymi', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Użytkownik został pomyślnie zarejestrowany');
      expect(response.body.data.user).toMatchObject({
        firstName: 'Jan',
        lastName: 'Kowalski',
        email: 'jan.kowalski@example.com',
        role: 'user',
        isActive: true,
        emailVerified: false
      });
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('nie powinien zarejestrować użytkownika z nieprawidłowym emailem', async () => {
      const invalidEmailData = {
        ...validUserData,
        email: 'nieprawidlowy-email'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidEmailData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Błędy walidacji');
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          msg: 'Podaj prawidłowy adres email'
        })
      );
    });

    it('nie powinien zarejestrować użytkownika z za krótkim hasłem', async () => {
      const shortPasswordData = {
        ...validUserData,
        password: '123',
        confirmPassword: '123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(shortPasswordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          msg: 'Hasło musi mieć co najmniej 6 znaków'
        })
      );
    });

    it('nie powinien zarejestrować użytkownika z hasłem bez wymaganych znaków', async () => {
      const weakPasswordData = {
        ...validUserData,
        password: 'slabe haslo',
        confirmPassword: 'slabe haslo'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(weakPasswordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          msg: 'Hasło musi zawierać co najmniej jedną małą literę, jedną wielką literę i jedną cyfrę'
        })
      );
    });

    it('nie powinien zarejestrować użytkownika z niezgodnymi hasłami', async () => {
      const mismatchPasswordData = {
        ...validUserData,
        confirmPassword: 'InneHaslo123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(mismatchPasswordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          msg: 'Hasła nie są identyczne'
        })
      );
    });

    it('nie powinien zarejestrować użytkownika z istniejącym emailem', async () => {
      // Pierwszy użytkownik
      await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(201);

      // Próba rejestracji z tym samym emailem
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Użytkownik z tym adresem email już istnieje');
    });

    it('nie powinien zarejestrować użytkownika z nieprawidłowym imieniem', async () => {
      const invalidNameData = {
        ...validUserData,
        firstName: 'Jan123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidNameData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          msg: 'Imię może zawierać tylko litery'
        })
      );
    });
  });

  describe('POST /api/auth/login', () => {
    const userData = {
      firstName: 'Anna',
      lastName: 'Nowak',
      email: 'anna.nowak@example.com',
      password: 'Test123!',
      confirmPassword: 'Test123!'
    };

    beforeEach(async () => {
      // Zarejestruj użytkownika przed każdym testem logowania
      await request(app)
        .post('/api/auth/register')
        .send(userData);
    });

    it('powinien zalogować użytkownika z prawidłowymi danymi', async () => {
      const loginData = {
        email: userData.email,
        password: userData.password
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Pomyślnie zalogowano');
      expect(response.body.data.user).toMatchObject({
        firstName: 'Anna',
        lastName: 'Nowak',
        email: 'anna.nowak@example.com'
      });
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.lastLogin).toBeDefined();
    });

    it('nie powinien zalogować użytkownika z nieprawidłowym hasłem', async () => {
      const loginData = {
        email: userData.email,
        password: 'NieprawidloweHaslo123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Nieprawidłowy email lub hasło');
    });

    it('nie powinien zalogować użytkownika z nieistniejącym emailem', async () => {
      const loginData = {
        email: 'nieistniejacy@example.com',
        password: userData.password
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Nieprawidłowy email lub hasło');
    });

    it('nie powinien zalogować użytkownika z nieprawidłowym formatem emaila', async () => {
      const loginData = {
        email: 'nieprawidlowy-email',
        password: userData.password
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Błędy walidacji');
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken;
    let userId;

    beforeEach(async () => {
      // Zarejestruj użytkownika i pobierz token
      const userData = {
        firstName: 'Piotr',
        lastName: 'Wiśniewski',
        email: 'piotr.wisniewski@example.com',
        password: 'Test123!',
        confirmPassword: 'Test123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      authToken = response.body.data.token;
      userId = response.body.data.user.id;
    });

    it('powinien zwrócić dane zalogowanego użytkownika', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        id: userId,
        firstName: 'Piotr',
        lastName: 'Wiśniewski',
        email: 'piotr.wisniewski@example.com'
      });
    });

    it('nie powinien zwrócić danych bez tokenu autoryzacji', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Brak tokenu autoryzacji, dostęp zabroniony');
    });

    it('nie powinien zwrócić danych z nieprawidłowym tokenem', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer nieprawidlowy-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Token jest nieprawidłowy');
    });
  });
});