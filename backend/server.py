from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt

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

# Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

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

# Helper functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    payload = {
        'user_id': user_id,
        'exp': datetime.now(timezone.utc) + timedelta(days=30)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload['user_id']
    except:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

# Character quotes database
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
        "Pain is temporary, but giving up lasts forever."
    ],
    "Tyler Durden": [
        "It's only after we've lost everything that we're free to do anything.",
        "You're not your job. You're not how much money you have in the bank.",
        "Stop trying to control everything and just let go.",
        "The things you own end up owning you.",
        "You have to know the answer to this question: What do you want?",
        "Self-improvement is masturbation. Self-destruction is the answer.",
        "This is your life and it's ending one minute at a time.",
        "You are not special. You're not a beautiful and unique snowflake.",
        "It's only when you lose everything that you are free to do anything.",
        "Without pain, without sacrifice, we would have nothing.",
        "You decide your own level of involvement.",
        "First you have to give up. First you have to know, not fear, that someday you're going to die."
    ],
    "Monkey D. Luffy": [
        "I'm gonna be King of the Pirates!",
        "If you don't take risks, you can't create a future.",
        "Power isn't determined by your size, but by the size of your heart and dreams.",
        "I don't want to conquer anything. I just think the guy with the most freedom in this ocean is the Pirate King!",
        "No matter how hard or how impossible it is, never lose sight of your goal.",
        "Being alone is more painful than getting hurt.",
        "I don't care what the society says. I've never regretted my decisions.",
        "If you're hungry, eat!",
        "The weak don't get to decide anything, not even how they die.",
        "I'm not gonna die. I'm gonna make my dreams come true!",
        "Forgetting is like a wound. The wound may heal, but it has already left a scar.",
        "If you lose your ambition, you're done for."
    ],
    "Roronoa Zoro": [
        "Nothing happened.",
        "I don't care what the society thinks. I've never regretted anything.",
        "When the world shoves you around, you just gotta stand up and shove back.",
        "A scar on the back is a swordsman's shame.",
        "I have my ambitions. I made a promise to a friend.",
        "Bring on the hardship. It's preferred in a path of carnage.",
        "Only those who have suffered long can see the light within the shadows.",
        "If I can't even protect my captain's dream, then whatever ambition I have is nothing.",
        "Being strong isn't just about having power or move, it's about one's spirit.",
        "There's no such thing as being born strong. It's how hard you work that matters.",
        "Fear is not evil. It tells you what your weakness is.",
        "A wound on the back is a swordsman's greatest shame."
    ],
    "Cristiano Ronaldo": [
        "Your love makes me strong. Your hate makes me unstoppable.",
        "Talent without working hard is nothing.",
        "Dreams are not what you see in your sleep, dreams are things which do not let you sleep.",
        "I'm living a dream I never want to wake up from.",
        "There is no harm in dreaming of becoming the world's best player.",
        "Without football, my life is worth nothing.",
        "I am not a perfectionist, but I like to feel that things are done well.",
        "I don't have to show anything to anyone. There is nothing to prove.",
        "I see football as an art and all players are artists.",
        "We should make the most of every moment.",
        "If you think you're perfect already, then you never will be.",
        "The secret is to believe in your dreams; in your potential that you can be like your star."
    ],
    "Eren Yeager": [
        "I'll destroy them all. Every last one of those animals that's on this earth.",
        "If you win, you live. If you lose, you die. If you don't fight, you can't win!",
        "I'm free. No matter what you do, no matter what you say, I'm free.",
        "What's wrong with wanting to live? What's wrong with wanting to survive?",
        "I'm the same as you. I'm doing this because I want to.",
        "Nothing can suppress a human's curiosity.",
        "I disposed of some dangerous animals. They happened to resemble humans.",
        "If someone is willing to take my freedom, I won't hesitate to take theirs.",
        "I just keep moving forward until my enemies are destroyed.",
        "I want to see and understand the world outside. I don't want to die inside these walls without knowing what's out there!",
        "The world is cruel. It is also very beautiful.",
        "Once I'm dead, I won't even be able to remember you. So I'll win, no matter what!"
    ],
    "John Wick": [
        "People keep asking if I'm back and I haven't really had an answer. But now, yeah, I'm thinking I'm back.",
        "I'm not afraid of John Wick.",
        "Whatever happens, happens because we choose for it.",
        "I'll kill them. I'll kill them all.",
        "Whoever comes, whoever it is, I'll kill them. I'll kill them all.",
        "Everything's got a price.",
        "It's not what you did, son. It's who you did it to.",
        "You stabbed the devil in the back. To him, this isn't vengeance. This is justice.",
        "The man is a force of nature. John wasn't exactly the boogeyman. He was the one you sent to kill the boogeyman.",
        "Rules. Without them, we live with the animals.",
        "I'm gonna need a gun.",
        "I'll be seeing you, Jimmy."
    ],
    "Homelander": [
        "I'm the Homelander. And I can do whatever the hell I want.",
        "I'm not just like the rest of you. I'm stronger. I'm smarter. I'm better.",
        "They don't love you like they love me.",
        "You don't understand. I'm the real hero.",
        "The only man in the sky is me.",
        "I can do whatever I want.",
        "Excellence is not an art, it's pure habit.",
        "You will do as I say, when I say it, without question.",
        "I'm doing this for your own good.",
        "There's nobody in the world like me.",
        "I'm the world's greatest superhero.",
        "Don't test me. You will lose."
    ],
    "Levi Ackerman": [
        "Give up on your dreams and die.",
        "The difference between your decision and ours is experience. But you don't have to rely on that.",
        "I'll kill them all. I'll slaughter every last one of them.",
        "This is a cruel world. And yet, so beautiful.",
        "No casualties. Don't you dare die.",
        "I want to put an end to that recurring nightmare.",
        "I'm making the choice. Give up your dreams and die for us.",
        "Whether you trust us or not, you have no other choice but to follow.",
        "I don't know which option you should choose. I could never advise you on that.",
        "If you begin to regret, you'll dull your future decisions.",
        "Everyone had to be drunk on something to keep pushing on.",
        "The only thing we're allowed to do is believe that we won't regret the choice we made."
    ]
}

