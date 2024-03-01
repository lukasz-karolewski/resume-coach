from celery import Celery
from llm.import_job import extractJobDetails


celery_app = Celery("tasks", broker="redis://localhost:6379/0")

@celery_app.task
def import_job(url):
    return extractJobDetails(url)
    
