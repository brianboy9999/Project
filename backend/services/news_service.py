# 取資料
import requests
# 解析html
from bs4 import BeautifulSoup

def get_reuters_news(keyword: str, page: int = 1):
    base_url = "https://www.reuters.com/site-search/"
    params = {"query": keyword, "offset": (page-1)*20}  # 每頁 20 筆
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                      "(KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0",
        "Accept-Language": "en-US,en;q=0.9"
    }

    response = requests.get(base_url, params=params, headers=headers)
    soup = BeautifulSoup(response.text, "html.parser")

    articles = []

    




    