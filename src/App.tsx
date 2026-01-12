// ABOUTME: Main app component with routing
// ABOUTME: Sets up React Router for company list and detail pages

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CompanyList } from './pages/CompanyList';
import { CompanyDetail } from './pages/CompanyDetail';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CompanyList />} />
        <Route path="/company/:id" element={<CompanyDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
