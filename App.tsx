import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ChatPage from './components/ChatPage';
import { AppProvider } from './contexts/AppContext'; // Forcing re-transpilation

const App: React.FC = () => {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<ChatPage />} />
          <Route path="/chat" element={<ChatPage />} />
        </Routes>
      </Router>
    </AppProvider>
  );
};

export default App;
