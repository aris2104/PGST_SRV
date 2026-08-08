from datetime import date

from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from apps.roles.models import Role
from apps.users.models import User
from apps.sanctions.models import Sanction


class SanctionViewSetPermissionsTests(TestCase):
    """
    - Un servant ne voit que SES propres sanctions, jamais celles des autres.
    - Seul le Disciplinaire (ou Admin) peut en infliger une.
    """

    @classmethod
    def setUpTestData(cls):
        cls.role_servant, _ = Role.objects.get_or_create(code='SERVANT', defaults={'libelle': 'Servant'})
        cls.role_disciplinaire, _ = Role.objects.get_or_create(code='DISCIPLINAIRE', defaults={'libelle': 'Disciplinaire'})

        cls.servant_a = cls._make_user('SRV-A', cls.role_servant)
        cls.servant_b = cls._make_user('SRV-B', cls.role_servant)
        cls.disciplinaire = cls._make_user('SRV-D', cls.role_disciplinaire)

        cls.sanction_de_a = Sanction.objects.create(
            servant=cls.servant_a,
            type_sanction=Sanction.TypeSanction.AVERTISSEMENT,
            motif='Retard répété',
            date_decision=date(2026, 1, 1),
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

    def test_servant_ne_voit_que_ses_propres_sanctions(self):
        response = self._client_for(self.servant_b).get('/api/sanctions/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        resultats = response.data.get('results', response.data)
        self.assertEqual(len(resultats), 0)  # servant_b n'a aucune sanction

    def test_servant_voit_bien_sa_propre_sanction(self):
        response = self._client_for(self.servant_a).get('/api/sanctions/')
        resultats = response.data.get('results', response.data)
        self.assertEqual(len(resultats), 1)

    def test_servant_ne_peut_pas_infliger_une_sanction(self):
        payload = {
            'servant': self.servant_b.id,
            'type_sanction': Sanction.TypeSanction.AMENDE,
            'motif': 'Test',
            'date_decision': '2026-02-01',
        }
        response = self._client_for(self.servant_a).post('/api/sanctions/', payload)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_disciplinaire_peut_infliger_une_sanction(self):
        payload = {
            'servant': self.servant_b.id,
            'type_sanction': Sanction.TypeSanction.AMENDE,
            'motif': 'Test',
            'date_decision': '2026-02-01',
        }
        response = self._client_for(self.disciplinaire).post('/api/sanctions/', payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        nouvelle_sanction = Sanction.objects.get(servant=self.servant_b)
        self.assertEqual(nouvelle_sanction.decidee_par_id, self.disciplinaire.id)