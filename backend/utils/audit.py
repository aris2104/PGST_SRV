
from apps.activite.models import JournalActivite


def get_client_ip(request):
    """
    Récupère l'adresse IP du client.

    En production, si PGST est derrière un proxy ou un reverse proxy,
    HTTP_X_FORWARDED_FOR peut contenir plusieurs adresses.
    """

    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')

    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()

    return request.META.get('REMOTE_ADDR')


def get_user_agent(request):
    """
    Récupère le navigateur / appareil utilisé par le client.
    """

    return request.META.get('HTTP_USER_AGENT', '') or ''


def enregistrer_activite(
    request,
    action,
    description,
    categorie='SYSTEM',
    resultat='SUCCESS',
    utilisateur=None,
    cible_type='',
    cible_id='',
    metadata=None,
):
    """
    Fonction centrale du système d'audit PGST.

    Toutes les actions importantes de l'application doivent
    idéalement passer par cette fonction.

    Exemple :

        enregistrer_activite(
            request=request,
            action='PROFILE_UPDATED',
            categorie='ACCOUNT',
            description='Un utilisateur a modifié son profil.',
        )
    """

    # Si aucun utilisateur n'est fourni explicitement,
    # on utilise automatiquement l'utilisateur connecté.
    if utilisateur is None:
        if request.user.is_authenticated:
            utilisateur = request.user

    return JournalActivite.objects.create(
        utilisateur=utilisateur,
        action=action,
        categorie=categorie,
        description=description,
        resultat=resultat,
        cible_type=cible_type,
        cible_id=str(cible_id) if cible_id else '',
        metadata=metadata or {},
        adresse_ip=get_client_ip(request),
        user_agent=get_user_agent(request),
    )
