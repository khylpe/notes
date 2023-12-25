from typing import Union
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

#list of origins that are allowed to perform cross-origin requests.
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # List of allowed origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

class LoginData(BaseModel):
    username: str = Field(..., example="user")
    password: str = Field(..., example="pass")

@app.post("/login")
def login(login_data: LoginData):
    if login_data.username == "admin" and login_data.password == "secret":
        return {"message": "Login successful!"}
    raise HTTPException(status_code=401, detail="Invalid credentials")
