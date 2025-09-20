import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CollaborativeEditor from './components/CollaborativeEditor';
import 'antd/dist/reset.css';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  console.log('🛡️ ProtectedRoute - loading:', loading, 'user:', !!user);

  if (loading) {
    console.log('⏳ ProtectedRoute showing loading...');
    return <div style={{ padding: '20px' }}>Loading authentication...</div>;
  }

  if (user) {
    console.log('✅ ProtectedRoute - user authenticated, showing children');
    return <>{children}</>;
  } else {
    console.log('🚫 ProtectedRoute - no user, redirecting to login');
    return <Navigate to="/login" replace />;
  }
};

// Public Route Component (redirect to dashboard if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  console.log('🌐 PublicRoute - loading:', loading, 'user:', !!user);

  if (loading) {
    console.log('⏳ PublicRoute showing loading...');
    return <div style={{ padding: '20px' }}>Loading authentication...</div>;
  }

  if (user) {
    console.log('✅ PublicRoute - user authenticated, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  } else {
    console.log('🔓 PublicRoute - no user, showing login');
    return <>{children}</>;
  }
};

function App(): React.JSX.Element {
  console.log('🎯 App component rendering...');

  try {
    return (
      <ConfigProvider locale={zhCN}>
        <AuthProvider>
          <Router>
            <div style={{ minHeight: '100vh' }}>
              <Routes>
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/room/:roomId"
                  element={
                    <ProtectedRoute>
                      <CollaborativeEditor />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/"
                  element={
                    (() => {
                      console.log('🏠 Root route (/) accessed with HashRouter, redirecting to dashboard');
                      return <Navigate to="/dashboard" replace />;
                    })()
                  }
                />
                {/* 添加一个 catch-all 路由用于调试 */}
                <Route
                  path="*"
                  element={
                    <div style={{ padding: '20px' }}>
                      <h2>🔍 Debug: Unknown Route</h2>
                      <p>Current hash: {window.location.hash}</p>
                      <p>Current pathname: {window.location.pathname}</p>
                      <button onClick={() => window.location.hash = '#/dashboard'}>
                        Go to Dashboard
                      </button>
                    </div>
                  }
                />
              </Routes>
            </div>
          </Router>
        </AuthProvider>
      </ConfigProvider>
    );
  } catch (error) {
    console.error('❌ Error in App component:', error);
    return (
      <div style={{ padding: '20px', color: 'red', backgroundColor: '#ffe6e6' }}>
        <h2>❌ Application Error</h2>
        <p>Error: {error instanceof Error ? error.message : String(error)}</p>
        <button onClick={() => window.location.reload()}>Reload Application</button>
      </div>
    );
  }
}

export default App;
