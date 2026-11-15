import { HashRouter, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import CatalogPage from './pages/CatalogPage'
import './styles/style.css'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/pets" element={<CatalogPage />} />
      </Routes>
    </HashRouter>
  )
}

export default App