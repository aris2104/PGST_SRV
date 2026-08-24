# utils/permissions.py
from datetime import date, timedelta
from rest_framework.permissions import BasePermission

# Le Super Admin a AU MOINS tous les droits de l'Admin (et davantage,
# géré au cas par cas — ex: gérer/révoquer les comptes Admin eux-mêmes,
# voir apps/users/views.py). Point unique : n'importe quel appel qui
# vérifie 'ADMIN' doit aussi laisser passer 'SUPER_ADMIN', sans avoir à
# le répéter à chaque appel de _has_role dans tout le projet.
def _has_role(user, *codes):
    if not (user and user.is_authenticated):
        return False
    if user.is_staff:
        return True
    role_code = user.role.code if user.role_id else None
    codes_effectifs = set(codes)
    if 'ADMIN' in codes_effectifs:
        codes_effectifs.add('SUPER_ADMIN')
    return role_code in codes_effectifs

def is_admin_user(user):
    return _has_role(user, 'ADMIN')

def is_super_admin_user(user):
    return bool(user and user.is_authenticated and (user.is_superuser or (user.role_id and user.role.code == 'SUPER_ADMIN')))

# Nombre de jours pendant lesquels une donnée liée à une réunion (appel,
# programme de messe) reste modifiable après la date de cette réunion.
# Jour de la réunion = jour 1 ; modifiable jusqu'au jour 7 inclus ;
# verrouillé à partir du jour 8 (voir demande : "une semaine pour le faire").
FENETRE_MODIFICATION_JOURS = 7

def dans_la_fenetre_de_modification(date_reference, user=None, autoriser_futur=False):
    """
    True si `date_reference` est encore dans la fenêtre de modification.
    L'Admin n'est jamais soumis à cette fenêtre (il coordonne tout et peut
    corriger une erreur ancienne).

    autoriser_futur=False (par défaut, ex: appel/présence) : la date de
    référence ne doit pas être dans le futur — on ne peut pas renseigner
    une présence avant que la réunion ait eu lieu.

    autoriser_futur=True (ex: programme de messe) : le programme se
    prépare À L'AVANCE (toute la semaine peut être planifiée avant
    qu'elle n'arrive), donc les dates futures sont autorisées. Seule la
    limite "plus de 7 jours dans le passé" reste bloquante dans les deux
    cas.
    """
    if user is not None and is_admin_user(user):
        return True
    if date_reference is None:
        return True
    if hasattr(date_reference, 'date'):
        date_reference = date_reference.date()
    if not autoriser_futur and date_reference > date.today():
        return False
    return (date.today() - date_reference) <= timedelta(days=FENETRE_MODIFICATION_JOURS)

def message_hors_fenetre(date_reference, autoriser_futur=False):
    """
    Message d'erreur adapté au motif du blocage : réunion future
    (pas encore arrivée, seulement pertinent quand autoriser_futur=False)
    vs date trop ancienne (> 7 jours, dans les deux cas).
    """
    if not autoriser_futur and date_reference is not None:
        if hasattr(date_reference, 'date'):
            date_reference = date_reference.date()
        if date_reference > date.today():
            return (
                "Cette réunion n'a pas encore eu lieu : il n'est pas "
                "possible de faire l'appel ou de renseigner les présences "
                "avant la date prévue."
            )
    return (
        "Cette date remonte à plus de 7 jours : il n'est plus possible d'y "
        "toucher. Seul un administrateur peut encore corriger."
    )


class IsPresiOrSecretary(BasePermission):
    """Président ou Secrétaire : gestion de l'appel, publication d'annonces."""
    def has_permission(self, request, view):
        return _has_role(request.user, 'PRESIDENT', 'SECRETAIRE', 'ADMIN' , 'SUPER_ADMIN')

class IsPresiOrCeremoniaire(BasePermission):
    """
    Choix des servants pour le programme de messe : décentralisé entre
    Président, Secrétaire et Cérémoniaire (qui gère normalement ce volet),
    et ouvert au Conseiller (accès quasi-total, comme convenu).
    Nom de classe conservé pour ne pas casser les imports existants.
    """
    def has_permission(self, request, view):
        return _has_role(request.user, 'PRESIDENT', 'SECRETAIRE', 'CEREMONIAIRE', 'CONSEILLER', 'ADMIN' , 'SUPER_ADMIN')

class IsTreasurer(BasePermission):
    """Trésorier : gestion de la caisse / cotisations."""
    def has_permission(self, request, view):
        return _has_role(request.user, 'TRESORIER', 'ADMIN' , 'SUPER_ADMIN')

class IsDisciplinaireOrCeremoniaire(BasePermission):
    """
    Gestion des sanctions : décentralisé au Président, Secrétaire, Cérémoniaire
    (ce dernier gère la discipline en plus du "côté messe") et Conseiller,
    en plus du rôle Disciplinaire lui-même.
    """
    def has_permission(self, request, view):
        return _has_role(
            request.user,
            'DISCIPLINAIRE', 'CEREMONIAIRE', 'PRESIDENT', 'SECRETAIRE', 'CONSEILLER', 'ADMIN', 'SUPER_ADMIN'
        )

class IsOrganisateur(BasePermission):
    """Organisateur : gestion du programme / ordre du jour."""
    def has_permission(self, request, view):
        return _has_role(request.user, 'ORGANISATEUR', 'ADMIN' , 'SUPER_ADMIN')

class IsAdmin(BasePermission):
    """Administrateur global de la plateforme."""
    def has_permission(self, request, view):
        return _has_role(request.user, 'ADMIN' , 'SUPER_ADMIN')

class CanBrowseMembers(BasePermission):
    """
    Tout rôle "responsable" peut consulter la liste/le détail des membres.
    Le Conseiller voit tout comme les autres (sauf les logs, gérés à part).
    """
    def has_permission(self, request, view):
        return _has_role(
            request.user,
            'PRESIDENT', 'SECRETAIRE', 'TRESORIER', 'DISCIPLINAIRE',
            'ORGANISATEUR', 'CEREMONIAIRE', 'CONSEILLER', 'ADMIN' , 'SUPER_ADMIN'
        )