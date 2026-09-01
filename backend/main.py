from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
import requests
from bs4 import BeautifulSoup
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Date, Text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from datetime import date
import math
import json

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

# Renamed to generate new schema with stock tracking
class GoalItem(Base):
    __tablename__ = "goals_v3" 
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    price = Column(String)
    currency = Column(String, default="EGP")
    category = Column(String, default="Maintenance")
    tier = Column(String, default="NOW")
    stock_status = Column(String, default="IN_STOCK")
    image_url = Column(Text, default="") # Changed from String to Text
    original_url = Column(String, default="")
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
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class URLRequest(BaseModel): url: str
class FundRequest(BaseModel): amount: int
class IncomeInput(BaseModel): amount: int
class DebtCreate(BaseModel): name: str; target_amount: int; deadline: date
class StockUpdateRequest(BaseModel): status: str

class GoalCreate(BaseModel):
    title: str
    price: str
    currency: str 
    category: str
    tier: str
    image_url: str
    original_url: str

@app.post("/extract")
def extract_item_data(request: URLRequest):
    headers = {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }
    
    title = ""
    image_url = ""
    price = "0"

    try:
        response = requests.get(request.url, headers=headers, timeout=8, allow_redirects=True)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 1. Scrape Title
        og_title = soup.find("meta", property="og:title") or soup.find("meta", attrs={"name": "title"})
        product_title = soup.find(id="productTitle")
        if product_title:
            title = product_title.get_text(strip=True)
        elif og_title and og_title.get("content"):
            title = og_title["content"].strip()
        elif soup.title:
            title = soup.title.string.strip()

        # 2. Scrape Image
        og_image = soup.find("meta", property="og:image") or soup.find("meta", attrs={"name": "twitter:image"})
        landing_image = soup.find(id="landingImage") or soup.find(id="imgBlkFront")
        if og_image and og_image.get("content"):
            image_url = og_image["content"]
        elif landing_image and landing_image.get("src"):
            image_url = landing_image["src"]

        # 3. Scrape Price
        price_tag = soup.select_one("span.a-price span.a-offscreen") or soup.find("meta", property="product:price:amount")
        if price_tag:
            price = price_tag.get_text(strip=True) if hasattr(price_tag, "get_text") else price_tag.get("content", "0")
            
    except Exception as e:
        print(f"Extraction error: {e}")

    # Fallback guarantees the modal always opens on your phone even if scraping is blocked
    return {
        "title": title or "New Item",
        "image_url": image_url or "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60",
        "price": price if price != "0" else "100",
        "original_url": request.url
    }
@app.post("/goals")
def save_goal(goal: GoalCreate, db: Session = Depends(get_db)):
    db_item = GoalItem(**goal.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@app.get("/goals")
def get_all_goals(db: Session = Depends(get_db)):
    return db.query(GoalItem).order_by(GoalItem.id.desc()).all()

@app.post("/goals/{goal_id}/fund")
def fund_goal(goal_id: int, request: FundRequest, db: Session = Depends(get_db)):
    goal = db.query(GoalItem).filter(GoalItem.id == goal_id).first()
    if goal:
        goal.funded_amount += request.amount
        db.commit()
    return goal

# NEW: Inventory Status Toggle
@app.put("/goals/{goal_id}/stock")
def update_stock_status(goal_id: int, request: StockUpdateRequest, db: Session = Depends(get_db)):
    goal = db.query(GoalItem).filter(GoalItem.id == goal_id).first()
    if goal:
        goal.stock_status = request.status
        db.commit()
    return goal

@app.get("/debts/active")
def get_active_debt(db: Session = Depends(get_db)):
    return db.query(DebtGoal).filter(DebtGoal.amount_paid < DebtGoal.target_amount).first()

@app.post("/debts")
def create_debt(debt: DebtCreate, db: Session = Depends(get_db)):
    db_item = DebtGoal(**debt.model_dump())
    db.add(db_item)
    db.commit()
    return db_item

@app.post("/income/log")
def log_weekly_income(income: IncomeInput, db: Session = Depends(get_db)):
    active_debt = db.query(DebtGoal).filter(DebtGoal.amount_paid < DebtGoal.target_amount).first()
    debt_deduction = 0
    if active_debt:
        days_remaining = (active_debt.deadline - date.today()).days
        weeks_remaining = math.ceil(days_remaining / 7.0) if days_remaining > 0 else 1
        remaining_balance = active_debt.target_amount - active_debt.amount_paid
        debt_deduction = min(math.ceil(remaining_balance / weeks_remaining), income.amount, remaining_balance)
        active_debt.amount_paid += debt_deduction

    rebuild_pool = income.amount - debt_deduction
    new_log = IncomeLog(total_amount=income.amount, debt_deducted=debt_deduction, rebuild_pool=rebuild_pool)
    db.add(new_log)
    db.commit()
    
    return {
        "debt_cleared_this_week": debt_deduction,
        "unlocked_rebuild_funds": rebuild_pool
    }