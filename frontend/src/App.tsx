import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ListaPage from './pages/ListaPage';
import FormularioPage from './pages/FormularioPage';
import EditarPage from './pages/EditarPage';
import LoginPage from './pages/LoginPage';
import PublicaPage from './pages/PublicaPage';
import MenuPage from './pages/MenuPage';
import CursosPage from './pages/CursosPage';
import PagoResultadoPage from './pages/PagoResultadoPage';
import PrivateRoute from './routes/PrivateRoute';
import { useAuth } from './context/AuthContext';
import { useKeyboardShortcut } from './hooks/useKeyboardShortcut';

export default function App() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Ctrl+B global: navega a /lista y señala que debe enfocar los filtros
  useKeyboardShortcut({ ctrl: true, key: 'b' }, () => {
    if (user) navigate('/lista', { state: { focusFiltros: true } });
  });

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
        {/* TP9 — Cursos y Checkout Pro */}
        <Route
          path="/cursos"
          element={
            <PrivateRoute>
              <CursosPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/cursos/success"
          element={
            <PrivateRoute>
              <PagoResultadoPage tipo="success" />
            </PrivateRoute>
          }
        />
        <Route
          path="/cursos/failure"
          element={
            <PrivateRoute>
              <PagoResultadoPage tipo="failure" />
            </PrivateRoute>
          }
        />
        <Route
          path="/cursos/pending"
          element={
            <PrivateRoute>
              <PagoResultadoPage tipo="pending" />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </>
  );
}
