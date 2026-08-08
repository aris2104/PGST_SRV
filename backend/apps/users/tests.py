from datetime import date

from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from apps.roles.models import Role
from apps.users.models import User


class UserViewSetPermissionsTests(TestCase):
    """
    Vérifie que /api/users/ (liste des membres) respecte bien la matrice de rôles :
    - un Servant simple ne peut pas voir la liste
    - un rôle "responsable" (Trésorier, Disciplinaire...) peut la lire
    - seuls Président/Secrétaire/Admin peuvent créer un membre
    """

    @classmethod
    def setUpTestData(cls):
        cls.role_servant, _ = Role.objects.get_or_create(code='SERVANT', defaults={'libelle': 'Servant'})
        cls.role_tresorier, _ = Role.objects.get_or_create(code='TRESORIER', defaults={'libelle': 'Trésorier'})
        cls.role_disciplinaire, _ = Role.objects.get_or_create(code='DISCIPLINAIRE', defaults={'libelle': 'Disciplinaire'})
        cls.role_president, _ = Role.objects.get_or_create(code='PRESIDENT', defaults={'libelle': 'Président'})

        cls.servant = cls._make_user('SRV-001', cls.role_servant)
        cls.tresorier = cls._make_user('SRV-002', cls.role_tresorier)
        cls.disciplinaire = cls._make_user('SRV-003', cls.role_disciplinaire)
        cls.president = cls._make_user('SRV-004', cls.role_president)

    @staticmethod
    def _make_user(matricule, role):
        return User.objects.create_user(
            matricule=matricule,
            password='motdepasse123',
            nom='Test',
            prenom='User',
            membre_depuis=date(2024, 1, 1),
            role=role,
        )

    def _client_for(self, user):
        client = APIClient()
        client.force_authenticate(user=user)
        return client

    # --- Lecture (list) ---

    def test_servant_ne_peut_pas_lister_les_membres(self):
        response = self._client_for(self.servant).get('/api/users/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_tresorier_peut_lister_les_membres(self):
        response = self._client_for(self.tresorier).get('/api/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_disciplinaire_peut_lister_les_membres(self):
        response = self._client_for(self.disciplinaire).get('/api/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_anonyme_ne_peut_pas_lister_les_membres(self):
        response = APIClient().get('/api/users/')
        self.assertIn(response.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))

    # --- Écriture (create) ---

    def test_servant_ne_peut_pas_creer_un_membre(self):
        payload = {
            'matricule': 'SRV-999', 'nom': 'Nouveau', 'prenom': 'Membre',
            'membre_depuis': '2026-01-01', 'password': 'abcd1234',
        }
        response = self._client_for(self.servant).post('/api/users/', payload)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_tresorier_ne_peut_pas_creer_un_membre(self):
        """Le Trésorier peut LIRE la liste (pour ses formulaires) mais pas gérer le groupe."""
        payload = {
            'matricule': 'SRV-998', 'nom': 'Nouveau', 'prenom': 'Membre',
            'membre_depuis': '2026-01-01', 'password': 'abcd1234',
        }
        response = self._client_for(self.tresorier).post('/api/users/', payload)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_president_peut_creer_un_membre(self):
        payload = {
            'matricule': 'SRV-997', 'nom': 'Nouveau', 'prenom': 'Membre',
            'membre_depuis': '2026-01-01', 'password': 'abcd1234',
        }
        response = self._client_for(self.president).post('/api/users/', payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)