CHARACTER_IMAGES = {
    "Billy Butcher": "https://customer-assets.emergentagent.com/job_todomaster-271/artifacts/c6n1apo2_WhatsApp%20Image%202026-01-08%20at%2011.01.39%20AM%20%281%29.jpeg",
    "Tyler Durden": "https://customer-assets.emergentagent.com/job_todomaster-271/artifacts/xt837vep_WhatsApp%20Image%202026-01-08%20at%2011.01.41%20AM%20%281%29.jpeg",
    "Monkey D. Luffy": "https://customer-assets.emergentagent.com/job_todomaster-271/artifacts/hpnw0se1_WhatsApp%20Image%202026-01-08%20at%2011.01.45%20AM%20%281%29.jpeg",
    "Roronoa Zoro": "https://customer-assets.emergentagent.com/job_todomaster-271/artifacts/c17vjizp_WhatsApp%20Image%202026-01-08%20at%2011.01.46%20AM%20%281%29.jpeg",
    "Cristiano Ronaldo": "https://customer-assets.emergentagent.com/job_todomaster-271/artifacts/5a29zefk_WhatsApp%20Image%202026-01-08%20at%2011.01.30%20AM.jpeg",
    "Eren Yeager": "https://customer-assets.emergentagent.com/job_todomaster-271/artifacts/1l70xx0e_WhatsApp%20Image%202026-01-08%20at%2011.01.49%20AM.jpeg",
    "John Wick": "https://customer-assets.emergentagent.com/job_todomaster-271/artifacts/xt837vep_WhatsApp%20Image%202026-01-08%20at%2011.01.41%20AM%20%281%29.jpeg",
    "Homelander": "https://customer-assets.emergentagent.com/job_todomaster-271/artifacts/gitrwtu1_WhatsApp%20Image%202026-01-08%20at%2011.01.37%20AM.jpeg",
    "Levi Ackerman": "https://customer-assets.emergentagent.com/job_todomaster-271/artifacts/1l70xx0e_WhatsApp%20Image%202026-01-08%20at%2011.01.49%20AM.jpeg"
}

