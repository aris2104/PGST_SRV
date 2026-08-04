# PGST — Plateforme de Gestion des Servants

Application de gestion des servants (rôles, cotisations, sanctions, calendrier des messes, annonces).

## Stack

| Couche              | Techno                                   |
|---------------------|-------------------------------------------|
| Frontend            | React + Vite + Tailwind                   |
| Backend             | Django + Django REST Framework            |
| Base de données     | PostgreSQL (via Django ORM)               |
| Authentification    | JWT (djangorestframework-simplejwt)       |
| Hébergement backend | Render ou Railway                         |
| Hébergement frontend| Vercel ou Netlify                         |

## Démarrage rapide

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # puis renseigner les identifiants PostgreSQL
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

L'API est servie sur `http://localhost:8000/api/`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

L'app est servie sur `http://localhost:5173`. Créer un fichier `frontend/.env` avec :

```
VITE_API_BASE_URL=http://localhost:8000/api
```

## Rôles

`PRESIDENT`, `SECRETAIRE`, `TRESORIER`, `DISCIPLINAIRE`, `ORGANISATEUR`, `ADMIN`, `SERVANT`
(voir `backend/apps/roles/models.py`).

## Pages front (mapping maquettes -> code)

| Maquette                          | Fichier                                              |
|-----------------------------------|-------------------------------------------------------|
| Bienvenu sur PGST                 | `src/pages/auth/WelcomePage.jsx`                      |
| Connexion (Identifiant/MdP)       | `src/pages/auth/LoginPage.jsx`                        |
| Annonces                          | `src/pages/home/HomePage.jsx`                         |
| Calendrier                        | `src/pages/calendar/CalendarPage.jsx`                 |
| Suivis                            | `src/pages/suivis/SuivisDashboard.jsx`                |
| Historique des sanctions          | `src/pages/suivis/SanctionHistoryPage.jsx`            |
| Ma cotisation                     | `src/pages/suivis/CotisationDetailPage.jsx`           |
| Paramètres                        | `src/pages/settings/SettingsPage.jsx`                 |
| Modifier mes infos                | `src/pages/settings/EditProfilePage.jsx`              |
| bienvenu {Rôle} (Presi & secre)   | `src/pages/roles-dashboards/PresiSecreDashboard.jsx`  |

## Prochaines étapes suggérées

- Brancher les endpoints admin (création de membre, gestion des rôles) sur `MemberAddModal`.
- Ajouter le modèle `Presence` (réunions) côté backend — actuellement affiché en dur dans `SuivisDashboard`.
- Ajouter les tests (pytest côté backend, Vitest côté frontend).
