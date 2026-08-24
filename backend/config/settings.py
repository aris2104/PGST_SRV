"""
Configuration Django du projet PGST (Plateforme de Gestion des Servants).
"""
from pathlib import Path
from datetime import timedelta
from decouple import config, Csv
from django.core.exceptions import ImproperlyConfigured

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY', default='dev-secret-key-a-changer')
DEBUG = config('DEBUG', default=True, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1', cast=Csv())
# À placer juste sous ALLOWED_HOSTS
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Un DEBUG=True en production serait la pire config possible (stack traces,
# secrets exposés...). On refuse de démarrer plutôt que de laisser passer
# cette combinaison par erreur.
if not DEBUG and SECRET_KEY == 'dev-secret-key-a-changer':
    raise ImproperlyConfigured(
        "SECRET_KEY doit être définie explicitement (variable d'environnement) "
        "dès que DEBUG=False. Ne jamais utiliser la valeur de développement en production."
    )

INSTALLED_APPS = [
    'django.contrib.admin',
    'apps.activite',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'apps.support',
    'apps.caisse',

    # Tiers
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',

    # Apps internes
    'apps.users',
    'apps.roles',
    'apps.sanctions',
    'apps.cotisations',
    'apps.calendrier',
    'apps.annonces',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# --- Base de données -------------------------------------------------------
# Fonctionne tel quel avec Postgres local (aucun changement de comportement)
# ET avec Supabase (qui est aussi du Postgres) : il suffit de changer les
# valeurs DB_* dans .env, aucune modification de code n'est nécessaire pour
# basculer de l'un à l'autre. Voir backend/.env.supabase.example.
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME', default='pgst_db'),
        'USER': config('DB_USER', default='postgres'),
        'PASSWORD': config('DB_PASSWORD', default=''),
        'HOST': config('DB_HOST', default='127.0.0.1'),
        'PORT': config('DB_PORT', default='5432'),
        'client_encoding': 'utf8',
        'CONN_MAX_AGE': config('DB_CONN_MAX_AGE', default=0, cast=int),
        'OPTIONS': {
            # 'prefer' : utilise le SSL s'il est proposé par le serveur
            # (obligatoire chez Supabase), sinon fonctionne sans (Postgres
            # local qui n'a pas de SSL configuré). Un seul réglage qui
            # marche pour les deux cas, sans rien à changer en local.
            'sslmode': config('DB_SSLMODE', default='prefer'),
        },
    }
}

# --- Utilisateur personnalisé -----------------------------------------------
AUTH_USER_MODEL = 'users.User'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# --- Internationalisation ----------------------------------------------------
LANGUAGE_CODE = 'fr-fr'
TIME_ZONE = 'Africa/Lome'
USE_I18N = True
USE_TZ = True

# --- Fichiers statiques / médias --------------------------------------------
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STORAGES = {
    'staticfiles': {'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage'},
}
MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# --- Django REST Framework ---------------------------------------------------
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_FILTER_BACKENDS': ('django_filters.rest_framework.DjangoFilterBackend',),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=14),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# --- CORS ---------------------------------------------------------------------
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
else:
    CORS_ALLOWED_ORIGINS = config(
        'CORS_ALLOWED_ORIGINS',
        default='http://localhost:5173',
        cast=Csv(),
    )

CORS_ALLOW_CREDENTIALS = True

# --- Web Push (VAPID) --------------------------------------------------------
VAPID_PUBLIC_KEY = config('VAPID_PUBLIC_KEY', default='')
VAPID_PRIVATE_KEY = config('VAPID_PRIVATE_KEY', default='')
VAPID_ADMIN_EMAIL = config(
    'VAPID_ADMIN_EMAIL',
    default='mailto:admin@pgst.com'
)