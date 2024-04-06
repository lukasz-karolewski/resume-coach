from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from langserve import add_routes
from pirate_speak.chain import chain as pirate_speak_chain
from import_job.chain import chain as import_job_chain


app = FastAPI()

@app.get("/")
async def redirect_root_to_docs():
    return RedirectResponse("/docs")


# Routes
add_routes(app, pirate_speak_chain, path="/pirate-speak")
add_routes(app, import_job_chain, path="/import-job")

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
