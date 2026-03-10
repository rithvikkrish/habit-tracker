from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
GOOGLE_CLIENT_ID = "1041754056180-rqofs6e3oumsjn5jqmv7norc2bdfj82o.apps.googleusercontent.com"


# MODELS

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class GoogleAuthRequest(BaseModel):
    token: str


class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class TokenResponse(BaseModel):
    token: str
    user: User


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    category: str
    priority: str
    due_date: Optional[str] = None
    status: str = "todo"


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[str] = None
    status: Optional[str] = None


class Task(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    description: str = ""
    category: str
    priority: str
    due_date: Optional[str] = None
    status: str = "todo"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CategoryCreate(BaseModel):
    name: str
    color: str


class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    color: str
    is_default: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class DailyQuote(BaseModel):
    character: str
    quote: str
    image_url: str


# HELPERS

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def create_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=30)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload["user_id"]
    except:
        raise HTTPException(status_code=401, detail="Invalid token")


# QUOTES

CHARACTER_QUOTES = {
    "Billy Butcher": [
        "Oi! You got a job to do, so do it.",
        "Sometimes you gotta do bad things to stop worse things.",
        "Winners don't quit, and quitters don't win.",
        "You can't save everyone, but you can damn well try.",
        "Scorched earth, mate. That's the only way.",
        "Get busy living or get busy dying.",
        "Fear is just another obstacle to overcome.",
        "The world doesn't care about your excuses.",
        "Take the fight to them before they bring it to you.",
        "Every second counts. Don't waste them.",
        "Stand up for what's right, even if you stand alone.",
        "Pain is temporary, but giving up lasts forever.",
        "Sometimes the only way out is through the mess.",
        "Keep your enemies close and your plans closer.",
        "People respect strength, not excuses.",
        "You either fight back or get walked over.",
        "Every legend starts with someone refusing to quit.",
        "If you're scared, good. Means you know what's at stake.",
        "Stand your ground even when the world pushes back.",
        "Victory belongs to those who refuse to stay down."
    ],

    "Tyler Durden": [
        "It's only after we've lost everything that we're free to do anything.",
        "You're not your job.",
        "Stop trying to control everything.",
        "The things you own end up owning you.",
        "You have to know what you want.",
        "This is your life and it's ending one minute at a time.",
        "You are not special.",
        "Without pain, without sacrifice, we would have nothing.",
        "You decide your level of involvement.",
        "First you have to give up.",
        "Only after disaster can we be resurrected.",
        "The first step to eternal life is you have to die.",
        "Break things to understand them.",
        "Define yourself.",
        "Chaos brings clarity.",
        "Comfort kills growth.",
        "Stop waiting for permission.",
        "Freedom comes after fear.",
        "You are stronger than you think.",
        "Life begins when pretending ends."
    ],

    "Monkey D. Luffy": [
        "I'm gonna be King of the Pirates!",
        "If you don't take risks you can't create a future.",
        "Power comes from the size of your dreams.",
        "Never lose sight of your goal.",
        "Being alone hurts more than getting hurt.",
        "I've never regretted my decisions.",
        "The weak don't get to decide.",
        "I'm gonna make my dreams come true!",
        "Forgetting is like a wound.",
        "If you lose ambition you're done.",
        "If I die trying at least I tried.",
        "War means people die.",
        "A pirate never gives up.",
        "Keep moving forward.",
        "My crew is my treasure.",
        "Protect your friends.",
        "Dreams never die.",
        "Break the wall.",
        "Freedom matters.",
        "I'll reach the top."
    ]
}


CHARACTER_IMAGES = {
    "Billy Butcher": "https://customer-assets.emergentagent.com/job_todomaster-271/artifacts/butcher.jpeg",
    "Tyler Durden": "https://customer-assets.emergentagent.com/job_todomaster-271/artifacts/tyler.jpeg",
    "Monkey D. Luffy": "https://customer-assets.emergentagent.com/job_todomaster-271/artifacts/luffy.jpeg"
}


# AUTH

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):

    existing = await db.users.find_one({"email": user_data.email})

    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = hash_password(user_data.password)

    user_obj = User(email=user_data.email, name=user_data.name)

    doc = user_obj.model_dump()
    doc["password_hash"] = hashed
    doc["created_at"] = doc["created_at"].isoformat()

    await db.users.insert_one(doc)

    token = create_token(user_obj.id)

    return TokenResponse(token=token, user=user_obj)


@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):

    user_doc = await db.users.find_one({"email": credentials.email})

    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(credentials.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user_doc.pop("password_hash")

    user_doc["created_at"] = datetime.fromisoformat(user_doc["created_at"])

    user_obj = User(**user_doc)

    token = create_token(user_obj.id)

    return TokenResponse(token=token, user=user_obj)


# GOOGLE LOGIN

@api_router.post("/auth/google", response_model=TokenResponse)
async def google_login(data: GoogleAuthRequest):

    try:
        idinfo = id_token.verify_oauth2_token(
            data.token,
            google_requests.Request(),
            GOOGLE_CLIENT_ID
        )

        email = idinfo["email"]
        name = idinfo.get("name", "Google User")

    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    user_doc = await db.users.find_one({"email": email})

    if not user_doc:

        user_obj = User(email=email, name=name)

        doc = user_obj.model_dump()
        doc["created_at"] = doc["created_at"].isoformat()

        await db.users.insert_one(doc)

    else:
        user_doc["created_at"] = datetime.fromisoformat(user_doc["created_at"])
        user_obj = User(**user_doc)

    token = create_token(user_obj.id)

    return TokenResponse(token=token, user=user_obj)


# DAILY QUOTE

@api_router.get("/daily-quote", response_model=DailyQuote)
async def get_daily_quote():

    character = random.choice(list(CHARACTER_QUOTES.keys()))

    quote = random.choice(CHARACTER_QUOTES[character])

    return DailyQuote(
        character=character,
        quote=quote,
        image_url=CHARACTER_IMAGES.get(character, "")
    )


@api_router.get("/")
async def root():
    return {"message": "Task Manager API"}


app.include_router(api_router)


app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


logging.basicConfig(level=logging.INFO)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
