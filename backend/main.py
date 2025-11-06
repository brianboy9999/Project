from fastapi import FastAPI
from routers import stock

app = FastAPI(
    title = "Stock API",
    description = "提供股票資料與簡單分析",
    version = "0.1.0"
)

app.include_router(stock.router, prefix = "/stock", tags = ["Stock"])

@app.get("/")
def root():
    return {"message": "Backend is running!"}