from datetime import date

from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from apps.roles.models import Role
from apps.users.models import User
from apps.cotisations.models import Cotisation


class CotisationViewSetPermissionsTests(TestCase):
    """
    - Un servant ne voit que SES propres cotisations.
    - Seul le Trésorier (ou Admin) peut enregistrer un paiement pour quelqu'un d'autre.
    """

    @classmethod
    def setUpTestData(cls):
        cls.role_servant, _ = Role.objects.get_or_create(code='SERVANT', defaults={'libelle': 'Servant'})
        cls.role_tresorier, _ = Role.objects.get_or_create(code='TRESORIER', defaults={'libelle': 'Trésorier'})

        cls.servant_a = cls._make_user('SRV-A', cls.role_servant)
        cls.servant_b = cls._make_user('SRV-B', cls.role_servant)
        cls.tresorier = cls._make_user('SRV-T', cls.role_tresorier)

        cls.cotisation_de_a = Cotisation.objects.create(
            servant=cls.servant_a, annee=2026, mois=8, numero_semaine=1,
            date_debut_semaine=date(2026, 8, 3),
        )

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

    def test_servant_ne_voit_pas_les_cotisations_dautrui(self):
        response = self._client_for(self.servant_b).get('/api/cotisations/')
        resultats = response.data.get('results', response.data)
        self.assertEqual(len(resultats), 0)

    def test_servant_ne_peut_pas_enregistrer_un_paiement(self):
        payload = {
            'servant': self.servant_b.id, 'annee': 2026, 'mois': 8,
            'numero_semaine': 1, 'date_debut_semaine': '2026-08-03',
            'statut': Cotisation.Statut.PAYE,
        }
        response = self._client_for(self.servant_a).post('/api/cotisations/', payload)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_tresorier_peut_enregistrer_un_paiement(self):
        payload = {
            'servant': self.servant_b.id, 'annee': 2026, 'mois': 8,
            'numero_semaine': 1, 'date_debut_semaine': '2026-08-03',
            'statut': Cotisation.Statut.PAYE,
        }
        response = self._client_for(self.tresorier).post('/api/cotisations/', payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)