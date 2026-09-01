from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
import requests
from bs4 import BeautifulSoup
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import declarative_base, sessionmaker, Session

# --- DATABASE SETUP ---
SQLALCHEMY_DATABASE_URL = "postgresql://neondb_owner:npg_mru9dS0neBfc@ep-wild-lake-axnh5t98-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Define the SQL Table (Added funded_amount)
class GoalItem(Base):
    __tablename__ = "goals"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    price = Column(String)
    currency = Column(String, default="USD") # NEW COLUMN
    image_url = Column(String)
    original_url = Column(String)
    status = Column(String, default="Active")
    funded_amount = Column(Integer, default=0)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- APP SETUP ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- PYDANTIC SCHEMAS ---
class URLRequest(BaseModel):
    url: str

class GoalCreate(BaseModel):
    title: str
    price: str
    currency: str # NEW FIELD
    image_url: str
    original_url: str

class FundRequest(BaseModel):
    amount: int

# --- ENDPOINTS ---
@app.post("/extract")
def extract_item_data(request: URLRequest):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
    }
    try:
        response = requests.get(request.url, headers=headers, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        title = soup.find(id="productTitle")
        title = title.get_text(strip=True) if title else getattr(soup.find("meta", property="og:title"), "content", "Unknown Item")
            
        image = soup.find(id="landingImage") or soup.find(id="imgBlkFront")
        image_url = image["src"] if image and image.has_attr("src") else getattr(soup.find("meta", property="og:image"), "content", "")
            
        price_tag = soup.select_one("span.a-price span.a-offscreen")
        price = price_tag.get_text(strip=True) if price_tag else getattr(soup.find("meta", property="product:price:amount"), "content", "$0.00")
            
        return {"title": title, "image_url": image_url, "price": price, "original_url": request.url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/goals")
def save_goal(goal: GoalCreate, db: Session = Depends(get_db)):
    db_item = GoalItem(**goal.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@app.get("/goals")
def get_all_goals(db: Session = Depends(get_db)):
    return db.query(GoalItem).all()

# NEW: Funding Endpoint
@app.post("/goals/{goal_id}/fund")
def fund_goal(goal_id: int, request: FundRequest, db: Session = Depends(get_db)):
    goal = db.query(GoalItem).filter(GoalItem.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    goal.funded_amount += request.amount
    db.commit()
    db.refresh(goal)
    return goal