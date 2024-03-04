import logging
import os

from llm.import_job import extractJobDetails

from . import celery_app

logger = logging.getLogger(__name__)


@celery_app.task
def import_job(url):

    return extractJobDetails(url)
