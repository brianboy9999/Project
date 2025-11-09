import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import Home from './pages/Home';
import { StockDashboard } from './pages/stock/StockDashboard';
import './pages/stock/StockDashboard.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header className="app-header">
          <h1>股票資訊系統</h1>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/stock" element={<StockDashboard />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
