# Task Management App

Aplikacja webowa do zarządzania zadaniami - projekt akademicki z pełną integracją Jira/GitHub workflow.

## 🚀 Opis Projektu

Aplikacja webowa umożliwiająca użytkownikom zarządzanie zadaniami z wykorzystaniem metodologii Scrum. Projekt realizowany jest z pełną integracją GitHub i Jira.

## 🛠️ Tech Stack

- **Frontend**: React 18.x, CSS3, HTML5
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Testing**: Jest, React Testing Library
- **Tools**: Git, GitHub, Jira

## 📋 Metodologia

- **Framework**: Scrum
- **Sprint Duration**: 2 tygodnie
- **Team**: 3 Developers + Product Owner + Scrum Master

## 🏗️ Struktura Projektu

```
task-management-app/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   ├── public/
│   └── package.json
├── backend/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   └── package.json
├── docs/
└── tests/
```

## 🚦 Branch Strategy

- `main` - produkcja
- `develop` - integracja
- `feature/JIRA-ID-description` - nowe funkcjonalności
- `hotfix/JIRA-ID-description` - poprawki produkcyjne

## 📝 Konwencje Commit

```
[JIRA-ID] Typ: Opis
```

Przykłady:
- `[PROJ-123] feat: Dodano komponent TaskList`
- `[PROJ-124] fix: Poprawka walidacji formularza`
- `[PROJ-125] refactor: Usprawnienie struktury API`

## 🎯 Backlog Produktu

### Epic 1: Zarządzanie użytkownikami
- Rejestracja użytkowników
- Logowanie
- Edycja profilu

### Epic 2: System zadań
- Tworzenie zadań
- Edycja zadań
- Usuwanie zadań

### Epic 3: Dashboard
- Widok główny
- Statystyki
- Filtry

## 🔄 Workflow Rozwoju

1. Przeniesienie zadania z Jira do "In Progress"
2. Utworzenie feature branch
3. Implementacja funkcjonalności
4. Testy jednostkowe
5. Commit z konwencją
6. Push i Pull Request
7. Code Review
8. Merge do develop
9. Aktualizacja statusu w Jira

## 📊 Sprint Goals

### Sprint 1 (Velocity: 21 points)
- Konfiguracja środowiska
- Podstawowa architektura
- System użytkowników

### Sprint 2 (Velocity: 25 points)
- CRUD zadań
- Walidacja danych
- Testy jednostkowe

## 🧪 Testowanie

```bash
# Frontend
npm test

# Backend
npm run test:backend

# E2E
npm run test:e2e
```

## 🚀 Deployment

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## 👥 Team

- **Product Owner**: Zarządzanie backlogiem
- **Scrum Master**: Facylitacja procesów
- **Developer 1**: Frontend specialist
- **Developer 2**: Backend specialist  
- **Developer 3**: Full-stack developer

## 📈 Metryki

- **Code Coverage**: >80%
- **Build Time**: <3 min
- **Test Execution**: <30s
- **Sprint Velocity**: 20-30 points

## 🔗 Linki

- [GitHub Repository](https://github.com/DippsoN/task-management-app)
- [Jira Project](https://your-domain.atlassian.net/browse/PROJ)
- [Documentation](./docs/)

---

*Projekt stworzony w celach akademickich - demonstracja best practices w zarządzaniu projektami Agile/Scrum.*