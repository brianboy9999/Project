import { useNavigate } from 'react-router-dom';
import './Home.css';

interface Feature {
    id: string;
    title: string;
    description: string;
    icon: string;
    path: string;
    enabled: boolean;
}

function Home() {
    const navigate = useNavigate();

    const features: Feature[] = [
        {
            id: 'stock-analysis',
            title: '股票資訊查詢',
            description: '查看即時股票資訊、歷史數據及分析圖表',
            icon: '📈',
            path: '/stock',
            enabled: true
        },
        {
            id: 'market-analysis',
            title: '市場分析',
            description: '功能開發中...',
            icon: '🔧',
            path: '/market',
            enabled: false
        },
        {
            id: 'portfolio',
            title: '投資組合',
            description: '功能開發中...',
            icon: '🔧',
            path: '/portfolio',
            enabled: false
        }
    ];

    return (
        <div className="home-container">
            <h1 className="home-title">歡迎使用股票分析系統</h1>
            <p className="home-subtitle">請選擇您要使用的功能</p>
            
            <div className="features-grid">
                {features.map((feature) => (
                    <button
                        key={feature.id}
                        className={`feature-card ${!feature.enabled ? 'disabled' : ''}`}
                        onClick={() => feature.enabled && navigate(feature.path)}
                        disabled={!feature.enabled}
                    >
                        <div className="feature-icon">{feature.icon}</div>
                        <h2 className="feature-title">{feature.title}</h2>
                        <p className="feature-description">{feature.description}</p>
                    </button>
                ))}
            </div>
        </div>
    );
}

export default Home;