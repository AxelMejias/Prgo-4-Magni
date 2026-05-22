import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ListaPage from './pages/ListaPage';
import FormularioPage from './pages/FormularioPage';
import EditarPage from './pages/EditarPage';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<ListaPage />} />
        <Route path="/nuevo" element={<FormularioPage />} />
        <Route path="/editar/:id" element={<EditarPage />} />
      </Routes>
    </>
  );
}
