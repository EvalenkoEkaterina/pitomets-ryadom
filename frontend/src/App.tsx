import { HashRouter, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import CatalogPage from './pages/CatalogPage'
import './styles/style.css'
import PetPage from './pages/PetPage'
import PublishPage from './pages/PublishPage'
import AuthPage from './pages/AuthPage'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route
          path="/publish/lost"
          element={<PublishPage reportType="lost" />}
        />

        <Route
          path="/publish/found"
          element={<PublishPage reportType="found" />}
        />
        <Route path="/pets/:id" element={<PetPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/pets" element={<CatalogPage />} />
        <Route
          path="/login"
          element={<AuthPage key="login" mode="login" />}
        />

        <Route
          path="/register"
          element={<AuthPage key="register" mode="register" />}
        />
      </Routes>
    </HashRouter>
  )
}

export default App