# Auth routes
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = user_data.model_dump()
    hashed_pw = hash_password(user_dict.pop('password'))
    user_dict['password_hash'] = hashed_pw
    
    user_obj = User(**{k: v for k, v in user_dict.items() if k != 'password_hash'})
    doc = user_obj.model_dump()
    doc['password_hash'] = hashed_pw
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.users.insert_one(doc)
    
    # Create default categories
    default_categories = [
        {"name": "Work", "color": "#8B5CF6"},
        {"name": "Personal", "color": "#06B6D4"},
        {"name": "Shopping", "color": "#F97316"},
        {"name": "Health", "color": "#10B981"},
        {"name": "Learning", "color": "#F59E0B"}
    ]
    
    for cat in default_categories:
        cat_obj = Category(user_id=user_obj.id, name=cat['name'], color=cat['color'], is_default=True)
        cat_doc = cat_obj.model_dump()
        cat_doc['created_at'] = cat_doc['created_at'].isoformat()
        await db.categories.insert_one(cat_doc)
    
    token = create_token(user_obj.id)
    return TokenResponse(token=token, user=user_obj)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user_doc['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_doc.pop('password_hash')
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    user_obj = User(**user_doc)
    token = create_token(user_obj.id)
    return TokenResponse(token=token, user=user_obj)

@api_router.get("/auth/me", response_model=User)
async def get_me(user_id: str = Depends(get_current_user)):
    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    return User(**user_doc)

# Task routes
@api_router.post("/tasks", response_model=Task)
async def create_task(task_data: TaskCreate, user_id: str = Depends(get_current_user)):
    task_obj = Task(user_id=user_id, **task_data.model_dump())
    doc = task_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.tasks.insert_one(doc)
    return task_obj

@api_router.get("/tasks", response_model=List[Task])
async def get_tasks(user_id: str = Depends(get_current_user)):
    tasks = await db.tasks.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    for task in tasks:
        if isinstance(task.get('created_at'), str):
            task['created_at'] = datetime.fromisoformat(task['created_at'])
        if isinstance(task.get('updated_at'), str):
            task['updated_at'] = datetime.fromisoformat(task['updated_at'])
    return tasks

@api_router.put("/tasks/{task_id}", response_model=Task)
async def update_task(task_id: str, task_data: TaskUpdate, user_id: str = Depends(get_current_user)):
    task_doc = await db.tasks.find_one({"id": task_id, "user_id": user_id}, {"_id": 0})
    if not task_doc:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_dict = {k: v for k, v in task_data.model_dump().items() if v is not None}
    update_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.tasks.update_one({"id": task_id}, {"$set": update_dict})
    
    updated_doc = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    if isinstance(updated_doc.get('created_at'), str):
        updated_doc['created_at'] = datetime.fromisoformat(updated_doc['created_at'])
    if isinstance(updated_doc.get('updated_at'), str):
        updated_doc['updated_at'] = datetime.fromisoformat(updated_doc['updated_at'])
    
    return Task(**updated_doc)

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, user_id: str = Depends(get_current_user)):
    result = await db.tasks.delete_one({"id": task_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted"}

# Category routes
@api_router.get("/categories", response_model=List[Category])
async def get_categories(user_id: str = Depends(get_current_user)):
    categories = await db.categories.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    for cat in categories:
        if isinstance(cat.get('created_at'), str):
            cat['created_at'] = datetime.fromisoformat(cat['created_at'])
    return categories

@api_router.post("/categories", response_model=Category)
async def create_category(cat_data: CategoryCreate, user_id: str = Depends(get_current_user)):
    cat_obj = Category(user_id=user_id, **cat_data.model_dump())
    doc = cat_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.categories.insert_one(doc)
    return cat_obj

# Daily quote route
@api_router.get("/daily-quote", response_model=DailyQuote)
async def get_daily_quote():
    day_of_year = datetime.now(timezone.utc).timetuple().tm_yday
    characters = list(CHARACTER_QUOTES.keys())
    character_index = day_of_year % len(characters)
    character = characters[character_index]
    
    quotes = CHARACTER_QUOTES[character]
    quote_index = day_of_year % len(quotes)
    quote = quotes[quote_index]
    
    return DailyQuote(
        character=character,
        quote=quote,
        image_url=CHARACTER_IMAGES[character]
    )

@api_router.get("/")
async def root():
    return {"message": "Task Manager API"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()