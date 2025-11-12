from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.stock import stock_router

app = FastAPI(
    title = "Stock API",
    description = "提供股票資料與簡單分析",
    version = "0.1.0"
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite 的默認端口
        "http://localhost:5174",  # 備用端口
        "http://localhost:5175",  # 備用端口
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stock_router.router)

@app.get("/")
def root():
    return {"message": "Backend is running!"}