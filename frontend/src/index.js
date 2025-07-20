import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));

// Hide loading screen when React app starts
if (window.hideLoadingScreen) {
  window.hideLoadingScreen();
}

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);