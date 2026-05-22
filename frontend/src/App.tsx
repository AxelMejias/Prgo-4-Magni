import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ListaPage from './pages/ListaPage';
import FormularioPage from './pages/FormularioPage';
import EditarPage from './pages/EditarPage';
import LoginPage from './pages/LoginPage';
import PublicaPage from './pages/PublicaPage';
import MenuPage from './pages/MenuPage';
import PrivateRoute from './routes/PrivateRoute';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { user } = useAuth();

  return (
    <>
      {user && <Navbar />}
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/publica" element={<PublicaPage />} />
        <Route
          path="/menu_inicio"
          element={
            <PrivateRoute>
              <MenuPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/lista"
          element={
            <PrivateRoute>
              <ListaPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/nuevo"
          element={
            <PrivateRoute rol="ADMIN">
              <FormularioPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/editar/:id"
          element={
            <PrivateRoute rol="ADMIN">
              <EditarPage />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </>
  );
}
