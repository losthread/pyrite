from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn


app = FastAPI()


app.add_middleware(
  CORSMiddleware,
  allow_origins=['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'], # add prod frontend url later
  allow_credentials=True,
  allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE"],
  allow_headers=["Content-Type", "Authorization"],
)


if __name__ == '__main__':
  print("Welcome to Notification Microservice version 1.0.0")
  uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=False)