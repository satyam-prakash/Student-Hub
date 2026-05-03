import React, { useRef, useLayoutEffect, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AttendanceCalculator from './pages/AttendanceCalculator';
import CGPACalculator from './pages/CGPACalculator';
import NotesPage from './pages/NotesPage';
import ExpenseTracker from './pages/ExpenseTracker';
import Auth from './pages/Auth';
import { preventNumberInputScroll } from './utils/preventNumberScroll';

function ProtectedRoute({ children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

function AppContent() {
  const location = useLocation();
  const path = location.pathname;
  const scrollPositions = useRef({});
  const mountedRoutesRef = useRef({});
  const [mountedKey, setMountedKey] = useState(0); // Used only to trigger initial render

  // Track which routes have been visited to keep them mounted
  useLayoutEffect(() => {
    const currentRoute = path === '/' ? 'dashboard' 
      : path.startsWith('/attendance') ? 'attendance'
      : path.startsWith('/cgpa') ? 'cgpa'
      : path.startsWith('/notes') ? 'notes'
      : path.startsWith('/expenses') ? 'expenses'
      : null;

    if (currentRoute && !mountedRoutesRef.current[currentRoute]) {
      mountedRoutesRef.current[currentRoute] = true;
      setMountedKey(prev => prev + 1); // Trigger one re-render to mount the component
    }
  }, [path]);

  useLayoutEffect(() => {
    // Restore the scroll position for the new path
    const savedPos = scrollPositions.current[path] || 0;
    window.scrollTo(0, savedPos);

    // Helper to save current scroll position
    const handleScroll = () => {
      scrollPositions.current[location.pathname] = window.scrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [path, location.pathname]);

  return (
    <Layout>
      <div style={{ display: path === '/' ? 'block' : 'none', height: '100%' }}>
        {mountedRoutesRef.current.dashboard && <Dashboard />}
      </div>
      <div style={{ display: path.startsWith('/attendance') ? 'block' : 'none', height: '100%' }}>
        {mountedRoutesRef.current.attendance && <AttendanceCalculator />}
      </div>
      <div style={{ display: path.startsWith('/cgpa') ? 'block' : 'none', height: '100%' }}>
        {mountedRoutesRef.current.cgpa && <CGPACalculator />}
      </div>
      <div style={{ display: path.startsWith('/notes') ? 'block' : 'none', height: '100%' }}>
        {mountedRoutesRef.current.notes && <NotesPage />}
      </div>
      <div style={{ display: path.startsWith('/expenses') ? 'block' : 'none', height: '100%' }}>
        {mountedRoutesRef.current.expenses && <ExpenseTracker />}
      </div>
    </Layout>
  );
}

function App() {
  // Prevent scroll wheel from changing number input values globally
  useEffect(() => {
    preventNumberInputScroll();
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <AppContent />
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
