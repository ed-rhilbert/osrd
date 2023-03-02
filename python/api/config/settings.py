"""
Django settings for osrd project.

Generated by 'django-admin startproject' using Django 3.1.6.

For more information on this file, see
https://docs.djangoproject.com/en/3.1/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/3.1/ref/settings/
"""
from importlib.util import find_spec
from os import getenv
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


def getenv_bool(var_name, default=False):
    env_var = getenv(var_name, "")
    if not env_var:
        return default
    return env_var.lower() in ("1", "true")


def getenv_list(varname):
    val = getenv(varname)
    if not val:
        return []
    return val.split(",")


OSRD_DEV = getenv_bool("OSRD_DEV")
OSRD_DEBUG = getenv_bool("OSRD_DEBUG", default=OSRD_DEV)
OSRD_DEBUG_TOOLBAR = getenv_bool("OSRD_DEBUG_TOOLBAR", default=False)
OSRD_SKIP_AUTH = getenv_bool("OSRD_SKIP_AUTH", default=OSRD_DEBUG)
OSRD_ROOT_PATH = getenv("OSRD_ROOT_PATH", "")

# is requests are fed through a reverse proxy, the name of the header which
# contains the protocol needs to be configured for CSRF to work
PROXY_PROTO_HEADER = getenv("PROXY_PROTO_HEADER")

OSRD_API_URL = getenv("OSRD_API_URL", default="http://localhost:8000")
OSRD_BACKEND_URL = getenv("OSRD_BACKEND_URL", default="http://localhost:8080")
OSRD_BACKEND_TOKEN = getenv("OSRD_BACKEND_TOKEN", "")

POSTGRES_DB = getenv("POSTGRES_DB", "osrd")
POSTGRES_USER = getenv("POSTGRES_USER", "osrd")
POSTGRES_PASSWORD = getenv("POSTGRES_PASSWORD", "password")
POSTGRES_HOST = getenv("POSTGRES_HOST", "localhost")

REDIS_CACHE_URI = getenv("REDIS_CACHE_URI")


SENTRY_DSN = getenv("SENTRY_DSN")
SENTRY_REALM = getenv("SENTRY_REALM")


if PROXY_PROTO_HEADER is not None:
    SECURE_PROXY_SSL_HEADER = (PROXY_PROTO_HEADER, "https")


RAILJSON_SRID = 4326
MAPBOX_SRID = 3857


# Application definition

INSTALLED_APPS = [
    # django
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.gis",
    # vendor
    "rest_framework",
    "rest_framework_gis",
    # osrd apps
    "osrd_infra.apps.OsrdInfraConfig",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "config.request_logger.RequestLogger",
]

REST_FRAMEWORK = {
    "DATETIME_FORMAT": "%Y-%m-%d %H:%M:%S.%f",
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 100,
}

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# A postgis database is required
DATABASES = {
    "default": {
        "ENGINE": "django.contrib.gis.db.backends.postgis",
        "NAME": POSTGRES_DB,
        "USER": POSTGRES_USER,
        "PASSWORD": POSTGRES_PASSWORD,
        "HOST": POSTGRES_HOST,
        "TEST": {"TEMPLATE": "template_osrd"},
    },
}


# Setup redis
CACHES = {}
if REDIS_CACHE_URI is not None:
    CACHES["default"] = {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": REDIS_CACHE_URI,
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        },
    }
else:
    CACHES["default"] = {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "osrd-api",
    }

# Password validation
# https://docs.djangoproject.com/en/3.1/ref/settings/#auth-password-validators

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
# https://docs.djangoproject.com/en/3.1/topics/i18n/

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/3.1/howto/static-files/

ROOT_PATH = OSRD_ROOT_PATH

STATIC_URL = "/static/"

APPEND_SLASH = False


if not OSRD_DEV:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")


if OSRD_DEV:
    ALLOWED_HOSTS = ["*"]
    INTERNAL_IPS = ["127.0.0.1"]
    INSTALLED_APPS.append("corsheaders")
    MIDDLEWARE.append("corsheaders.middleware.CorsMiddleware")
    CORS_ALLOW_ALL_ORIGINS = True
else:
    ALLOWED_HOSTS = getenv_list("ALLOWED_HOSTS")


# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = OSRD_DEBUG

SECRET_KEY = getenv("SECRET_KEY")

if SECRET_KEY is None:
    if not OSRD_DEV:
        raise RuntimeError("Missing SECRET_KEY")
    SECRET_KEY = "BeZPeRmxngJAbJECmraxvpvLQebOYPNACjqGwujizGcIGHuEIz"


# enable django debug toolbar if it is installed
if OSRD_DEBUG_TOOLBAR and find_spec("debug_toolbar") is not None:
    INSTALLED_APPS += ["debug_toolbar"]
    MIDDLEWARE += ["debug_toolbar.middleware.DebugToolbarMiddleware"]
    DEBUG_TOOLBAR_PANELS = [
        "debug_toolbar.panels.history.HistoryPanel",
        "debug_toolbar.panels.versions.VersionsPanel",
        "debug_toolbar.panels.timer.TimerPanel",
        "debug_toolbar.panels.settings.SettingsPanel",
        "debug_toolbar.panels.headers.HeadersPanel",
        "debug_toolbar.panels.request.RequestPanel",
        "debug_toolbar.panels.sql.SQLPanel",
        "debug_toolbar.panels.staticfiles.StaticFilesPanel",
        "debug_toolbar.panels.templates.TemplatesPanel",
        "debug_toolbar.panels.cache.CachePanel",
        "debug_toolbar.panels.signals.SignalsPanel",
        "debug_toolbar.panels.logging.LoggingPanel",
        "debug_toolbar.panels.redirects.RedirectsPanel",
        "debug_toolbar.panels.profiling.ProfilingPanel",
    ]

if OSRD_SKIP_AUTH:
    MIDDLEWARE += ["config.middleware.LocalUserMiddleware"]
    REST_FRAMEWORK["DEFAULT_AUTHENTICATION_CLASSES"] = ["config.middleware.TestGatewayAuth"]
else:
    MIDDLEWARE += ["config.middleware.GatewayUserMiddleware"]
    REST_FRAMEWORK["DEFAULT_AUTHENTICATION_CLASSES"] = ["config.middleware.GatewayAuth"]

logging_handlers = {}
for handler in getenv_list("LOGGERS"):
    handler_name = handler
    handler_level = "DEBUG"

    split_handler = handler.split(":")
    if len(split_handler) == 2:
        handler_name, handler_level = split_handler
    logging_handlers[handler_name] = {
        "level": handler_level.upper(),
        "handlers": ["console"],
    }


LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "console": {
            "format": "{asctime} {levelname} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "level": "DEBUG",
            "class": "logging.StreamHandler",
            "formatter": "console",
        }
    },
    "loggers": logging_handlers,
}


if SENTRY_DSN is not None:
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration

    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[DjangoIntegration()],
        traces_sample_rate=0.0,
        send_default_pii=True,
        environment=SENTRY_REALM,
    )