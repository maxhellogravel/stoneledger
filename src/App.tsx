// ABOUTME: Main app component with routing and data provider
// ABOUTME: Sets up React Router and data context for company list and detail pages

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CompanyList } from './pages/CompanyList';
import { CompanyDetail } from './pages/CompanyDetail';
import { useDataProvider, DataContext } from './hooks/useData';

function AppContent() {
  return (
    <Routes>
      <Route path="/" element={<CompanyList />} />
      <Route path="/company/:id" element={<CompanyDetail />} />
    </Routes>
  );
}

function App() {
  const { DataContext: _, ...dataState } = useDataProvider();

  return (
    <DataContext.Provider value={dataState}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </DataContext.Provider>
  );
}

export default App;
