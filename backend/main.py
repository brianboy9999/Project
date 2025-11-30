from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.stock import stock_router
from routers.stock import stock_comparison_router
from routers.stock import stock_backtest_router
from routers.stock import stock_signal_router

app = FastAPI(
    title = "Stock API",
    description = "提供股票資料與專業分析",
    version = "0.2.0"
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
app.include_router(stock_comparison_router.router)
app.include_router(stock_backtest_router.router)
app.include_router(stock_signal_router.router)

@app.get("/")
def root():
    return {"message": "Backend is running!"}