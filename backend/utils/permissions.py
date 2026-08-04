from rest_framework.permissions import BasePermission


def _has_role(user, *codes):
    return bool(
        user and user.is_authenticated and
        (user.is_staff or (user.role_id and user.role.code in codes))
    )


class IsPresiOrSecretary(BasePermission):
    """Président ou Secrétaire : gestion du groupe, publication d'annonces."""
    def has_permission(self, request, view):
        return _has_role(request.user, 'PRESIDENT', 'SECRETAIRE', 'ADMIN')


class IsTreasurer(BasePermission):
    """Trésorier : gestion de la caisse / cotisations."""
    def has_permission(self, request, view):
        return _has_role(request.user, 'TRESORIER', 'ADMIN')


class IsDisciplinaire(BasePermission):
    """Responsable disciplinaire : gestion des sanctions."""
    def has_permission(self, request, view):
        return _has_role(request.user, 'DISCIPLINAIRE', 'ADMIN')


class IsOrganisateur(BasePermission):
    """Organisateur : gestion du programme / ordre du jour."""
    def has_permission(self, request, view):
        return _has_role(request.user, 'ORGANISATEUR', 'ADMIN')


class IsAdmin(BasePermission):
    """Administrateur global de la plateforme."""
    def has_permission(self, request, view):
        return _has_role(request.user, 'ADMIN')
