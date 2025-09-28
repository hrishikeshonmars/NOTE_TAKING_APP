import os
from datetime import datetime, timedelta, timezone
from typing import List

import sqlalchemy
from fastapi import Depends, FastAPI, HTTPException, status, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship

# --- CONFIGURATION ---
DATABASE_URL = "sqlite:///./notes.db"
SECRET_KEY = "a_very_secret_key_for_jwt"  # In production, use a more secure key and load from env
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# --- DATABASE SETUP ---
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- DATABASE MODELS (SQLAlchemy) ---
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    notes = relationship("Note", back_populates="owner", cascade="all, delete-orphan")

class Note(Base):
    __tablename__ = "notes"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    content = Column(String)
    created_on = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_update = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="notes")


# --- PYDANTIC SCHEMAS (Data Validation) ---
# Note Schemas
class NoteBase(BaseModel):
    title: str
    content: str

class NoteCreate(NoteBase):
    pass

class NoteUpdate(NoteBase):
    pass

class NoteSchema(NoteBase):
    id: int
    userId: int # Mapped from owner_id
    created_on: datetime
    last_update: datetime

    class Config:
        orm_mode = True
        # Pydantic V2 uses `from_attributes` instead of `orm_mode`
        # from_attributes = True 

# User Schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserSchema(UserBase):
    id: int

    class Config:
        orm_mode = True

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: str | None = None

# --- SECURITY UTILS ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    # Truncate password to 72 bytes for bcrypt compatibility
    # Ensure we don't exceed bcrypt's 72-byte limit
    password_bytes = password.encode('utf-8')[:72]
    return pwd_context.hash(password_bytes.decode('utf-8', errors='ignore'))

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- CRUD (Create, Read, Update, Delete) FUNCTIONS ---
# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# User CRUD
def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user: UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = User(email=user.email, hashed_password=hashed_password, username=user.username)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Note CRUD
def get_notes_for_user(db: Session, user_id: int):
    return db.query(Note).filter(Note.owner_id == user_id).all()

def create_note_for_user(db: Session, note: NoteCreate, user_id: int):
    db_note = Note(**note.dict(), owner_id=user_id)
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    # Manually create the response object to match the schema
    return NoteSchema(
        id=db_note.id,
        title=db_note.title,
        content=db_note.content,
        created_on=db_note.created_on,
        last_update=db_note.last_update,
        userId=db_note.owner_id
    )

def update_note(db: Session, note_id: int, note_update: NoteUpdate, user_id: int):
    db_note = db.query(Note).filter(Note.id == note_id, Note.owner_id == user_id).first()
    if db_note:
        db_note.title = note_update.title
        db_note.content = note_update.content
        db.commit()
        db.refresh(db_note)
        return NoteSchema(
            id=db_note.id,
            title=db_note.title,
            content=db_note.content,
            created_on=db_note.created_on,
            last_update=db_note.last_update,
            userId=db_note.owner_id
        )
    return None

def delete_note(db: Session, note_id: int, user_id: int):
    db_note = db.query(Note).filter(Note.id == note_id, Note.owner_id == user_id).first()
    if db_note:
        db.delete(db_note)
        db.commit()
        return True
    return False

# --- AUTHENTICATION DEPENDENCY ---
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    user = get_user_by_email(db, email=token_data.email)
    if user is None:
        raise credentials_exception
    return user


# --- FASTAPI APP INITIALIZATION ---
app = FastAPI(title="Keep Notes API")

# CORS Middleware Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- API ENDPOINTS ---
@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    # Create demo user if they don't exist
    db = SessionLocal()
    demo_user = get_user_by_email(db, "deva@example.com")
    if not demo_user:
        create_user(db, UserCreate(username="deva", email="deva@example.com", password="password123"))
    db.close()


@app.post("/signup", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    db_user = get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return create_user(db=db, user=user)


@app.post("/login", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    # The frontend sends email in the 'username' field of the form
    user = get_user_by_email(db, email=form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/users/me", response_model=UserSchema)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


@app.post("/notes", response_model=NoteSchema, status_code=status.HTTP_201_CREATED)
def create_note(
    note: NoteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return create_note_for_user(db=db, note=note, user_id=current_user.id)


@app.get("/notes", response_model=List[NoteSchema])
def read_notes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notes = get_notes_for_user(db, user_id=current_user.id)
    # Map the Note model to NoteSchema, ensuring userId is included
    return [
        NoteSchema(
            id=note.id,
            title=note.title,
            content=note.content,
            created_on=note.created_on,
            last_update=note.last_update,
            userId=note.owner_id
        ) for note in notes
    ]


@app.put("/notes/{note_id}", response_model=NoteSchema)
def update_user_note(
    note_id: int,
    note: NoteUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    updated_note = update_note(db=db, note_id=note_id, note_update=note, user_id=current_user.id)
    if updated_note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    return updated_note


@app.delete("/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_note(
    note_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    success = delete_note(db=db, note_id=note_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Note not found")
    return