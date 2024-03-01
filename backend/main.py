from fastapi import FastAPI

from tasks import import_job

app = FastAPI()

@app.post("/import-job")
async def trigger_import_job(url: str):
    #import_job.delay(url)
    return {"message": "Import job triggered successfully"}