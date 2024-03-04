from celery import Celery
from dotenv import load_dotenv

load_dotenv()  # take environment variables from .env.

celery_app = Celery("coach")
celery_app.config_from_object("celery_app.config", namespace="CELERY")
celery_app.autodiscover_tasks(["celery_app.tasks"])
