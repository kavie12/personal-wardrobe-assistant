from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import wardrobe, recommendation, schedule, outfits, assistant

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(wardrobe.router, prefix="/api/v1/wardrobe")
app.include_router(recommendation.router, prefix="/api/v1/recommendation")
app.include_router(schedule.router, prefix="/api/v1/schedule")
app.include_router(outfits.router, prefix="/api/v1/outfits")
app.include_router(assistant.router, prefix="/api/v1/assistant")