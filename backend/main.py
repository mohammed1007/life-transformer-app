from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
import requests
from bs4 import BeautifulSoup
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Date
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from datetime import date
import math

SQLALCHEMY_DATABASE_URL = "postgresql://neondb_owner:npg_mru9dS0neBfc@ep-wild-lake-axnh5t98-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class DebtGoal(Base):
    __tablename__ = "debts"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    target_amount = Column(Integer)
    amount_paid = Column(Integer, default=0)
    deadline = Column(Date)

class IncomeLog(Base):
    __tablename__ = "income_logs"
    id = Column(Integer, primary_key=True, index=True)
    date_logged = Column(Date, default=date.today)
    total_amount = Column(Integer)
    debt_deducted = Column(Integer)
    rebuild_pool = Column(Integer)

# Renamed to force a fresh PostgreSQL table with new columns
class GoalItem(Base):
    __tablename__ = "goals_v2" 
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    price = Column(String)
    currency = Column(String, default="EGP")
    category = Column(String, default="Maintenance")
    tier = Column(String, default="NOW")
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

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

class URLRequest(BaseModel):
    url: str

class GoalCreate(BaseModel):
    title: str
    price: str
    currency: str 
    category: str
    tier: str
    image_url: str
    original_url: str

class FundRequest(BaseModel):
    amount: int

class IncomeInput(BaseModel):
    amount: int

class DebtCreate(BaseModel):
    name: str
    target_amount: int
    deadline: date

@app.post("/extract")
def extract_item_data(request: URLRequest):
    headers = {"User-Agent": "Mozilla/5.0"}
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

@app.post("/goals/{goal_id}/fund")
def fund_goal(goal_id: int, request: FundRequest, db: Session = Depends(get_db)):
    goal = db.query(GoalItem).filter(GoalItem.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    goal.funded_amount += request.amount
    db.commit()
    db.refresh(goal)
    return goal

@app.get("/debts/active")
def get_active_debt(db: Session = Depends(get_db)):
    return db.query(DebtGoal).filter(DebtGoal.amount_paid < DebtGoal.target_amount).first()

@app.post("/debts")
def create_debt(debt: DebtCreate, db: Session = Depends(get_db)):
    db_item = DebtGoal(**debt.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@app.post("/income/log")
def log_weekly_income(income: IncomeInput, db: Session = Depends(get_db)):
    active_debt = db.query(DebtGoal).filter(DebtGoal.amount_paid < DebtGoal.target_amount).first()
    debt_deduction = 0
    if active_debt:
        days_remaining = (active_debt.deadline - date.today()).days
        weeks_remaining = math.ceil(days_remaining / 7.0) if days_remaining > 0 else 1
        remaining_balance = active_debt.target_amount - active_debt.amount_paid
        debt_deduction = math.ceil(remaining_balance / weeks_remaining)
        debt_deduction = min(debt_deduction, income.amount, remaining_balance)
        active_debt.amount_paid += debt_deduction

    rebuild_pool = income.amount - debt_deduction
    new_log = IncomeLog(total_amount=income.amount, debt_deducted=debt_deduction, rebuild_pool=rebuild_pool)
    db.add(new_log)
    db.commit()
    
    return {
        "total_income": income.amount,
        "debt_cleared_this_week": debt_deduction,
        "remaining_debt_balance": active_debt.target_amount - active_debt.amount_paid if active_debt else 0,
        "unlocked_rebuild_funds": rebuild_pool
    }