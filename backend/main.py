from celery_app.tasks import import_job
from dotenv import load_dotenv
from fastapi import FastAPI

load_dotenv()  # take environment variables from .env.
app = FastAPI()


@app.post("/import-job")
async def trigger_import_job(request_data: dict):
    url = request_data.get("url")
    import_job.delay(url)
    return {"message": f"Import job triggered successfully {url}"}
