import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter, BrowserRouter as Router } from 'react-router-dom';
// Then use <Router> instead of <BrowserRouter>

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
    
    <App/>
    </BrowserRouter>
  </StrictMode>,
)
