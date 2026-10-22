export type Role = 'recepcion' | 'evaluador' | 'operador' | 'secretaria' | 'supervisor' | 'admin';

export type TipoDocumental = 'Expediente' | 'Nota' | 'Informe' | 'Otro documento';

export type EstadoDocumento = 
  | 'EN DESPACHO' 
  | 'PENDIENTE DE CARÁTULA' 
  | 'OBSERVADO' 
  | 'EN TRÁNSITO' 
  | 'EN TRATAMIENTO' 
  | 'RECIBIDO CON OBSERVACIÓN' 
  | 'FINALIZADO';

export type EstadoPase = 
  | 'EMITIDO' 
  | 'PENDIENTE DE RECEPCIÓN' 
  | 'RECIBIDO' 
  | 'RECIBIDO CON OBSERVACIÓN' 
  | 'RECHAZADO';

export type TipoRemitente = 'Persona' | 'Organismo';

export type DecisionEvaluacion = 'Requiere carátula' | 'Derivación directa' | 'Rechazar / Devolver';

export interface Usuario {
  id: string;
  nombre: string;
  rol: Role;
  area: string;
}

export interface EventoHistorial {
  id: string;
  fecha: string;
  hora: string;
  accion: string;
  usuario: string;
  rol: string;
  area: string;
  estadoAnterior: string;
  estadoNuevo: string;
  fojasEnviadas?: number;
  fojasRecibidas?: number;
  observaciones?: string;
  detalles?: string;
}

export interface Pase {
  id: string;
  documentoId: string;
  numeroInterno: string;
  areaOrigen: string;
  areaDestino: string;
  fojasEnviadas: number;
  plazoDias: number;
  fechaEmision: string;
  horaEmision: string;
  usuarioEmisor: string;
  estado: EstadoPase;
  observaciones?: string;
  fojasRecibidas?: number;
  fechaRecepcion?: string;
  horaRecepcion?: string;
  usuarioReceptor?: string;
}

export interface Documento {
  id: string;
  numeroInterno: string;
  tipoDocumental: TipoDocumental;
  remitente: string;
  tipoRemitente?: TipoRemitente;
  nombreRazonSocial?: string;
  dni?: string;
  cuil?: string;
  asunto: string;
  caratula?: string;
  fechaIngreso: string;
  horaIngreso: string;
  cantidadFojas: number;
  identificadorGDE?: string;
  identificadorSIGEP?: string;
  areaDestinoSugerida?: string;
  areaActual: string;
  responsableActual: string;
  estado: EstadoDocumento;
  observaciones?: string;
  plazoDias?: number;
  historial: EventoHistorial[];
  pases: Pase[];
}

export interface Area {
  id: string;
  nombre: string;
}

export const AREAS: Area[] = [
  { id: 'mesa', nombre: 'Mesa de Entrada' },
  { id: 'despacho', nombre: 'Despacho' },
  { id: 'secretaria-calidad', nombre: 'Secretaría de Calidad Ambiental' },
  { id: 'dir-gral-ambiente', nombre: 'Dirección General de Ambiente' },
  { id: 'dir-recursos-naturales', nombre: 'Dirección de Recursos Naturales' },
  { id: 'dir-gestion-residuos', nombre: 'Dirección de Gestión de Residuos' },
  { id: 'dir-cambio-climatico', nombre: 'Dirección de Cambio Climático' },
  { id: 'legal', nombre: 'Área Legal' },
  { id: 'personal', nombre: 'Dirección de Personal' },
];

export const USUARIOS: Usuario[] = [
  { id: 'u1', nombre: 'Joaquín López', rol: 'recepcion', area: 'Mesa de Entrada' },
  { id: 'u2', nombre: 'Dr. Mamaní', rol: 'evaluador', area: 'Despacho' },
  { id: 'u3', nombre: 'Carla Fernández', rol: 'operador', area: 'Despacho' },
  { id: 'u4', nombre: 'Lucía Romero', rol: 'secretaria', area: 'Secretaría de Calidad Ambiental' },
  { id: 'u5', nombre: 'Min. Alejandro Torres', rol: 'supervisor', area: 'Ministerio' },
  { id: 'u6', nombre: 'Soporte Técnico', rol: 'admin', area: 'Sistemas' },
];

export const ROLES_LABELS: Record<string, string> = {
  recepcion: 'Recepción / Mesa de Entrada',
  evaluador: 'Evaluador',
  operador: 'Operador de Caratulación',
  secretaria: 'Administrativo de Secretaría',
  supervisor: 'Supervisor / Autoridad',
  admin: 'Administrador',
};

export interface MenuOption {
  id: string;
  label: string;
  icon: string;
  roles: Role[];
}

export const MENU_OPTIONS: MenuOption[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line', roles: ['recepcion', 'evaluador', 'operador', 'secretaria', 'supervisor', 'admin'] },
  { id: 'ingreso', label: 'Ingreso', icon: 'fa-file-circle-plus', roles: ['recepcion', 'operador'] },
  { id: 'bandeja', label: 'Bandeja de Evaluación', icon: 'fa-clipboard-check', roles: ['evaluador'] },
  { id: 'caratula', label: 'Carátula / Vinculación', icon: 'fa-stamp', roles: ['operador'] },
  { id: 'pases-entrantes', label: 'Pases Entrantes', icon: 'fa-inbox', roles: ['secretaria'] },
  { id: 'emitir-pase', label: 'Emitir Pase', icon: 'fa-paper-plane', roles: ['operador', 'secretaria'] },
  { id: 'busqueda', label: 'Búsqueda', icon: 'fa-magnifying-glass', roles: ['recepcion', 'evaluador', 'operador', 'secretaria', 'supervisor'] },
  { id: 'historial', label: 'Historial', icon: 'fa-clock-rotate-left', roles: ['recepcion', 'evaluador', 'operador', 'secretaria', 'supervisor'] },
  { id: 'admin-panel', label: 'Panel Técnico', icon: 'fa-gears', roles: ['admin'] },
];
