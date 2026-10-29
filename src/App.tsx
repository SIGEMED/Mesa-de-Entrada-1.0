import { useState, useMemo } from 'react';
import {
  Role, Documento, Pase, EventoHistorial, TipoDocumental, EstadoDocumento,
  AREAS, USUARIOS, ROLES_LABELS, MENU_OPTIONS, DecisionEvaluacion
} from './types';
import { INITIAL_DOCUMENTS, getNextDocNumber, getNextPaseId, getNextHistId } from './data';

type Screen = 'dashboard' | 'ingreso' | 'bandeja' | 'caratula' | 'pases-entrantes' | 'emitir-pase' | 'busqueda' | 'historial' | 'evaluar' | 'detalle' | 'recibir-pase' | 'emitir-pase-doc';

function getNow(): { fecha: string; hora: string } {
  const d = new Date();
  return { fecha: d.toISOString().split('T')[0], hora: d.toTimeString().slice(0, 5) };
}

export default function App() {
  const [currentRole, setCurrentRole] = useState<Role>('recepcion');
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [documents, setDocuments] = useState<Documento[]>(INITIAL_DOCUMENTS);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedPaseId, setSelectedPaseId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
  const [searchFilters, setSearchFilters] = useState({
    numeroInterno: '', gde: '', sigep: '', cuil: '', remitente: '',
    tipo: 'Todos', area: 'Todos', estado: 'Todos', fechaDesde: '', fechaHasta: ''
  });

  const currentUser = USUARIOS.find(u => u.rol === currentRole)!;
  const menuOptions = MENU_OPTIONS.filter(m => m.roles.includes(currentRole));
  const selectedDoc = documents.find(d => d.id === selectedDocId) || null;

  const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const changeRole = (role: Role) => {
    setCurrentRole(role);
    setCurrentScreen('dashboard');
    setSelectedDocId(null);
    setSelectedPaseId(null);
  };

  const navigateTo = (screen: Screen) => {
    setCurrentScreen(screen);
    setSelectedDocId(null);
    setSelectedPaseId(null);
  };

  const addHistorialEvent = (docId: string, event: Omit<EventoHistorial, 'id'>) => {
    setDocuments(prev => prev.map(d => {
      if (d.id === docId) {
        return { ...d, historial: [...d.historial, { ...event, id: getNextHistId() }] };
      }
      return d;
    }));
  };

  // Filtered documents for search
  const filteredDocuments = useMemo(() => {
    let filtered = [...documents];
    // Scope by role
    switch (currentRole) {
      case 'recepcion':
        filtered = filtered.filter(d => d.areaActual === 'Mesa de Entrada' || d.historial.some(h => h.area === 'Despacho'));
        break;
      case 'evaluador':
        filtered = filtered.filter(d => d.estado === 'EN DESPACHO' || d.historial.some(h => h.rol === 'Evaluador'));
        break;
      case 'caratulador':
        filtered = filtered.filter(d => d.tipoDocumental === 'Expediente' || d.historial.some(h => h.area === 'Despacho'));
        break;
      case 'secretaria':
        filtered = filtered.filter(d => {
          const areaName = currentUser.area;
          return d.areaActual === areaName || d.historial.some(h => h.area === areaName) || d.pases.some(p => p.areaDestino === areaName || p.areaOrigen === areaName);
        });
        break;
      case 'supervisor':
        // All documents
        break;
    }
    // Apply filters
    if (searchFilters.numeroInterno) filtered = filtered.filter(d => d.numeroInterno.toLowerCase().includes(searchFilters.numeroInterno.toLowerCase()));
    if (searchFilters.gde) filtered = filtered.filter(d => d.identificadorGDE?.toLowerCase().includes(searchFilters.gde.toLowerCase()));
    if (searchFilters.sigep) filtered = filtered.filter(d => d.identificadorSIGEP?.toLowerCase().includes(searchFilters.sigep.toLowerCase()));
    if (searchFilters.cuil) filtered = filtered.filter(d => d.cuil?.includes(searchFilters.cuil));
    if (searchFilters.remitente) filtered = filtered.filter(d => d.remitente.toLowerCase().includes(searchFilters.remitente.toLowerCase()) || d.nombreRazonSocial?.toLowerCase().includes(searchFilters.remitente.toLowerCase()));
    if (searchFilters.tipo !== 'Todos') filtered = filtered.filter(d => d.tipoDocumental === searchFilters.tipo);
    if (searchFilters.area !== 'Todos') filtered = filtered.filter(d => d.areaActual === searchFilters.area);
    if (searchFilters.estado !== 'Todos') filtered = filtered.filter(d => d.estado === searchFilters.estado);
    if (searchFilters.fechaDesde) filtered = filtered.filter(d => d.fechaIngreso >= searchFilters.fechaDesde);
    if (searchFilters.fechaHasta) filtered = filtered.filter(d => d.fechaIngreso <= searchFilters.fechaHasta);
    return filtered;
  }, [documents, searchFilters, currentRole, currentUser.area]);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1e3a5f] text-white flex flex-col min-h-screen fixed left-0 top-0 bottom-0 z-30">
        <div className="p-4 border-b border-blue-800">
          <div className="flex items-center gap-2">
            <i className="fas fa-leaf text-green-400 text-xl"></i>
            <div>
              <h1 className="text-sm font-bold leading-tight">Min. de Ambiente</h1>
              <p className="text-xs text-blue-200">y Calidad Ambiental</p>
            </div>
          </div>
          <p className="text-xs text-blue-300 mt-2">Sistema de Despacho y Mesa de Entrada</p>
        </div>
        <nav className="flex-1 py-4">
          {menuOptions.map(opt => (
            <button
              key={opt.id}
              onClick={() => navigateTo(opt.id as Screen)}
              className={`w-full text-left px-4 py-3 flex items-center gap-3 text-sm transition-colors ${currentScreen === opt.id ? 'bg-blue-800 text-white border-r-4 border-green-400' : 'text-blue-100 hover:bg-blue-800/50'}`}
            >
              <i className={`fas ${opt.icon} w-5 text-center`}></i>
              <span>{opt.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-blue-800 text-xs text-blue-300">
          <p className="font-semibold text-white">{currentUser.nombre}</p>
          <p>{ROLES_LABELS[currentRole]}</p>
          <p className="mt-1">{currentUser.area}</p>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {MENU_OPTIONS.find(m => m.id === currentScreen)?.label || 'Detalle'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <label className="text-sm text-gray-600 font-medium">Simular rol:</label>
            <select
              value={currentRole}
              onChange={e => changeRole(e.target.value as Role)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {USUARIOS.map(u => (
                <option key={u.id} value={u.rol}>{u.nombre} — {ROLES_LABELS[u.rol]}</option>
              ))}
            </select>
          </div>
        </header>

        {/* Notification */}
        {notification && (
          <div className={`mx-6 mt-4 p-4 rounded-lg border-l-4 ${notification.type === 'success' ? 'bg-green-50 border-green-500 text-green-800' : notification.type === 'error' ? 'bg-red-50 border-red-500 text-red-800' : 'bg-yellow-50 border-yellow-500 text-yellow-800'}`}>
            <div className="flex items-center gap-2">
              <i className={`fas ${notification.type === 'success' ? 'fa-check-circle' : notification.type === 'error' ? 'fa-exclamation-circle' : 'fa-exclamation-triangle'}`}></i>
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
          </div>
        )}

        {/* Content */}
        <main className="p-6">
          {currentScreen === 'dashboard' && <Dashboard role={currentRole} documents={documents} currentUser={currentUser} navigateTo={navigateTo} />}
          {currentScreen === 'ingreso' && <IngresoForm documents={documents} setDocuments={setDocuments} currentUser={currentUser} showNotification={showNotification} addHistorialEvent={addHistorialEvent} />}
          {currentScreen === 'bandeja' && <BandejaEvaluacion documents={documents} setDocuments={setDocuments} currentUser={currentUser} setSelectedDocId={setSelectedDocId} setCurrentScreen={setCurrentScreen} showNotification={showNotification} addHistorialEvent={addHistorialEvent} />}
          {currentScreen === 'evaluar' && selectedDoc && <EvaluarDocumento doc={selectedDoc} setDocuments={setDocuments} currentUser={currentUser} setCurrentScreen={setCurrentScreen} showNotification={showNotification} addHistorialEvent={addHistorialEvent} />}
          {currentScreen === 'caratula' && <CaratulaScreen documents={documents} setDocuments={setDocuments} currentUser={currentUser} showNotification={showNotification} addHistorialEvent={addHistorialEvent} />}
          {currentScreen === 'pases-entrantes' && <PasesEntrantes documents={documents} setDocuments={setDocuments} currentUser={currentUser} setSelectedDocId={setSelectedDocId} setSelectedPaseId={setSelectedPaseId} setCurrentScreen={setCurrentScreen} showNotification={showNotification} addHistorialEvent={addHistorialEvent} />}
          {currentScreen === 'recibir-pase' && selectedDoc && <RecibirPase doc={selectedDoc} paseId={selectedPaseId} setDocuments={setDocuments} currentUser={currentUser} setCurrentScreen={setCurrentScreen} showNotification={showNotification} addHistorialEvent={addHistorialEvent} />}
          {currentScreen === 'emitir-pase' && <EmitirPase documents={documents} setDocuments={setDocuments} currentUser={currentUser} showNotification={showNotification} addHistorialEvent={addHistorialEvent} />}
          {currentScreen === 'emitir-pase-doc' && selectedDoc && <EmitirPaseDoc doc={selectedDoc} setDocuments={setDocuments} currentUser={currentUser} setCurrentScreen={setCurrentScreen} showNotification={showNotification} addHistorialEvent={addHistorialEvent} />}
          {currentScreen === 'busqueda' && <Busqueda documents={filteredDocuments} role={currentRole} setSelectedDocId={setSelectedDocId} setCurrentScreen={setCurrentScreen} searchFilters={searchFilters} setSearchFilters={setSearchFilters} />}
          {currentScreen === 'historial' && <HistorialScreen documents={documents} role={currentRole} setSelectedDocId={setSelectedDocId} setCurrentScreen={setCurrentScreen} />}
          {currentScreen === 'detalle' && selectedDoc && <DetalleDocumento doc={selectedDoc} setCurrentScreen={setCurrentScreen} role={currentRole} />}
        
        </main>
      </div>
    </div>
  );
}

// ============ DASHBOARD ============
function Dashboard({ role, documents, currentUser, navigateTo }: { role: Role; documents: Documento[]; currentUser: typeof USUARIOS[0]; navigateTo: (s: Screen) => void }) {
  const today = new Date().toISOString().split('T')[0];

  if (role === 'supervisor') {
    const enTransito = documents.filter(d => d.estado === 'EN TRÁNSITO').length;
    const enTratamiento = documents.filter(d => d.estado === 'EN TRATAMIENTO').length;
    const observados = documents.filter(d => d.estado === 'RECIBIDO CON OBSERVACIÓN').length;
    return (
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-6">Panel Ejecutivo</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard title="Total documentos ingresados" value={documents.length} icon="fa-file-lines" color="blue" />
          <MetricCard title="Expedientes en tránsito" value={enTransito} icon="fa-truck" color="yellow" />
          <MetricCard title="En tratamiento" value={enTratamiento} icon="fa-folder-open" color="green" />
          <MetricCard title="Recibidos con observación" value={observados} icon="fa-exclamation-triangle" color="red" />
          <MetricCard title="Finalizados" value={documents.filter(d => d.estado === 'FINALIZADO').length} icon="fa-check-double" color="gray" />
          <MetricCard title="En despacho" value={documents.filter(d => d.estado === 'EN DESPACHO').length} icon="fa-inbox" color="blue" />
        </div>
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700"><i className="fas fa-info-circle mr-2"></i>Panel de solo lectura. Utilice la Búsqueda Global para consultar cualquier documento del sistema.</p>
        </div>
      </div>
    );
  }

  if (role === 'evaluador') {
    const pendientes = documents.filter(d => d.estado === 'EN DESPACHO').length;
    const observados = documents.filter(d => d.estado === 'OBSERVADO').length;
    return (
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-6">Bandeja de Evaluación - Resumen</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Pendientes de evaluación" value={pendientes} icon="fa-clock" color="yellow" />
          <MetricCard title="Documentos observados" value={observados} icon="fa-eye-slash" color="red" />
          <MetricCard title="En tratamiento (derivados)" value={documents.filter(d => d.estado === 'EN TRATAMIENTO').length} icon="fa-folder-open" color="green" />
          <MetricCard title="Total evaluados" value={documents.filter(d => d.historial.some(h => h.rol === 'Evaluador')).length} icon="fa-check" color="blue" />
        </div>
        <button onClick={() => navigateTo('bandeja')} className="mt-6 bg-[#1e3a5f] text-white px-6 py-3 rounded-lg hover:bg-blue-900 transition font-medium">
          <i className="fas fa-clipboard-check mr-2"></i>Ir a bandeja de evaluación
        </button>
      </div>
    );
  }

  if (role === 'recepcion') {
    const hoy = documents.filter(d => d.fechaIngreso === today).length;
    return (
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-6">Mesa de Entrada - Resumen</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard title="Ingresos registrados hoy" value={hoy || documents.filter(d => d.historial.some(h => h.accion.includes('Ingreso'))).length} icon="fa-file-circle-plus" color="green" />
          <MetricCard title="Pendientes de evaluación" value={documents.filter(d => d.estado === 'EN DESPACHO').length} icon="fa-hourglass-half" color="yellow" />
          <MetricCard title="Total en sistema" value={documents.length} icon="fa-database" color="blue" />
        </div>
        <button onClick={() => navigateTo('ingreso')} className="mt-6 bg-[#1e3a5f] text-white px-6 py-3 rounded-lg hover:bg-blue-900 transition font-medium">
          <i className="fas fa-file-circle-plus mr-2"></i>Nuevo ingreso
        </button>
      </div>
    );
  }

  if (role === 'caratulador') {
    return (
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-6">Operador de Caratulación - Resumen</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Pendientes de carátula" value={documents.filter(d => d.estado === 'PENDIENTE DE CARÁTULA').length} icon="fa-stamp" color="yellow" />
          <MetricCard title="Pases emitidos por Despacho" value={documents.reduce((acc, d) => acc + d.pases.filter(p => p.areaOrigen === 'Despacho').length, 0)} icon="fa-paper-plane" color="blue" />
          <MetricCard title="En tránsito" value={documents.filter(d => d.estado === 'EN TRÁNSITO').length} icon="fa-truck" color="orange" />
          <MetricCard title="En despacho (listos para pase)" value={documents.filter(d => d.estado === 'EN DESPACHO' && d.historial.some(h => h.accion.includes('Derivación') || h.accion.includes('Carátula'))).length} icon="fa-arrow-right" color="green" />
        </div>
        <div className="flex gap-3 mt-6 flex-wrap">
          <button onClick={() => navigateTo('ingreso')} className="bg-[#1e3a5f] text-white px-5 py-3 rounded-lg hover:bg-blue-900 transition font-medium">
            <i className="fas fa-file-circle-plus mr-2"></i>Nuevo ingreso
          </button>
          <button onClick={() => navigateTo('caratula')} className="bg-yellow-600 text-white px-5 py-3 rounded-lg hover:bg-yellow-700 transition font-medium">
            <i className="fas fa-stamp mr-2"></i>Registrar carátula
          </button>
          <button onClick={() => navigateTo('emitir-pase')} className="bg-green-600 text-white px-5 py-3 rounded-lg hover:bg-green-700 transition font-medium">
            <i className="fas fa-paper-plane mr-2"></i>Emitir pase
          </button>
        </div>
      </div>
    );
  }

  if (role === 'secretaria') {
    const pasesEntrantes = documents.filter(d => d.pases.some(p => p.areaDestino === currentUser.area && p.estado === 'PENDIENTE DE RECEPCIÓN')).length;
    return (
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-6">Secretaría - Resumen de Pases</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Pases entrantes pendientes" value={pasesEntrantes} icon="fa-inbox" color="yellow" />
          <MetricCard title="En tratamiento en el área" value={documents.filter(d => d.areaActual === currentUser.area && d.estado === 'EN TRATAMIENTO').length} icon="fa-folder-open" color="green" />
          <MetricCard title="Pases emitidos por el área" value={documents.reduce((acc, d) => acc + d.pases.filter(p => p.areaOrigen === currentUser.area).length, 0)} icon="fa-paper-plane" color="blue" />
          <MetricCard title="Recibidos con observación" value={documents.filter(d => d.estado === 'RECIBIDO CON OBSERVACIÓN').length} icon="fa-exclamation-triangle" color="red" />
        </div>
        <div className="flex gap-3 mt-6 flex-wrap">
          <button onClick={() => navigateTo('pases-entrantes')} className="bg-yellow-600 text-white px-5 py-3 rounded-lg hover:bg-yellow-700 transition font-medium">
            <i className="fas fa-inbox mr-2"></i>Confirmar recepción
          </button>
          <button onClick={() => navigateTo('emitir-pase')} className="bg-green-600 text-white px-5 py-3 rounded-lg hover:bg-green-700 transition font-medium">
            <i className="fas fa-paper-plane mr-2"></i>Emitir pase
          </button>
        </div>
      </div>
    );
  }

  return null;
}

function MetricCard({ title, value, icon, color }: { title: string; value: number; icon: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    gray: 'bg-gray-50 border-gray-200 text-gray-700',
  };
  const iconColors: Record<string, string> = {
    blue: 'text-blue-500', green: 'text-green-500', yellow: 'text-yellow-500',
    red: 'text-red-500', orange: 'text-orange-500', purple: 'text-purple-500', gray: 'text-gray-500',
  };
  return (
    <div className={`p-4 rounded-xl border ${colors[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide opacity-80">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <i className={`fas ${icon} text-3xl opacity-50 ${iconColors[color]}`}></i>
      </div>
    </div>
  );
}

// ============ INGRESO ============
function IngresoForm({ documents, setDocuments, currentUser, showNotification, addHistorialEvent }: { documents: Documento[]; setDocuments: React.Dispatch<React.SetStateAction<Documento[]>>; currentUser: typeof USUARIOS[0]; showNotification: (type: 'success' | 'error' | 'warning', msg: string) => void; addHistorialEvent: (docId: string, event: Omit<EventoHistorial, 'id'>) => void }) {
  const [tipo, setTipo] = useState<TipoDocumental>('Expediente');
  const [form, setForm] = useState({
    remitente: '', tipoRemitente: 'Persona' as 'Persona' | 'Organismo', nombreRazonSocial: '',
    dni: '', cuil: '', asunto: '', cantidadFojas: '', identificadorGDE: '', identificadorSIGEP: '',
    areaDestinoSugerida: '', areaEmisora: '', observaciones: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.remitente) errs.remitente = 'El remitente es obligatorio';
    if (!form.asunto) errs.asunto = 'El asunto es obligatorio';
    if (!form.cantidadFojas || parseInt(form.cantidadFojas) <= 0) errs.cantidadFojas = 'La cantidad de fojas debe ser mayor a 0';
    if (tipo === 'Expediente' && form.tipoRemitente === 'Persona' && form.cuil && !/^\d{2}-\d{7,8}-\d$/.test(form.cuil)) errs.cuil = 'Formato CUIL inválido (ej: 20-12345678-9)';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const now = getNow();
    const numeroInterno = getNextDocNumber();
    const newDoc: Documento = {
      id: `doc-${Date.now()}`,
      numeroInterno,
      tipoDocumental: tipo,
      remitente: form.remitente,
      tipoRemitente: form.tipoRemitente,
      nombreRazonSocial: form.nombreRazonSocial || form.remitente,
      dni: form.dni || undefined,
      cuil: form.cuil || undefined,
      asunto: form.asunto,
      fechaIngreso: now.fecha,
      horaIngreso: now.hora,
      cantidadFojas: parseInt(form.cantidadFojas),
      identificadorGDE: form.identificadorGDE || undefined,
      identificadorSIGEP: form.identificadorSIGEP || undefined,
      areaDestinoSugerida: form.areaDestinoSugerida || undefined,
      areaActual: 'Mesa de Entrada',
      responsableActual: currentUser.nombre,
      estado: 'EN DESPACHO',
      observaciones: form.observaciones || undefined,
      historial: [{
        id: getNextHistId(),
        fecha: now.fecha,
        hora: now.hora,
        accion: 'Ingreso por Mesa de Entrada',
        usuario: currentUser.nombre,
        rol: ROLES_LABELS[currentUser.rol],
        area: currentUser.area,
        estadoAnterior: 'N/A',
        estadoNuevo: 'EN DESPACHO',
        fojasEnviadas: parseInt(form.cantidadFojas),
        detalles: `Fojas: ${form.cantidadFojas}`,
      }],
      pases: [],
    };
    setDocuments((prev: Documento[]) => [...prev, newDoc]);
    showNotification('success', `El ingreso fue registrado correctamente. Número interno generado: ${numeroInterno}. El documento pasó a estado EN DESPACHO.`);
    setForm({ remitente: '', tipoRemitente: 'Persona', nombreRazonSocial: '', dni: '', cuil: '', asunto: '', cantidadFojas: '', identificadorGDE: '', identificadorSIGEP: '', areaDestinoSugerida: '', areaEmisora: '', observaciones: '' });
  };

  const now = getNow();

  return (
    <div className="max-w-4xl">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Registrar Nuevo Ingreso</h3>
        <p className="text-sm text-gray-500 mb-6"><i className="fas fa-info-circle mr-1"></i>Complete los datos del documento. Los campos marcados con * son obligatorios.</p>

        {/* Tipo Documental */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo documental *</label>
          <select value={tipo} onChange={e => setTipo(e.target.value as TipoDocumental)} className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500">
            <option value="Nota">Nota</option>
            <option value="Expediente">Expediente</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Remitente */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Remitente *</label>
            <input type="text" value={form.remitente} onChange={e => updateField('remitente', e.target.value)} className={`w-full border rounded-lg px-4 py-2.5 text-sm ${errors.remitente ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500`} placeholder="Nombre del remitente" />
            {errors.remitente && <p className="text-xs text-red-600 mt-1">{errors.remitente}</p>}
          </div>

          {/* Tipo de Remitente (solo Expediente) */}
          {tipo === 'Expediente' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo de remitente</label>
              <select value={form.tipoRemitente} onChange={e => updateField('tipoRemitente', e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500">
                <option value="Persona">Persona</option>
                <option value="Organismo">Organismo</option>
              </select>
            </div>
          )}

          {/* Nombre/Razón Social */}
          {tipo === 'Expediente' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre o razón social</label>
              <input type="text" value={form.nombreRazonSocial} onChange={e => updateField('nombreRazonSocial', e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
          )}

          {/* DNI (solo Expediente Persona) */}
          {tipo === 'Expediente' && form.tipoRemitente === 'Persona' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">DNI (opcional)</label>
              <input type="text" value={form.dni} onChange={e => updateField('dni', e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500" placeholder="Sin puntos" />
            </div>
          )}

          {/* CUIL (solo Expediente) */}
          {tipo === 'Expediente' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">CUIL (importante para legajos)</label>
              <input type="text" value={form.cuil} onChange={e => updateField('cuil', e.target.value)} className={`w-full border rounded-lg px-4 py-2.5 text-sm ${errors.cuil ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500`} placeholder="XX-XXXXXXXX-X" />
              {errors.cuil && <p className="text-xs text-red-600 mt-1">{errors.cuil}</p>}
            </div>
          )}

          {/* Asunto */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Asunto *</label>
            <input type="text" value={form.asunto} onChange={e => updateField('asunto', e.target.value)} className={`w-full border rounded-lg px-4 py-2.5 text-sm ${errors.asunto ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500`} placeholder="Descripción breve del asunto" />
            {errors.asunto && <p className="text-xs text-red-600 mt-1">{errors.asunto}</p>}
          </div>

          {/* Área destino sugerida (solo Nota) */}
          {tipo === 'Nota' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Área destino sugerida</label>
              <select value={form.areaDestinoSugerida} onChange={e => updateField('areaDestinoSugerida', e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500">
                <option value="">Seleccionar área...</option>
                {AREAS.filter(a => a.id !== 'mesa').map(a => <option key={a.id} value={a.nombre}>{a.nombre}</option>)}
              </select>
            </div>
          )}

          {/* Fecha/Hora */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha de ingreso</label>
            <input type="date" value={now.fecha} readOnly className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Hora de ingreso</label>
            <input type="time" value={now.hora} readOnly className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50" />
          </div>

          {/* Cantidad de fojas */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Cantidad de fojas *</label>
            <input type="number" min="1" value={form.cantidadFojas} onChange={e => updateField('cantidadFojas', e.target.value)} className={`w-full border rounded-lg px-4 py-2.5 text-sm ${errors.cantidadFojas ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500`} placeholder="Número de fojas" />
            {errors.cantidadFojas && <p className="text-xs text-red-600 mt-1">{errors.cantidadFojas}</p>}
          </div>

          {/* GDE (solo Expediente) */}
          {tipo === 'Expediente' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Identificador GDE (opcional)</label>
              <input type="text" value={form.identificadorGDE} onChange={e => updateField('identificadorGDE', e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500" placeholder="Ej: EX-2026-000000XXX" />
            </div>
          )}

          {/* SIGEP (solo Expediente) */}
          {tipo === 'Expediente' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Identificador SIGEP (opcional)</label>
              <input type="text" value={form.identificadorSIGEP} onChange={e => updateField('identificadorSIGEP', e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500" placeholder="Ej: SIG-2026-XXX" />
            </div>
          )}

          {/* Observaciones */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Observaciones (opcional)</label>
            <textarea value={form.observaciones} onChange={e => updateField('observaciones', e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500" rows={3} placeholder="Observaciones adicionales..." />
          </div>

          {/* Adjuntar PDF */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Adjuntar PDF (simulado)</label>
            <input type="file" accept=".pdf" className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-500" />
          </div>
        </div>

        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
          <button onClick={handleSubmit} className="bg-[#16a34a] text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-medium text-sm">
            <i className="fas fa-save mr-2"></i>Guardar y enviar a evaluación
          </button>
          <button onClick={() => setForm({ remitente: '', tipoRemitente: 'Persona', nombreRazonSocial: '', dni: '', cuil: '', asunto: '', cantidadFojas: '', identificadorGDE: '', identificadorSIGEP: '', areaDestinoSugerida: '', areaEmisora: '', observaciones: '' })} className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition font-medium text-sm">
            <i className="fas fa-times mr-2"></i>Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ BANDEJA DE EVALUACIÓN ============
function BandejaEvaluacion({ documents, setDocuments, currentUser, setSelectedDocId, setCurrentScreen, showNotification, addHistorialEvent }: { documents: Documento[]; setDocuments: React.Dispatch<React.SetStateAction<Documento[]>>; currentUser: typeof USUARIOS[0]; setSelectedDocId: (id: string | null) => void; setCurrentScreen: (s: Screen) => void; showNotification: (type: 'success' | 'error' | 'warning', msg: string) => void; addHistorialEvent: (docId: string, event: Omit<EventoHistorial, 'id'>) => void }) {
  const pendientes = documents.filter((d: Documento) => d.estado === 'EN DESPACHO');

  const handleEvaluar = (docId: string) => {
    setSelectedDocId(docId);
    setCurrentScreen('evaluar');
  };

  return (
    <div>
      <h3 className="text-lg font-bold text-gray-800 mb-4">Bandeja de Evaluación</h3>
      <p className="text-sm text-gray-500 mb-4">Documentos pendientes de evaluación por Despacho. Seleccione un documento para evaluarlo.</p>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">N° Interno</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Tipo</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Remitente</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Asunto</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Fecha ingreso</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Fojas</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Estado</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Antigüedad</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Acción</th>
              </tr>
            </thead>
            <tbody>
              {pendientes.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-8 text-gray-400">No hay documentos pendientes de evaluación.</td></tr>
              ) : pendientes.map((doc: Documento) => {
                const days = Math.floor((Date.now() - new Date(doc.fechaIngreso).getTime()) / 86400000);
                return (
                  <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{doc.numeroInterno}</td>
                    <td className="px-4 py-3">{doc.tipoDocumental}</td>
                    <td className="px-4 py-3">{doc.remitente}</td>
                    <td className="px-4 py-3 max-w-[200px] truncate">{doc.asunto}</td>
                    <td className="px-4 py-3">{doc.fechaIngreso}</td>
                    <td className="px-4 py-3 text-center">{doc.cantidadFojas}</td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={doc.estado} /></td>
                    <td className="px-4 py-3 text-center">{days} días</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleEvaluar(doc.id)} className="bg-[#1e3a5f] text-white px-3 py-1.5 rounded text-xs hover:bg-blue-900 transition">
                        <i className="fas fa-clipboard-check mr-1"></i>Evaluar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============ EVALUAR DOCUMENTO ============
function EvaluarDocumento({ doc, setDocuments, currentUser, setCurrentScreen, showNotification, addHistorialEvent }: any) {
  const [decision, setDecision] = useState<DecisionEvaluacion | ''>('');
  const [areaDestino, setAreaDestino] = useState('');
  const [plazoDias, setPlazoDias] = useState(6);
  const [observaciones, setObservaciones] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!decision) errs.decision = 'Debe seleccionar una decisión';
    if (decision === 'Derivación directa' && !areaDestino) errs.areaDestino = 'Debe seleccionar un área destino';
    if (decision === 'Rechazar / Devolver' && !observaciones.trim()) errs.observaciones = 'Las observaciones son obligatorias al devolver';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleConfirm = () => {
    if (!validate()) return;
    const now = getNow();
    let newEstado: EstadoDocumento;
    let accion: string;

    if (decision === 'Requiere carátula') {
      newEstado = 'PENDIENTE DE CARÁTULA';
      accion = 'Evaluado - Requiere carátula';
    } else if (decision === 'Derivación directa') {
      newEstado = 'EN DESPACHO';
      accion = `Evaluado - Derivación directa a ${areaDestino}`;
    } else {
      newEstado = 'OBSERVADO';
      accion = 'Evaluado - Rechazar / Devolver';
    }

    setDocuments((prev: Documento[]) => prev.map(d => {
      if (d.id === doc.id) {
        return {
          ...d,
          estado: newEstado,
          areaDestinoSugerida: decision === 'Derivación directa' ? areaDestino : d.areaDestinoSugerida,
          plazoDias: plazoDias,
          observaciones: observaciones || d.observaciones,
          historial: [...d.historial, {
            id: getNextHistId(), fecha: now.fecha, hora: now.hora,
            accion, usuario: currentUser.nombre, rol: ROLES_LABELS[currentUser.rol],
            area: currentUser.area, estadoAnterior: doc.estado, estadoNuevo: newEstado,
            observaciones: observaciones || undefined,
            detalles: decision === 'Derivación directa' ? `Derivado a: ${areaDestino}` : undefined,
          }]
        };
      }
      return d;
    }));

    showNotification('success', `Evaluación registrada. El documento pasó a estado: ${newEstado}.`);
    setCurrentScreen('bandeja');
  };

  return (
    <div>
      <button onClick={() => setCurrentScreen('bandeja')} className="text-sm text-blue-600 hover:underline mb-4 inline-flex items-center">
        <i className="fas fa-arrow-left mr-1"></i>Volver a bandeja
      </button>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h4 className="text-sm font-bold text-gray-700 mb-3">Vista previa del documento</h4>
          <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <i className="fas fa-file-pdf text-5xl mb-3"></i>
              <p className="text-sm">Vista previa del documento PDF</p>
              <p className="text-xs mt-1">({doc.numeroInterno})</p>
            </div>
          </div>
        </div>

        {/* Details & Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h4 className="text-sm font-bold text-gray-700 mb-4">Datos del documento</h4>
          <div className="grid grid-cols-2 gap-3 text-sm mb-6">
            <div><span className="text-gray-500">N° Interno:</span> <span className="font-mono font-semibold">{doc.numeroInterno}</span></div>
            <div><span className="text-gray-500">Tipo:</span> <span className="font-medium">{doc.tipoDocumental}</span></div>
            <div><span className="text-gray-500">Remitente:</span> <span className="font-medium">{doc.remitente}</span></div>
            <div><span className="text-gray-500">CUIL/DNI:</span> <span className="font-medium">{doc.cuil || doc.dni || 'N/A'}</span></div>
            <div className="col-span-2"><span className="text-gray-500">Asunto:</span> <span className="font-medium">{doc.asunto}</span></div>
            <div><span className="text-gray-500">Fojas:</span> <span className="font-medium">{doc.cantidadFojas}</span></div>
            <div><span className="text-gray-500">Fecha/Hora:</span> <span className="font-medium">{doc.fechaIngreso} {doc.horaIngreso}</span></div>
            {doc.identificadorGDE && <div><span className="text-gray-500">GDE:</span> <span className="font-mono text-xs">{doc.identificadorGDE}</span></div>}
            {doc.identificadorSIGEP && <div><span className="text-gray-500">SIGEP:</span> <span className="font-mono text-xs">{doc.identificadorSIGEP}</span></div>}
          </div>

          <hr className="my-4" />
          <h4 className="text-sm font-bold text-gray-700 mb-4">Formulario de evaluación</h4>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Decisión *</label>
              <select value={decision} onChange={e => { setDecision(e.target.value as DecisionEvaluacion); setErrors({}); }} className={`w-full border rounded-lg px-4 py-2.5 text-sm ${errors.decision ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500`}>
                <option value="">Seleccionar decisión...</option>
                <option value="Requiere carátula">Requiere carátula</option>
                <option value="Derivación directa">Derivación directa</option>
                <option value="Rechazar / Devolver">Rechazar / Devolver</option>
              </select>
              {errors.decision && <p className="text-xs text-red-600 mt-1">{errors.decision}</p>}
            </div>

            {decision === 'Derivación directa' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Área destino *</label>
                <select value={areaDestino} onChange={e => setAreaDestino(e.target.value)} className={`w-full border rounded-lg px-4 py-2.5 text-sm ${errors.areaDestino ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500`}>
                  <option value="">Seleccionar área...</option>
                  {AREAS.filter(a => a.id !== 'mesa' && a.id !== 'despacho').map(a => <option key={a.id} value={a.nombre}>{a.nombre}</option>)}
                </select>
                {errors.areaDestino && <p className="text-xs text-red-600 mt-1">{errors.areaDestino}</p>}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Plazo de respuesta (días hábiles)</label>
              <input type="number" min="1" max="60" value={plazoDias} onChange={e => setPlazoDias(parseInt(e.target.value) || 6)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500" />
              <p className="text-xs text-gray-400 mt-1">Por defecto 6 días. Máximo 60 días hábiles.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Observaciones {decision === 'Rechazar / Devolver' ? '*' : '(opcional)'}</label>
              <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} className={`w-full border rounded-lg px-4 py-2.5 text-sm ${errors.observaciones ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500`} rows={3} placeholder="Observaciones de la evaluación..." />
              {errors.observaciones && <p className="text-xs text-red-600 mt-1">{errors.observaciones}</p>}
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
            <button onClick={handleConfirm} className="bg-[#1e3a5f] text-white px-6 py-3 rounded-lg hover:bg-blue-900 transition font-medium text-sm">
              <i className="fas fa-check mr-2"></i>Confirmar evaluación
            </button>
            <button onClick={() => setCurrentScreen('bandeja')} className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition font-medium text-sm">
              <i className="fas fa-times mr-2"></i>Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ CARÁTULA ============
function CaratulaScreen({ documents, setDocuments, currentUser, showNotification, addHistorialEvent }: any) {
  const pendientes = documents.filter((d: Documento) => d.estado === 'PENDIENTE DE CARÁTULA');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [caratula, setCaratula] = useState('');
  const [gde, setGde] = useState('');
  const [sigep, setSigep] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedDoc = documents.find((d: Documento) => d.id === selectedId);

  const handleRegistrar = () => {
    if (!caratula.trim()) { setErrors({ caratula: 'La carátula es obligatoria' }); return; }
    const now = getNow();
    setDocuments((prev: Documento[]) => prev.map((d: Documento) => {
      if (d.id === selectedId) {
        const newHist: EventoHistorial[] = [{
          id: getNextHistId(), fecha: now.fecha, hora: now.hora,
          accion: 'Carátula registrada', usuario: currentUser.nombre, rol: ROLES_LABELS[currentUser.rol],
          area: currentUser.area, estadoAnterior: 'PENDIENTE DE CARÁTULA', estadoNuevo: 'EN DESPACHO',
          detalles: `Carátula: ${caratula}${gde ? `. Vinculado GDE: ${gde}` : ''}${sigep ? `. Vinculado SIGEP: ${sigep}` : ''}`,
        }];
        return {
          ...d, estado: 'EN DESPACHO' as EstadoDocumento, caratula,
          identificadorGDE: gde || d.identificadorGDE,
          identificadorSIGEP: sigep || d.identificadorSIGEP,
          historial: [...d.historial, ...newHist],
        };
      }
      return d;
    }));
    showNotification('success', `Carátula registrada correctamente. El expediente pasó a estado EN DESPACHO.`);
    setSelectedId(null); setCaratula(''); setGde(''); setSigep(''); setErrors({});
  };

  return (
    <div>
      <h3 className="text-lg font-bold text-gray-800 mb-4">Carátula / Vinculación</h3>
      <p className="text-sm text-gray-500 mb-4">Expedientes pendientes de carátula formal. Seleccione uno para registrar la carátula y vincular identificadores externos.</p>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">N° Interno</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Remitente</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Asunto</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Fecha ingreso</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-700">Estado</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-700">Acción</th>
            </tr>
          </thead>
          <tbody>
            {pendientes.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">No hay expedientes pendientes de carátula.</td></tr>
            ) : pendientes.map((doc: Documento) => (
              <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{doc.numeroInterno}</td>
                <td className="px-4 py-3">{doc.remitente}</td>
                <td className="px-4 py-3 max-w-[200px] truncate">{doc.asunto}</td>
                <td className="px-4 py-3">{doc.fechaIngreso}</td>
                <td className="px-4 py-3 text-center"><StatusBadge status={doc.estado} /></td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => setSelectedId(doc.id)} className="bg-yellow-600 text-white px-3 py-1.5 rounded text-xs hover:bg-yellow-700 transition">
                    <i className="fas fa-stamp mr-1"></i>Registrar carátula
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedId && selectedDoc && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl">
          <h4 className="text-sm font-bold text-gray-700 mb-4">Registrar Carátula - {selectedDoc.numeroInterno}</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Número interno</label>
              <input type="text" value={selectedDoc.numeroInterno} readOnly className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50 font-mono" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Carátula resumida *</label>
              <textarea value={caratula} onChange={e => setCaratula(e.target.value)} className={`w-full border rounded-lg px-4 py-2.5 text-sm ${errors.caratula ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500`} rows={3} placeholder="Ej: Pérez, Juan c/ Estado Provincial s/ Habilitación" />
              {errors.caratula && <p className="text-xs text-red-600 mt-1">{errors.caratula}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Vincular número GDE (opcional)</label>
              <input type="text" value={gde} onChange={e => setGde(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm" placeholder="Ej: EX-2026-000000XXX" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Vincular número SIGEP (opcional)</label>
              <input type="text" value={sigep} onChange={e => setSigep(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm" placeholder="Ej: SIG-2026-XXX" />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={handleRegistrar} className="bg-[#1e3a5f] text-white px-6 py-3 rounded-lg hover:bg-blue-900 transition font-medium text-sm">
              <i className="fas fa-stamp mr-2"></i>Registrar carátula y vincular
            </button>
            <button onClick={() => { setSelectedId(null); setCaratula(''); setGde(''); setSigep(''); setErrors({}); }} className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition font-medium text-sm">
              <i className="fas fa-times mr-2"></i>Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ PASES ENTRANTES ============
function PasesEntrantes({ documents, setDocuments, currentUser, setSelectedDocId, setSelectedPaseId, setCurrentScreen, showNotification, addHistorialEvent }: any) {
  const pasesPendientes = documents.filter((d: Documento) =>
    d.pases.some((p: Pase) => p.areaDestino === currentUser.area && p.estado === 'PENDIENTE DE RECEPCIÓN')
  );

  const handleRecibir = (docId: string, paseId: string) => {
    setSelectedDocId(docId);
    setSelectedPaseId(paseId);
    setCurrentScreen('recibir-pase');
  };

  return (
    <div>
      <h3 className="text-lg font-bold text-gray-800 mb-4">Pases Entrantes</h3>
      <p className="text-sm text-gray-500 mb-4">Pases pendientes de recepción en su área. Confirme la recepción verificando la cantidad de fojas.</p>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">N° Interno</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Tipo</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Área origen</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Fecha emisión</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-700">Fojas enviadas</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-700">Estado</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-700">Acción</th>
            </tr>
          </thead>
          <tbody>
            {pasesPendientes.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">No hay pases pendientes de recepción.</td></tr>
            ) : pasesPendientes.map((doc: Documento) => {
              const pase = doc.pases.find((p: Pase) => p.areaDestino === currentUser.area && p.estado === 'PENDIENTE DE RECEPCIÓN');
              if (!pase) return null;
              return (
                <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{doc.numeroInterno}</td>
                  <td className="px-4 py-3">{doc.tipoDocumental}</td>
                  <td className="px-4 py-3">{pase.areaOrigen}</td>
                  <td className="px-4 py-3">{pase.fechaEmision}</td>
                  <td className="px-4 py-3 text-center font-semibold">{pase.fojasEnviadas}</td>
                  <td className="px-4 py-3 text-center"><span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">PENDIENTE DE RECEPCIÓN</span></td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleRecibir(doc.id, pase.id)} className="bg-green-600 text-white px-3 py-1.5 rounded text-xs hover:bg-green-700 transition">
                      <i className="fas fa-check mr-1"></i>Confirmar recepción
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ RECIBIR PASE ============
function RecibirPase({ doc, paseId, setDocuments, currentUser, setCurrentScreen, showNotification, addHistorialEvent }: any) {
  const pase = doc.pases.find((p: Pase) => p.id === paseId);
  const [fojasRecibidas, setFojasRecibidas] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [error, setError] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('');

  if (!pase) return <p>Pase no encontrado.</p>;

  const fojasNum = parseInt(fojasRecibidas) || 0;
  const coincide = fojasNum === pase.fojasEnviadas && fojasNum > 0;
  const noCoincide = fojasNum > 0 && fojasNum !== pase.fojasEnviadas;

  const handleConfirmar = () => {
    if (!fojasRecibidas || fojasNum <= 0) { setError('Debe ingresar la cantidad de fojas recibidas'); return; }
    if (noCoincide && !observaciones.trim()) { setError('Debe registrar la discrepancia en observaciones'); return; }

    const now = getNow();
    const newEstado: EstadoDocumento = noCoincide ? 'RECIBIDO CON OBSERVACIÓN' : 'EN TRATAMIENTO';
    const newPaseEstado = noCoincide ? 'RECIBIDO CON OBSERVACIÓN' : 'RECIBIDO';

    setDocuments((prev: Documento[]) => prev.map((d: Documento) => {
      if (d.id === doc.id) {
        return {
          ...d,
          estado: newEstado,
          areaActual: currentUser.area,
          responsableActual: currentUser.nombre,
          pases: d.pases.map((p: Pase) => p.id === paseId ? { ...p, estado: newPaseEstado as any, fojasRecibidas: fojasNum, fechaRecepcion: now.fecha, horaRecepcion: now.hora, usuarioReceptor: currentUser.nombre, observaciones: observaciones || p.observaciones } : p),
          historial: [...d.historial, {
            id: getNextHistId(), fecha: now.fecha, hora: now.hora,
            accion: noCoincide ? 'Recepción confirmada con observación' : 'Recepción confirmada',
            usuario: currentUser.nombre, rol: ROLES_LABELS[currentUser.rol],
            area: currentUser.area, estadoAnterior: 'EN TRÁNSITO', estadoNuevo: newEstado,
            fojasEnviadas: pase.fojasEnviadas, fojasRecibidas: fojasNum,
            observaciones: observaciones || undefined,
            detalles: noCoincide ? `Discrepancia: enviadas ${pase.fojasEnviadas}, recibidas ${fojasNum}` : `Fojas recibidas: ${fojasNum} - Coincide`,
          }]
        };
      }
      return d;
    }));

    showNotification(noCoincide ? 'warning' : 'success', noCoincide ? `Recepción confirmada con observación. Discrepancia de fojas registrada.` : `Recepción confirmada correctamente. Fojas recibidas: ${fojasNum}.`);
    setCurrentScreen('pases-entrantes');
  };

  const handleRechazar = () => {
    if (!motivoRechazo.trim()) { setError('Debe ingresar un motivo de rechazo'); return; }
    const now = getNow();

    setDocuments((prev: Documento[]) => prev.map((d: Documento) => {
      if (d.id === doc.id) {
        return {
          ...d,
          pases: d.pases.map((p: Pase) => p.id === paseId ? { ...p, estado: 'RECHAZADO' as any, observaciones: motivoRechazo } : p),
          historial: [...d.historial, {
            id: getNextHistId(), fecha: now.fecha, hora: now.hora,
            accion: 'Pase rechazado / devuelto',
            usuario: currentUser.nombre, rol: ROLES_LABELS[currentUser.rol],
            area: currentUser.area, estadoAnterior: 'EN TRÁNSITO', estadoNuevo: 'EN TRÁNSITO',
            observaciones: motivoRechazo,
            detalles: `Pase rechazado. Motivo: ${motivoRechazo}. La responsabilidad permanece en ${pase.areaOrigen}.`,
          }]
        };
      }
      return d;
    }));

    showNotification('warning', `Pase rechazado. El documento permanece en ${pase.areaOrigen}.`);
    setCurrentScreen('pases-entrantes');
  };

  return (
    <div className="max-w-2xl">
      <button onClick={() => setCurrentScreen('pases-entrantes')} className="text-sm text-blue-600 hover:underline mb-4 inline-flex items-center">
        <i className="fas fa-arrow-left mr-1"></i>Volver a pases entrantes
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Confirmar Recepción de Pase</h3>
        <p className="text-sm text-gray-500 mb-6">Documento: <span className="font-mono font-semibold">{doc.numeroInterno}</span> — {doc.tipoDocumental}</p>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded-lg"><span className="text-gray-500">Área origen:</span> <span className="font-medium">{pase.areaOrigen}</span></div>
            <div className="bg-gray-50 p-3 rounded-lg"><span className="text-gray-500">Fecha emisión:</span> <span className="font-medium">{pase.fechaEmision} {pase.horaEmision}</span></div>
            <div className="bg-gray-50 p-3 rounded-lg"><span className="text-gray-500">Fojas enviadas:</span> <span className="font-bold text-lg">{pase.fojasEnviadas}</span></div>
            <div className="bg-gray-50 p-3 rounded-lg"><span className="text-gray-500">Plazo:</span> <span className="font-medium">{pase.plazoDias} días hábiles</span></div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Cantidad de fojas recibidas *</label>
            <input type="number" min="0" value={fojasRecibidas} onChange={e => { setFojasRecibidas(e.target.value); setError(''); }} className={`w-full border rounded-lg px-4 py-2.5 text-sm ${error ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500`} placeholder="Ingrese fojas recibidas" />
          </div>

          {/* Indicador de coincidencia */}
          {coincide && (
            <div className="bg-green-50 border border-green-300 rounded-lg p-3 flex items-center gap-2">
              <i className="fas fa-check-circle text-green-600"></i>
              <p className="text-sm text-green-700 font-medium">La cantidad de fojas recibidas coincide con la registrada en el pase.</p>
            </div>
          )}
          {noCoincide && (
            <div className="bg-red-50 border border-red-300 rounded-lg p-3 flex items-center gap-2">
              <i className="fas fa-exclamation-triangle text-red-600"></i>
              <p className="text-sm text-red-700 font-medium">La cantidad de fojas recibidas no coincide con la cantidad enviada. Debe registrar la discrepancia en observaciones.</p>
            </div>
          )}

          {noCoincide && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Observaciones (obligatorio por discrepancia) *</label>
              <textarea value={observaciones} onChange={e => { setObservaciones(e.target.value); setError(''); }} className={`w-full border rounded-lg px-4 py-2.5 text-sm ${error ? 'border-red-500' : 'border-red-300'} focus:ring-2 focus:ring-red-500`} rows={3} placeholder="Describa la discrepancia encontrada..." />
            </div>
          )}

          {coincide && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Observaciones (opcional)</label>
              <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm" rows={2} placeholder="Observaciones adicionales..." />
            </div>
          )}

          {error && <p className="text-xs text-red-600">{error}</p>}

          {/* Reject section */}
          {showReject && (
            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <label className="block text-sm font-semibold text-red-700 mb-1">Motivo de rechazo *</label>
              <textarea value={motivoRechazo} onChange={e => setMotivoRechazo(e.target.value)} className="w-full border border-red-300 rounded-lg px-4 py-2.5 text-sm" rows={2} placeholder="Indique el motivo del rechazo..." />
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 flex-wrap">
          <button onClick={handleConfirmar} className={`px-6 py-3 rounded-lg transition font-medium text-sm ${noCoincide ? 'bg-yellow-600 text-white hover:bg-yellow-700' : 'bg-green-600 text-white hover:bg-green-700'}`}>
            <i className="fas fa-check mr-2"></i>{noCoincide ? 'Confirmar con observación' : 'Confirmar recepción'}
          </button>
          {!showReject ? (
            <button onClick={() => setShowReject(true)} className="bg-red-100 text-red-700 px-6 py-3 rounded-lg hover:bg-red-200 transition font-medium text-sm">
              <i className="fas fa-times mr-2"></i>Rechazar / Devolver
            </button>
          ) : (
            <button onClick={handleRechazar} className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition font-medium text-sm">
              <i className="fas fa-ban mr-2"></i>Confirmar rechazo
            </button>
          )}
          <button onClick={() => setCurrentScreen('pases-entrantes')} className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition font-medium text-sm">
            <i className="fas fa-times mr-2"></i>Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ EMITIR PASE ============
function EmitirPase({ documents, setDocuments, currentUser, showNotification, addHistorialEvent }: any) {
  const elegibles = documents.filter((d: Documento) => d.estado === 'EN DESPACHO' || d.estado === 'EN TRATAMIENTO');
  const [docId, setDocId] = useState('');
  const [areaDestino, setAreaDestino] = useState('');
  const [fojas, setFojas] = useState('');
  const [plazoDias, setPlazoDias] = useState(6);
  const [observaciones, setObservaciones] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedDoc = documents.find((d: Documento) => d.id === docId);

  const handleEmitir = () => {
    const errs: Record<string, string> = {};
    if (!docId) errs.docId = 'Seleccione un documento';
    if (!areaDestino) errs.areaDestino = 'Seleccione un área destino';
    if (!fojas || parseInt(fojas) <= 0) errs.fojas = 'Las fojas deben ser mayor a 0';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const now = getNow();
    const paseId = getNextPaseId();
    const newPase: Pase = {
      id: paseId, documentoId: docId, numeroInterno: selectedDoc.numeroInterno,
      areaOrigen: currentUser.area, areaDestino,
      fojasEnviadas: parseInt(fojas), plazoDias,
      fechaEmision: now.fecha, horaEmision: now.hora,
      usuarioEmisor: currentUser.nombre, estado: 'PENDIENTE DE RECEPCIÓN',
      observaciones: observaciones || undefined,
    };

    setDocuments((prev: Documento[]) => prev.map((d: Documento) => {
      if (d.id === docId) {
        return {
          ...d, estado: 'EN TRÁNSITO' as EstadoDocumento,
          pases: [...d.pases, newPase],
          historial: [...d.historial, {
            id: getNextHistId(), fecha: now.fecha, hora: now.hora,
            accion: 'Pase emitido', usuario: currentUser.nombre, rol: ROLES_LABELS[currentUser.rol],
            area: currentUser.area, estadoAnterior: d.estado, estadoNuevo: 'EN TRÁNSITO',
            fojasEnviadas: parseInt(fojas),
            detalles: `De: ${currentUser.area} → ${areaDestino}`,
          }]
        };
      }
      return d;
    }));

    showNotification('success', `Pase emitido correctamente. El documento pasó a estado EN TRÁNSITO. Destino: ${areaDestino}.`);
    setDocId(''); setAreaDestino(''); setFojas(''); setPlazoDias(6); setObservaciones(''); setErrors({});
  };

  return (
    <div className="max-w-3xl">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Emitir Pase</h3>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-700"><i className="fas fa-info-circle mr-2"></i>La responsabilidad del documento seguirá siendo del área de origen hasta que el área destino confirme la recepción.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Documento *</label>
            <select value={docId} onChange={e => { setDocId(e.target.value); setErrors({}); }} className={`w-full border rounded-lg px-4 py-2.5 text-sm ${errors.docId ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500`}>
              <option value="">Seleccionar documento...</option>
              {elegibles.map((d: Documento) => <option key={d.id} value={d.id}>{d.numeroInterno} - {d.tipoDocumental} - {d.remitente}</option>)}
            </select>
            {errors.docId && <p className="text-xs text-red-600 mt-1">{errors.docId}</p>}
          </div>

          {selectedDoc && (
            <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg">
              <div><span className="text-gray-500">N° Interno:</span> <span className="font-mono font-semibold">{selectedDoc.numeroInterno}</span></div>
              <div><span className="text-gray-500">Tipo:</span> <span className="font-medium">{selectedDoc.tipoDocumental}</span></div>
              <div><span className="text-gray-500">Área origen:</span> <span className="font-medium">{currentUser.area}</span></div>
              <div><span className="text-gray-500">Fojas del documento:</span> <span className="font-medium">{selectedDoc.cantidadFojas}</span></div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Área destino *</label>
            <select value={areaDestino} onChange={e => setAreaDestino(e.target.value)} className={`w-full border rounded-lg px-4 py-2.5 text-sm ${errors.areaDestino ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500`}>
              <option value="">Seleccionar área destino...</option>
              {AREAS.filter(a => a.nombre !== currentUser.area).map(a => <option key={a.id} value={a.nombre}>{a.nombre}</option>)}
            </select>
            {errors.areaDestino && <p className="text-xs text-red-600 mt-1">{errors.areaDestino}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Cantidad de fojas enviadas *</label>
              <input type="number" min="1" value={fojas} onChange={e => setFojas(e.target.value)} className={`w-full border rounded-lg px-4 py-2.5 text-sm ${errors.fojas ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500`} placeholder="N° de fojas" />
              {errors.fojas && <p className="text-xs text-red-600 mt-1">{errors.fojas}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Plazo de respuesta (días hábiles)</label>
              <input type="number" min="1" max="60" value={plazoDias} onChange={e => setPlazoDias(parseInt(e.target.value) || 6)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Observaciones (opcional)</label>
            <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm" rows={3} placeholder="Observaciones del pase..." />
          </div>
        </div>

        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
          <button onClick={handleEmitir} className="bg-[#1e3a5f] text-white px-6 py-3 rounded-lg hover:bg-blue-900 transition font-medium text-sm">
            <i className="fas fa-paper-plane mr-2"></i>Emitir pase
          </button>
          <button onClick={() => { setDocId(''); setAreaDestino(''); setFojas(''); setPlazoDias(6); setObservaciones(''); setErrors({}); }} className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition font-medium text-sm">
            <i className="fas fa-times mr-2"></i>Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ EMITIR PASE DESDE DOCUMENTO ============
function EmitirPaseDoc({ doc, setDocuments, currentUser, setCurrentScreen, showNotification, addHistorialEvent }: any) {
  const [areaDestino, setAreaDestino] = useState(doc.areaDestinoSugerida || '');
  const [fojas, setFojas] = useState(String(doc.cantidadFojas));
  const [plazoDias, setPlazoDias] = useState(doc.plazoDias || 6);
  const [observaciones, setObservaciones] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleEmitir = () => {
    const errs: Record<string, string> = {};
    if (!areaDestino) errs.areaDestino = 'Seleccione un área destino';
    if (!fojas || parseInt(fojas) <= 0) errs.fojas = 'Las fojas deben ser mayor a 0';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const now = getNow();
    const newPase: Pase = {
      id: getNextPaseId(), documentoId: doc.id, numeroInterno: doc.numeroInterno,
      areaOrigen: currentUser.area, areaDestino,
      fojasEnviadas: parseInt(fojas), plazoDias,
      fechaEmision: now.fecha, horaEmision: now.hora,
      usuarioEmisor: currentUser.nombre, estado: 'PENDIENTE DE RECEPCIÓN',
      observaciones: observaciones || undefined,
    };

    setDocuments((prev: Documento[]) => prev.map((d: Documento) => {
      if (d.id === doc.id) {
        return {
          ...d, estado: 'EN TRÁNSITO' as EstadoDocumento,
          pases: [...d.pases, newPase],
          historial: [...d.historial, {
            id: getNextHistId(), fecha: now.fecha, hora: now.hora,
            accion: 'Pase emitido', usuario: currentUser.nombre, rol: ROLES_LABELS[currentUser.rol],
            area: currentUser.area, estadoAnterior: d.estado, estadoNuevo: 'EN TRÁNSITO',
            fojasEnviadas: parseInt(fojas),
            detalles: `De: ${currentUser.area} → ${areaDestino}`,
          }]
        };
      }
      return d;
    }));

    showNotification('success', `Pase emitido correctamente. El documento pasó a estado EN TRÁNSITO.`);
    setCurrentScreen('dashboard');
  };

  return (
    <div className="max-w-2xl">
      <button onClick={() => setCurrentScreen('dashboard')} className="text-sm text-blue-600 hover:underline mb-4 inline-flex items-center">
        <i className="fas fa-arrow-left mr-1"></i>Volver
      </button>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Emitir Pase - {doc.numeroInterno}</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-700"><i className="fas fa-info-circle mr-2"></i>La responsabilidad del documento seguirá siendo del área de origen hasta que el área destino confirme la recepción.</p>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg">
            <div><span className="text-gray-500">N° Interno:</span> <span className="font-mono font-semibold">{doc.numeroInterno}</span></div>
            <div><span className="text-gray-500">Tipo:</span> <span className="font-medium">{doc.tipoDocumental}</span></div>
            <div><span className="text-gray-500">Área origen:</span> <span className="font-medium">{currentUser.area}</span></div>
            <div><span className="text-gray-500">Fojas del documento:</span> <span className="font-medium">{doc.cantidadFojas}</span></div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Área destino *</label>
            <select value={areaDestino} onChange={e => setAreaDestino(e.target.value)} className={`w-full border rounded-lg px-4 py-2.5 text-sm ${errors.areaDestino ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500`}>
              <option value="">Seleccionar...</option>
              {AREAS.filter(a => a.nombre !== currentUser.area).map(a => <option key={a.id} value={a.nombre}>{a.nombre}</option>)}
            </select>
            {errors.areaDestino && <p className="text-xs text-red-600 mt-1">{errors.areaDestino}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Fojas enviadas *</label>
              <input type="number" min="1" value={fojas} onChange={e => setFojas(e.target.value)} className={`w-full border rounded-lg px-4 py-2.5 text-sm ${errors.fojas ? 'border-red-500' : 'border-gray-300'}`} />
              {errors.fojas && <p className="text-xs text-red-600 mt-1">{errors.fojas}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Plazo (días hábiles)</label>
              <input type="number" min="1" max="60" value={plazoDias} onChange={e => setPlazoDias(parseInt(e.target.value) || 6)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Observaciones (opcional)</label>
            <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm" rows={2} />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={handleEmitir} className="bg-[#1e3a5f] text-white px-6 py-3 rounded-lg hover:bg-blue-900 transition font-medium text-sm">
            <i className="fas fa-paper-plane mr-2"></i>Emitir pase
          </button>
          <button onClick={() => setCurrentScreen('dashboard')} className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition font-medium text-sm">
            <i className="fas fa-times mr-2"></i>Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ BÚSQUEDA ============
function Busqueda({ documents, role, setSelectedDocId, setCurrentScreen, searchFilters, setSearchFilters }: any) {
  const isReadOnly = role === 'supervisor';

  return (
    <div>
      <h3 className="text-lg font-bold text-gray-800 mb-4">Búsqueda de Documentos</h3>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <input type="text" placeholder="N° Interno" value={searchFilters.numeroInterno} onChange={e => setSearchFilters({ ...searchFilters, numeroInterno: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <input type="text" placeholder="N° GDE" value={searchFilters.gde} onChange={e => setSearchFilters({ ...searchFilters, gde: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <input type="text" placeholder="N° SIGEP" value={searchFilters.sigep} onChange={e => setSearchFilters({ ...searchFilters, sigep: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <input type="text" placeholder="CUIL" value={searchFilters.cuil} onChange={e => setSearchFilters({ ...searchFilters, cuil: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <input type="text" placeholder="Remitente / Razón social" value={searchFilters.remitente} onChange={e => setSearchFilters({ ...searchFilters, remitente: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <select value={searchFilters.tipo} onChange={e => setSearchFilters({ ...searchFilters, tipo: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="Todos">Todos los tipos</option>
            <option value="Expediente">Expediente</option>
            <option value="Nota">Nota</option>
            </select>
          <select value={searchFilters.area} onChange={e => setSearchFilters({ ...searchFilters, area: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="Todos">Todas las áreas</option>
            {AREAS.map(a => <option key={a.id} value={a.nombre}>{a.nombre}</option>)}
          </select>
          <select value={searchFilters.estado} onChange={e => setSearchFilters({ ...searchFilters, estado: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="Todos">Todos los estados</option>
            <option value="EN DESPACHO">EN DESPACHO</option>
            <option value="PENDIENTE DE CARÁTULA">PENDIENTE DE CARÁTULA</option>
            <option value="OBSERVADO">OBSERVADO</option>
            <option value="EN TRÁNSITO">EN TRÁNSITO</option>
            <option value="EN TRATAMIENTO">EN TRATAMIENTO</option>
            <option value="RECIBIDO CON OBSERVACIÓN">RECIBIDO CON OBSERVACIÓN</option>
            <option value="FINALIZADO">FINALIZADO</option>
          </select>
          <input type="date" value={searchFilters.fechaDesde} onChange={e => setSearchFilters({ ...searchFilters, fechaDesde: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <input type="date" value={searchFilters.fechaHasta} onChange={e => setSearchFilters({ ...searchFilters, fechaHasta: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <button onClick={() => setSearchFilters({ numeroInterno: '', gde: '', sigep: '', cuil: '', remitente: '', tipo: 'Todos', area: 'Todos', estado: 'Todos', fechaDesde: '', fechaHasta: '' })} className="mt-3 text-sm text-blue-600 hover:underline">
          <i className="fas fa-times mr-1"></i>Limpiar filtros
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-3 py-3 font-semibold text-gray-700 text-xs">N° Interno</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-700 text-xs">GDE/SIGEP</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-700 text-xs">Tipo</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-700 text-xs">Remitente</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-700 text-xs">CUIL</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-700 text-xs">Asunto</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-700 text-xs">Fojas</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-700 text-xs">Área actual</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-700 text-xs">Responsable</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-700 text-xs">Estado</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-700 text-xs">Acción</th>
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-8 text-gray-400">No se encontraron documentos.</td></tr>
              ) : documents.map((doc: Documento) => (
                <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono text-xs">{doc.numeroInterno}</td>
                  <td className="px-3 py-2 text-xs">{doc.identificadorGDE || doc.identificadorSIGEP || '-'}</td>
                  <td className="px-3 py-2 text-xs">{doc.tipoDocumental}</td>
                  <td className="px-3 py-2 text-xs max-w-[120px] truncate">{doc.remitente}</td>
                  <td className="px-3 py-2 text-xs">{doc.cuil || '-'}</td>
                  <td className="px-3 py-2 text-xs max-w-[150px] truncate">{doc.asunto}</td>
                  <td className="px-3 py-2 text-xs text-center">{doc.cantidadFojas}</td>
                  <td className="px-3 py-2 text-xs">{doc.areaActual}</td>
                  <td className="px-3 py-2 text-xs">{doc.responsableActual}</td>
                  <td className="px-3 py-2 text-center"><StatusBadge status={doc.estado} /></td>
                  <td className="px-3 py-2 text-center">
                    <button onClick={() => { setSelectedDocId(doc.id); setCurrentScreen('detalle'); }} className="text-blue-600 hover:underline text-xs">
                      <i className="fas fa-eye mr-1"></i>Ver detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-3">{documents.length} documento(s) encontrado(s)</p>
    </div>
  );
}

// ============ HISTORIAL ============
function HistorialScreen({ documents, role, setSelectedDocId, setCurrentScreen }: any) {
  const allEvents = documents.flatMap((d: Documento) => d.historial.map(h => ({ ...h, docNumero: d.numeroInterno, docId: d.id }))).sort((a: EventoHistorial & { docNumero: string; docId: string }, b: EventoHistorial & { docNumero: string; docId: string }) => `${b.fecha}${b.hora}`.localeCompare(`${a.fecha}${a.hora}`));

  return (
    <div>
      <h3 className="text-lg font-bold text-gray-800 mb-4">Historial General de Actuaciones</h3>
      <p className="text-sm text-gray-500 mb-4">Registro cronológico de todas las actuaciones del sistema. Este historial es inmutable.</p>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-3 py-3 font-semibold text-gray-700 text-xs">Fecha/Hora</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-700 text-xs">Documento</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-700 text-xs">Acción</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-700 text-xs">Usuario</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-700 text-xs">Área</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-700 text-xs">Estado</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-700 text-xs">Acción</th>
              </tr>
            </thead>
            <tbody>
              {allEvents.slice(0, 30).map((ev: any, i: number) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2 text-xs">{ev.fecha} {ev.hora}</td>
                  <td className="px-3 py-2 text-xs font-mono">{ev.docNumero}</td>
                  <td className="px-3 py-2 text-xs">{ev.accion}</td>
                  <td className="px-3 py-2 text-xs">{ev.usuario}</td>
                  <td className="px-3 py-2 text-xs">{ev.area}</td>
                  <td className="px-3 py-2 text-xs text-center"><span className="text-gray-500">{ev.estadoAnterior}</span> → <span className="font-semibold">{ev.estadoNuevo}</span></td>
                  <td className="px-3 py-2 text-center">
                    <button onClick={() => { setSelectedDocId(ev.docId); setCurrentScreen('detalle'); }} className="text-blue-600 hover:underline text-xs">
                      <i className="fas fa-eye mr-1"></i>Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============ DETALLE DOCUMENTO (TIMELINE) ============
function DetalleDocumento({ doc, setCurrentScreen, role }: { doc: Documento; setCurrentScreen: (s: Screen) => void; role: Role }) {
  const isReadOnly = role === 'supervisor';

  return (
    <div className="max-w-4xl">
      <button onClick={() => setCurrentScreen('busqueda')} className="text-sm text-blue-600 hover:underline mb-4 inline-flex items-center">
        <i className="fas fa-arrow-left mr-1"></i>Volver a búsqueda
      </button>

      {/* Header info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800">{doc.numeroInterno}</h3>
            <p className="text-sm text-gray-500">{doc.tipoDocumental} — {doc.remitente}</p>
          </div>
          <StatusBadge status={doc.estado} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-gray-500 block">Asunto:</span><span className="font-medium">{doc.asunto}</span></div>
          <div><span className="text-gray-500 block">Fojas:</span><span className="font-medium">{doc.cantidadFojas}</span></div>
          <div><span className="text-gray-500 block">Área actual:</span><span className="font-medium">{doc.areaActual}</span></div>
          <div><span className="text-gray-500 block">Responsable:</span><span className="font-medium">{doc.responsableActual}</span></div>
          {doc.cuil && <div><span className="text-gray-500 block">CUIL:</span><span className="font-medium">{doc.cuil}</span></div>}
          {doc.identificadorGDE && <div><span className="text-gray-500 block">GDE:</span><span className="font-mono text-xs">{doc.identificadorGDE}</span></div>}
          {doc.identificadorSIGEP && <div><span className="text-gray-500 block">SIGEP:</span><span className="font-mono text-xs">{doc.identificadorSIGEP}</span></div>}
          {doc.caratula && <div className="col-span-2"><span className="text-gray-500 block">Carátula:</span><span className="font-medium">{doc.caratula}</span></div>}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-bold text-gray-800 mb-4"><i className="fas fa-clock-rotate-left mr-2 text-blue-600"></i>Línea de Tiempo / Trazabilidad</h4>
        <p className="text-xs text-gray-400 mb-4 italic">Historial inmutable — No se pueden editar ni eliminar actuaciones.</p>

        <div className="relative border-l-2 border-blue-200 ml-4 space-y-6">
          {doc.historial.map((ev, i) => (
            <div key={ev.id} className="relative pl-8">
              <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow"></div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-800">{ev.accion}</span>
                  <span className="text-xs text-gray-400">{ev.fecha} {ev.hora}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-gray-500">Usuario:</span> <span className="font-medium">{ev.usuario}</span></div>
                  <div><span className="text-gray-500">Rol:</span> <span className="font-medium">{ev.rol}</span></div>
                  <div><span className="text-gray-500">Área:</span> <span className="font-medium">{ev.area}</span></div>
                  <div><span className="text-gray-500">Estado:</span> <span className="font-medium">{ev.estadoAnterior} → {ev.estadoNuevo}</span></div>
                  {ev.fojasEnviadas && <div><span className="text-gray-500">Fojas enviadas:</span> <span className="font-medium">{ev.fojasEnviadas}</span></div>}
                  {ev.fojasRecibidas && <div><span className="text-gray-500">Fojas recibidas:</span> <span className="font-medium">{ev.fojasRecibidas}</span></div>}
                  {ev.observaciones && <div className="col-span-2"><span className="text-gray-500">Observaciones:</span> <span className="font-medium">{ev.observaciones}</span></div>}
                  {ev.detalles && <div className="col-span-2"><span className="text-gray-500">Detalles:</span> <span className="font-medium">{ev.detalles}</span></div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pases */}
      {doc.pases.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
          <h4 className="text-lg font-bold text-gray-800 mb-4"><i className="fas fa-paper-plane mr-2 text-blue-600"></i>Pases del documento</h4>
          <div className="space-y-3">
            {doc.pases.map(p => (
              <div key={p.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{p.areaOrigen} → {p.areaDestino}</span>
                  <PaseBadge status={p.estado} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
                  <div>Emisión: {p.fechaEmision} {p.horaEmision}</div>
                  <div>Fojas enviadas: {p.fojasEnviadas}</div>
                  <div>Plazo: {p.plazoDias} días</div>
                  <div>Emisor: {p.usuarioEmisor}</div>
                  {p.fojasRecibidas && <div>Fojas recibidas: {p.fojasRecibidas}</div>}
                  {p.fechaRecepcion && <div>Recepción: {p.fechaRecepcion} {p.horaRecepcion}</div>}
                  {p.usuarioReceptor && <div>Receptor: {p.usuarioReceptor}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============ COMPONENTES AUXILIARES ============
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    'EN DESPACHO': 'bg-blue-100 text-blue-800',
    'PENDIENTE DE CARÁTULA': 'bg-yellow-100 text-yellow-800',
    'OBSERVADO': 'bg-red-100 text-red-800',
    'EN TRÁNSITO': 'bg-orange-100 text-orange-800',
    'EN TRATAMIENTO': 'bg-green-100 text-green-800',
    'RECIBIDO CON OBSERVACIÓN': 'bg-red-100 text-red-800',
    'FINALIZADO': 'bg-gray-100 text-gray-800',
  };
  return <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
}

function PaseBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    'EMITIDO': 'bg-blue-100 text-blue-800',
    'PENDIENTE DE RECEPCIÓN': 'bg-yellow-100 text-yellow-800',
    'RECIBIDO': 'bg-green-100 text-green-800',
    'RECIBIDO CON OBSERVACIÓN': 'bg-red-100 text-red-800',
    'RECHAZADO': 'bg-red-100 text-red-800',
  };
  return <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
}

