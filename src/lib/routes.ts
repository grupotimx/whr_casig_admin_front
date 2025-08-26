import Home from './pages/Home.svelte';
import CargaCSV from './pages/CargaCSV.svelte';
import ConsultaUsuarios from './pages/ConsultaUsuarios.svelte';
import ConsultaDispositivos from './pages/ConsultaDispositivos.svelte';

const routes = {
  '/': Home,
  '/carga': CargaCSV,
  '/usuarios': ConsultaUsuarios,
  '/dispositivos': ConsultaDispositivos
};

export default routes;