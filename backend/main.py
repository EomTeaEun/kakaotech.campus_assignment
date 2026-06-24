import os
from typing import Literal, Optional

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import create_engine, or_
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker

load_dotenv(".env.local")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set. Check backend/.env.local")

FRONTEND_URL = os.getenv("FRONTEND_URL")
if not FRONTEND_URL:
    raise RuntimeError("FRONTEND_URL is not set. Check backend/.env.local")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


class TodoModel(Base):
    __tablename__ = "todos"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    text: Mapped[str] = mapped_column(nullable=False)
    detail: Mapped[str] = mapped_column(default="")
    deadline: Mapped[str] = mapped_column(default="")
    priority: Mapped[int] = mapped_column(default=32)
    status: Mapped[str] = mapped_column(default="active")
    item_image: Mapped[str] = mapped_column(nullable=False)
    slot_index: Mapped[int] = mapped_column(nullable=False)
    created_at: Mapped[str] = mapped_column(nullable=False)


Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class TodoCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    text: str = Field(min_length=1)
    detail: str = ""
    deadline: str = ""
    priority: int = Field(default=32, ge=1, le=64)
    status: Literal["active", "done"] = "active"
    item_image: str = Field(alias="itemImage")
    slot_index: int = Field(alias="slotIndex", ge=0, le=26)
    created_at: str = Field(alias="createdAt")


class TodoUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    text: Optional[str] = Field(default=None, min_length=1)
    detail: Optional[str] = None
    deadline: Optional[str] = None
    priority: Optional[int] = Field(default=None, ge=1, le=64)
    status: Optional[Literal["active", "done"]] = None
    item_image: Optional[str] = Field(default=None, alias="itemImage")
    slot_index: Optional[int] = Field(default=None, alias="slotIndex", ge=0, le=26)
    created_at: Optional[str] = Field(default=None, alias="createdAt")


class TodoResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: int
    text: str
    detail: str
    deadline: str
    priority: int
    status: str
    item_image: str = Field(alias="itemImage")
    slot_index: int = Field(alias="slotIndex")
    created_at: str = Field(alias="createdAt")


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/todos", response_model=list[TodoResponse])
def list_todos(
    filter: Optional[Literal["all", "active", "done"]] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(TodoModel)
    if filter in ("active", "done"):
        query = query.where(TodoModel.status == filter)
    if search:
        like = f"%{search}%"
        query = query.where(or_(TodoModel.text.like(like), TodoModel.detail.like(like)))
    return query.all()


@app.post("/todos", response_model=TodoResponse, status_code=201)
def create_todo(payload: TodoCreate, db: Session = Depends(get_db)):
    todo = TodoModel(**payload.model_dump())
    db.add(todo)
    db.commit()
    db.refresh(todo)
    return todo


@app.put("/todos/{todo_id}", response_model=TodoResponse)
def update_todo(todo_id: int, payload: TodoUpdate, db: Session = Depends(get_db)):
    todo = db.get(TodoModel, todo_id)
    if todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(todo, key, value)
    db.commit()
    db.refresh(todo)
    return todo


@app.delete("/todos/{todo_id}", status_code=204)
def delete_todo(todo_id: int, db: Session = Depends(get_db)):
    todo = db.get(TodoModel, todo_id)
    if todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    db.delete(todo)
    db.commit()
    return None
