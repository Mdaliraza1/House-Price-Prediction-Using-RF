
from pathlib import Path
import configparser
import os

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load settings from settings.ini
config = configparser.ConfigParser()
settings_ini_path = BASE_DIR / 'settings.ini'

# Read settings.ini if it exists, otherwise use defaults
if settings_ini_path.exists():
    config.read(settings_ini_path)
    # Determine environment from DEFAULT section
    env_value = config.get('DEFAULT', 'ENVIRONMENT', fallback='development')
    if env_value == 'production':
        ENV = 'PRODUCTION'
    elif env_value == 'staging':
        ENV = 'STAGING'
    else:
        ENV = 'DEFAULT'
else:
    ENV = 'DEFAULT'
    # Don't add DEFAULT section - it's special in ConfigParser

# Get settings with fallback to defaults
def get_setting(section, key, default=None, fallback_section='DEFAULT'):
    """Get setting from config file with fallback"""
    if config.has_option(section, key):
        value = config.get(section, key)
        # Handle boolean values
        if value.lower() in ('true', 'false'):
            return config.getboolean(section, key)
        # Handle list values (comma-separated)
        if ',' in value:
            return [item.strip() for item in value.split(',')]
        return value
    elif fallback_section and config.has_option(fallback_section, key):
        value = config.get(fallback_section, key)
        if value.lower() in ('true', 'false'):
            return config.getboolean(fallback_section, key)
        if ',' in value:
            return [item.strip() for item in value.split(',')]
        return value
    return default

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = get_setting(ENV, 'SECRET_KEY', 
    default=os.environ.get('SECRET_KEY'))

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = get_setting(ENV, 'DEBUG', default=True)

# Allowed hosts
ALLOWED_HOSTS = get_setting(ENV, 'ALLOWED_HOSTS', default=['*'])
if isinstance(ALLOWED_HOSTS, str):
    ALLOWED_HOSTS = [ALLOWED_HOSTS]


# Application definition

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "portfolio",
    "price_prediction",
    "rest_framework",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "House_Price_Prediction.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                 'django.template.context_processors.settings',
            ],
        },
    },
]

WSGI_APPLICATION = "House_Price_Prediction.wsgi.application"


# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}


# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [
    BASE_DIR / "static",
]

# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Google Maps API Key
GOOGLE_MAPS_API_KEY = get_setting(ENV, 'GOOGLE_MAPS_API_KEY', 
    default=os.environ.get('GOOGLE_MAPS_API_KEY', ''))