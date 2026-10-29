export type Role = 'recepcion' | 'evaluador' | 'caratulador' | 'secretaria' | 'supervisor' ;

export type TipoDocumental = 'Nota' | 'Expediente' ;

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
  { id: 'despacho', nombre: 'Coordinación de Despacho' },
  { id: 'secretaria-calidad', nombre: 'Secretaría de Calidad Ambiental' },
  { id: 'secretaria-bio', nombre: 'Secretaria de Biodiversidad y Desarrollo sustentable' },
  { id: 'secretaria-ordenamiento', nombre: 'Secretaria de Ordenamiento ambiental territorial' },
  { id: 'direc-juridicos', nombre: 'Dirección de Asuntos Juridicos' },
  { id: 'coo-modernizacion', nombre: 'Coordinación de Modernización' },
];

export const USUARIOS: Usuario[] = [
  { id: 'u1', nombre: 'Joaquín López', rol: 'recepcion', area: 'Mesa de Entrada' },
  { id: 'u2', nombre: 'Dr. Mamaní', rol: 'evaluador', area: 'Despacho' },
  { id: 'u3', nombre: 'Laura Lopez', rol: 'caratulador', area: 'Despacho' },
  { id: 'u4', nombre: 'Lucía Romero', rol: 'secretaria', area: 'Secretaría de Calidad Ambiental' },
  { id: 'u5', nombre: 'Min. Alejandro Alvares', rol: 'supervisor', area: 'Ministerio' },

];

export const ROLES_LABELS: Record<string, string> = {
  recepcion: 'Recepción / Mesa de Entrada',
  evaluador: 'Evaluador',
  operador: 'Operador de Caratulación',
  secretaria: 'Administrativo de Secretaría',
  supervisor: 'Supervisor / Autoridad',
};

export interface MenuOption {
  id: string;
  label: string;
  icon: string;
  roles: Role[];
}

export const MENU_OPTIONS: MenuOption[] = [
  { id: 'ingreso', label: 'Ingreso', icon: 'fa-file-circle-plus', roles: ['recepcion', 'caratulador'] },
  { id: 'bandeja', label: 'Bandeja de Evaluación', icon: 'fa-clipboard-check', roles: ['evaluador'] },
  { id: 'caratula', label: 'Carátula / Vinculación', icon: 'fa-stamp', roles: ['caratulador'] },
  { id: 'pases-entrantes', label: 'Pases Entrantes', icon: 'fa-inbox', roles: ['secretaria'] },
  { id: 'emitir-pase', label: 'Emitir Pase', icon: 'fa-paper-plane', roles: ['caratulador', 'secretaria'] },
  { id: 'busqueda', label: 'Búsqueda', icon: 'fa-magnifying-glass', roles: ['recepcion', 'evaluador', 'secretaria', 'supervisor'] },
  { id: 'historial', label: 'Historial', icon: 'fa-clock-rotate-left', roles: ['evaluador', 'caratulador', 'secretaria', 'supervisor'] },
  { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line', roles: [ 'supervisor'] },
];
