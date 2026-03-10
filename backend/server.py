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
GOOGLE_CLIENT_ID = '1041754056180-rqofs6e3oumsjn5jqmv7norc2bdfj82o.apps.googleusercontent.com'

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
        "The only way out is through.",
        "You want something done right, do it yourself.",
        "Don't wait for permission to be great.",
        "Hard times reveal true character.",
        "Keep your enemies close and your goals closer.",
        "Survive today, dominate tomorrow.",
        "No excuses, no regrets.",
        "When life hits hard, hit back harder."
    ],
    "Tyler Durden": [
        "It's only after we've lost everything that we're free to do anything.",
        "You're not your job. You're not how much money you have in the bank.",
        "Stop trying to control everything and just let go.",
        "The things you own end up owning you.",
        "You have to know the answer to this question: What do you want?",
        "This is your life and it's ending one minute at a time.",
        "You are not special. You're not a beautiful and unique snowflake.",
        "Without pain, without sacrifice, we would have nothing.",
        "You decide your own level of involvement.",
        "Only after disaster can we be resurrected.",
        "The first step to eternal life is you have to die.",
        "We are consumers. We're by-products of a lifestyle obsession.",
        "Reject the basic assumptions of civilization, especially the importance of material possessions.",
        "You have to give up. You have to realize that someday you will die.",
        "It's not until we lose everything that we find ourselves.",
        "Self-improvement is a form of self-destruction.",
        "You met me at a very strange time in my life.",
        "We buy things we don't need with money we don't have.",
        "The world is full of people who've stopped listening to themselves.",
        "You are not your khakis."
    ],
    "Monkey D. Luffy": [
        "I'm gonna be King of the Pirates!",
        "If you don't take risks, you can't create a future.",
        "Power isn't determined by your size, but by the size of your heart and dreams.",
        "No matter how hard or impossible it is, never lose sight of your goal.",
        "Being alone is more painful than getting hurt.",
        "I don't care what the society says. I've never regretted my decisions.",
        "The weak don't get to decide anything, not even how they die.",
        "I'm not gonna die. I'm gonna make my dreams come true!",
        "Forgetting is like a wound. The wound may heal, but it has already left a scar.",
        "If you lose your ambition, you're done for.",
        "I've set myself to become the King of the Pirates and if I die trying, then at least I tried.",
        "You want to keep everyone from dying? That's naive. It's war.",
        "I don't want to conquer anything. I just want to be free.",
        "Saving my friends is not a reason to fight, it's a reason to win!",
        "Even if I have to fight alone, I'll keep moving forward!",
        "A real man never forgets the people who helped him.",
        "I'd rather die than abandon my friends.",
        "My nakama are my greatest treasure.",
        "When you decide to fight, you must win. That is the only justice.",
        "Inherited will, the tide of the age, and dreams. These things will not be stopped."
    ],
    "Roronoa Zoro": [
        "Nothing happened.",
        "When the world shoves you around, you just gotta stand up and shove back.",
        "A scar on the back is a swordsman's shame.",
        "I have my ambitions. I made a promise to a friend.",
        "Bring on the hardship. It's preferred in a path of carnage.",
        "Only those who have suffered long can see the light within the shadows.",
        "If I can't even protect my captain's dream, then whatever ambition I have is nothing.",
        "Being strong isn't just about having power or moves, it's about one's spirit.",
        "There's no such thing as being born strong. It's how hard you work that matters.",
        "Fear is not evil. It tells you what your weakness is.",
        "I don't care if you're a god. If you stand in Luffy's way, I'll cut you down.",
        "Either in belief or doubt, if I lean to one side it will slow my sword.",
        "I will cut open a path to becoming the world's greatest swordsman.",
        "Dead men make no excuses.",
        "If I can't complete this task, what right do I have to call myself the world's greatest swordsman?",
        "Sweat and effort, that's the only way to grow stronger.",
        "In my fight, retreat is not an option.",
        "The goal of a swordsman is to never use the sword.",
        "I will not lose. I absolutely cannot lose.",
        "My swords will cut open the path to being the greatest."
    ],
    "Cristiano Ronaldo": [
        "Your love makes me strong. Your hate makes me unstoppable.",
        "Talent without working hard is nothing.",
        "Dreams are not what you see in your sleep, dreams are things which do not let you sleep.",
        "I'm living a dream I never want to wake up from.",
        "Without football, my life is worth nothing.",
        "I am not a perfectionist, but I like to feel that things are done well.",
        "I don't have to show anything to anyone. There is nothing to prove.",
        "We should make the most of every moment.",
        "If you think you're perfect already, then you never will be.",
        "The secret is to believe in your dreams and your potential.",
        "Hard work beats talent when talent doesn't work hard.",
        "Every season I work harder than the previous one.",
        "I always try to do my best, to improve myself every day.",
        "There is no harm in dreaming of becoming the world's best player.",
        "You have to fight to reach your dream. You have to sacrifice and work hard for it.",
        "I am not a robot. I have feelings too.",
        "My ambition is to be the best player in football history.",
        "Success is not an accident. It is hard work, perseverance, learning, sacrifice.",
        "I don't need to prove anything to anyone, I only have to prove things to myself.",
        "The more difficult the victory, the greater the happiness in winning."
    ],
    "Eren Yeager": [
        "If you win, you live. If you lose, you die. If you don't fight, you can't win!",
        "I'm free. No matter what you do, no matter what you say, I'm free.",
        "Nothing can suppress a human's curiosity.",
        "I just keep moving forward until my enemies are destroyed.",
        "I want to see and understand the world outside these walls.",
        "The world is cruel. It is also very beautiful.",
        "Once I'm dead, I won't even be able to remember you. So I'll win, no matter what!",
        "If someone is willing to take my freedom, I won't hesitate to take theirs.",
        "What's wrong with wanting to live? What's wrong with wanting to survive?",
        "I'm doing this because I want to.",
        "We are born into this world free. Yes, all of us.",
        "I'll keep moving forward until all my enemies are destroyed.",
        "The only way to truly be free is to fight for it.",
        "Do not give up. Just keep moving forward.",
        "I refuse to become a slave to my destiny.",
        "My hatred for my enemies is stronger than my love for anything.",
        "If you don't fight, you can't win. If you won't fight, you don't deserve to win.",
        "Every choice has consequences. I accept mine.",
        "I will not stop until I see the ocean.",
        "We have to fight. We will fight. And we will be free."
    ],
    "John Wick": [
        "People keep asking if I'm back. Yeah, I'm thinking I'm back.",
        "Whatever happens, happens because we choose for it.",
        "Everything's got a price.",
        "It's not what you did, son. It's who you did it to.",
        "Rules. Without them, we live with the animals.",
        "I'll kill them all.",
        "You stabbed the devil in the back.",
        "The man is a force of nature.",
        "Be focused. Be determined. Be hopeful. Be empowered.",
        "When someone does something wrong, make it right.",
        "I'm not the one you should be worried about.",
        "Consequences. Every action has one.",
        "I'm gonna need a bigger gun.",
        "Revenge is not just a feeling. It's a decision.",
        "When you kill someone's dog, you end that man's last connection to his past.",
        "I once saw him kill three men with a pencil.",
        "The impossible task is not impossible. It just hasn't been done yet.",
        "Some debts never get paid in full.",
        "Never make an enemy of a man who has nothing left to lose.",
        "Hell is empty. All the devils are here."
    ],
    "Homelander": [
        "I'm the Homelander. And I can do whatever the hell I want.",
        "I'm stronger. I'm smarter. I'm better.",
        "They don't love you like they love me.",
        "The only man in the sky is me.",
        "There's nobody in the world like me.",
        "I'm the world's greatest superhero.",
        "Don't test me. You will lose.",
        "I'm doing this for your own good.",
        "You will do as I say, when I say it.",
        "I can do whatever I want.",
        "Power isn't given. It's taken.",
        "Fear is respect. And I deserve both.",
        "I am the most powerful being on this planet.",
        "No one tells me what to do.",
        "You need me more than I need you.",
        "Strength is the only language people understand.",
        "I could burn this all down if I wanted to.",
        "Everyone loves a hero. And I am the hero.",
        "I don't follow rules. I make them.",
        "The world bends to those who are strongest."
    ],
    "Levi Ackerman": [
        "Give up on your dreams and die.",
        "No casualties. Don't you dare die.",
        "I want to put an end to that recurring nightmare.",
        "This is a cruel world. And yet, so beautiful.",
        "I don't know which option you should choose. I could never advise you on that.",
        "If you begin to regret, you'll dull your future decisions.",
        "Everyone had to be drunk on something to keep pushing on.",
        "The only thing we're allowed to do is believe that we won't regret the choice we made.",
        "Whether you trust us or not, you have no other choice but to follow.",
        "I'll kill them all. I'll slaughter every last one.",
        "Strength alone can't get you through this world.",
        "A clean stab. That's all it takes.",
        "The difference between your decision and ours is experience.",
        "Don't be so quick to throw away your life. No matter how unsightly, you must keep fighting.",
        "Even in moments of the deepest despair, keep fighting.",
        "You're correct. I was naive. I thought there was no way to save him.",
        "I choose to believe in my subordinates and move forward.",
        "As long as you don't give up, you will always have a chance.",
        "We only have one life to live. Make it worth it.",
        "I'd rather die in battle than live without purpose."
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

@api_router.post("/auth/google", response_model=TokenResponse)
async def google_auth(request: GoogleAuthRequest):
    try:
        idinfo = id_token.verify_oauth2_token(
            request.token,
            google_requests.Request(),
            GOOGLE_CLIENT_ID
        )
        email = idinfo['email']
        name = idinfo.get('name', email.split('@')[0])
        user_doc = await db.users.find_one({"email": email}, {"_id": 0})
        if not user_doc:
            user_obj = User(email=email, name=name)
            doc = user_obj.model_dump()
            doc['password_hash'] = ''
            doc['created_at'] = doc['created_at'].isoformat()
            await db.users.insert_one(doc)
            default_categories = [
                {"name": "Work", "color": "#8B5CF6"},
                {"name": "Personal", "color": "#06B6D4"},
                {"name": "Health", "color": "#10B981"},
            ]
            for cat in default_categories:
                cat_obj = Category(user_id=user_obj.id, name=cat['name'], color=cat['color'], is_default=True)
                cat_doc = cat_obj.model_dump()
                cat_doc['created_at'] = cat_doc['created_at'].isoformat()
                await db.categories.insert_one(cat_doc)
        else:
            user_doc.pop('password_hash', None)
            if isinstance(user_doc.get('created_at'), str):
                user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
            user_obj = User(**user_doc)
        token = create_token(user_obj.id)
        return TokenResponse(token=token, user=user_obj)
    except Exception as e:
        raise HTTPException(status_code=401, detail="Google authentication failed")

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

@api_router.get("/daily-quote", response_model=DailyQuote)
async def get_daily_quote():
    hours_since_epoch = int(datetime.now(timezone.utc).timestamp() / 3600)
    characters = list(CHARACTER_QUOTES.keys())
    character_index = hours_since_epoch % len(characters)
    character = characters[character_index]
    quotes = CHARACTER_QUOTES[character]
    quote_index = (hours_since_epoch // len(characters)) % len(quotes)
    quote = quotes[quote_index]
    return DailyQuote(
        character=character,
        quote=quote,
        image_url=CHARACTER_IMAGES[character]
    )

@api_router.get("/")
async def root():
    return {"message": "Task Manager API"}

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
