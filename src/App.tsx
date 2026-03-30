import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store, useAppDispatch, useAppSelector } from './store/store';
import { fetchMe } from './store/slices/authSlice';
import { useSocket } from './hooks/useSocket';
import { LoginPage, RegisterPage } from './components/Auth/AuthPages';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';


// 🔐 Protected Route
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAppSelector((s) => s.auth);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#111b21] text-white">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};


// 💬 Chat Layout
const ChatLayout: React.FC = () => {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);

  // Only connect socket if logged in
  useSocket();

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen bg-[#111b21] overflow-hidden">
      <Sidebar />
      <ChatWindow />
    </div>
  );
};


// 🌐 Routes
const AppRoutes: React.FC = () => {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.token);

  useEffect(() => {
    if (token) {
      dispatch(fetchMe());
    }
  }, [token, dispatch]);

  return (
    <BrowserRouter>
      <Routes>

        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ChatLayout />
            </ProtectedRoute>
          }
        />

        {/* Fallback route = default route when no route matches */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
};


// 🚀 Root App
const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AppRoutes />
    </Provider>
  );
};

export default App;