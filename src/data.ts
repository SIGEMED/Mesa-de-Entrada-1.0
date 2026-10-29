import { Documento, Pase, EventoHistorial } from './types';

let docCounter = 8;
let paseCounter = 5;
let histCounter = 20;

export function getNextDocNumber(): string {
  docCounter++;
  return `${String(docCounter).padStart(4, '0')}/2026`;
}

export function getNextPaseId(): string {
  paseCounter++;
  return `pase-${paseCounter}`;
}

export function getNextHistId(): string {
  histCounter++;
  return `hist-${histCounter}`;
}

function makeHist(id: string, fecha: string, hora: string, accion: string, usuario: string, rol: string, area: string, estAnt: string, estNuevo: string, fojasEnv?: number, fojasRec?: number, obs?: string, detalles?: string): EventoHistorial {
  return { id, fecha, hora, accion, usuario, rol, area, estadoAnterior: estAnt, estadoNuevo: estNuevo, fojasEnviadas: fojasEnv, fojasRecibidas: fojasRec, observaciones: obs, detalles };
}

export const INITIAL_DOCUMENTS: Documento[] = [
  {
    id: 'doc-1',
    numeroInterno: '0001/2026',
    tipoDocumental: 'Expediente',
    remitente: 'Juan Pérez',
    tipoRemitente: 'Persona',
    nombreRazonSocial: 'Juan Pérez',
    dni: '12345678',
    cuil: '20-12345678-9',
    asunto: 'Solicitud de habilitación comercial - Local gastronómico',
    caratula: 'Pérez, Juan c/ Estado Provincial s/ Habilitación Comercial',
    fechaIngreso: '2026-01-15',
    horaIngreso: '09:30',
    cantidadFojas: 6,
    identificadorGDE: 'EX-2026-000000001',
    identificadorSIGEP: 'SIG-2026-001',
    areaActual: 'Secretaría de Calidad Ambiental',
    responsableActual: 'Lucía Romero',
    estado: 'EN TRATAMIENTO',
    plazoDias: 10,
    historial: [
      makeHist('h1', '2026-01-15', '09:30', 'Ingreso por Mesa de Entrada', 'Joaquín López', 'Recepción', 'Mesa de Entrada', 'N/A', 'EN DESPACHO', 6, undefined, undefined, 'Fojas: 6'),
      makeHist('h2', '2026-01-15', '10:15', 'Evaluado - Requiere carátula', 'Dr. Mamaní', 'Evaluador', 'Despacho', 'EN DESPACHO', 'PENDIENTE DE CARÁTULA'),
      makeHist('h3', '2026-01-15', '11:00', 'Carátula registrada', 'Carla Fernández', 'Operador', 'Despacho', 'PENDIENTE DE CARÁTULA', 'EN DESPACHO', undefined, undefined, undefined, 'Carátula: Pérez, Juan c/ Estado Provincial s/ Habilitación Comercial. Vinculado GDE: EX-2026-000000001'),
      makeHist('h4', '2026-01-16', '08:30', 'Pase emitido', 'Carla Fernández', 'Operador', 'Despacho', 'EN DESPACHO', 'EN TRÁNSITO', 6, undefined, undefined, 'De: Despacho → Secretaría de Calidad Ambiental'),
      makeHist('h5', '2026-01-16', '09:45', 'Recepción confirmada', 'Lucía Romero', 'Secretaría', 'Secretaría de Calidad Ambiental', 'EN TRÁNSITO', 'EN TRATAMIENTO', 6, 6, undefined, 'Fojas recibidas: 6 - Coincide'),
    ],
    pases: [
      {
        id: 'pase-1',
        documentoId: 'doc-1',
        numeroInterno: '0001/2026',
        areaOrigen: 'Despacho',
        areaDestino: 'Secretaría de Calidad Ambiental',
        fojasEnviadas: 6,
        plazoDias: 10,
        fechaEmision: '2026-01-16',
        horaEmision: '08:30',
        usuarioEmisor: 'Carla Fernández',
        estado: 'RECIBIDO',
        fojasRecibidas: 6,
        fechaRecepcion: '2026-01-16',
        horaRecepcion: '09:45',
        usuarioReceptor: 'Lucía Romero',
      }
    ]
  },
  {
    id: 'doc-2',
    numeroInterno: 'N-0045/2026',
    tipoDocumental: 'Nota',
    remitente: 'Dirección de Personal',
    tipoRemitente: 'Organismo',
    nombreRazonSocial: 'Dirección de Personal',
    asunto: 'Solicitud de actualización de datos del agente Martínez',
    fechaIngreso: '2026-03-10',
    horaIngreso: '14:20',
    cantidadFojas: 2,
    areaDestinoSugerida: 'Secretaría de Calidad Ambiental',
    areaActual: 'Mesa de Entrada',
    responsableActual: 'Joaquín López',
    estado: 'EN DESPACHO',
    historial: [
      makeHist('h6', '2026-03-10', '14:20', 'Ingreso por Mesa de Entrada', 'Joaquín López', 'Recepción', 'Mesa de Entrada', 'N/A', 'EN DESPACHO', 2, undefined, undefined, 'Fojas: 2'),
    ],
    pases: []
  },
  {
    id: 'doc-3',
    numeroInterno: '0003/2026',
    tipoDocumental: 'Expediente',
    remitente: 'María Elena Gutiérrez',
    tipoRemitente: 'Persona',
    nombreRazonSocial: 'María Elena Gutiérrez',
    cuil: '27-33456789-0',
    asunto: 'Reclamo por contaminación sonora - Barrio Parque Industrial',
    caratula: 'Gutiérrez, María Elena c/ Estado Provincial s/ Contaminación Sonora',
    fechaIngreso: '2026-02-20',
    horaIngreso: '10:00',
    cantidadFojas: 8,
    identificadorGDE: 'EX-2026-000000003',
    areaActual: 'Despacho',
    responsableActual: 'Carla Fernández',
    estado: 'EN TRÁNSITO',
    plazoDias: 15,
    historial: [
      makeHist('h7', '2026-02-20', '10:00', 'Ingreso por Mesa de Entrada', 'Joaquín López', 'Recepción', 'Mesa de Entrada', 'N/A', 'EN DESPACHO', 8, undefined, undefined, 'Fojas: 8'),
      makeHist('h8', '2026-02-20', '11:30', 'Evaluado - Requiere carátula', 'Dr. Mamaní', 'Evaluador', 'Despacho', 'EN DESPACHO', 'PENDIENTE DE CARÁTULA'),
      makeHist('h9', '2026-02-21', '09:00', 'Carátula registrada', 'Carla Fernández', 'Operador', 'Despacho', 'PENDIENTE DE CARÁTULA', 'EN DESPACHO', undefined, undefined, undefined, 'Carátula: Gutiérrez, María Elena c/ Estado Provincial s/ Contaminación Sonora'),
      makeHist('h10', '2026-03-05', '16:00', 'Pase emitido', 'Carla Fernández', 'Operador', 'Despacho', 'EN DESPACHO', 'EN TRÁNSITO', 8, undefined, undefined, 'De: Despacho → Secretaría de Calidad Ambiental'),
    ],
    pases: [
      {
        id: 'pase-2',
        documentoId: 'doc-3',
        numeroInterno: '0003/2026',
        areaOrigen: 'Despacho',
        areaDestino: 'Secretaría de Calidad Ambiental',
        fojasEnviadas: 8,
        plazoDias: 15,
        fechaEmision: '2026-03-05',
        horaEmision: '16:00',
        usuarioEmisor: 'Carla Fernández',
        estado: 'PENDIENTE DE RECEPCIÓN',
      }
    ]
  },
  {
    id: 'doc-4',
    numeroInterno: '0004/2026',
    tipoDocumental: 'Expediente',
    remitente: 'EcoReciclos S.R.L.',
    tipoRemitente: 'Organismo',
    nombreRazonSocial: 'EcoReciclos S.R.L.',
    cuil: '30-71234567-8',
    asunto: 'Presentación de estudio de impacto ambiental - Planta de reciclado',
    caratula: 'EcoReciclos S.R.L. s/ Estudio de Impacto Ambiental',
    fechaIngreso: '2026-01-28',
    horaIngreso: '11:45',
    cantidadFojas: 24,
    identificadorGDE: 'EX-2026-000000226',
    identificadorSIGEP: 'SIG-2026-045',
    areaActual: 'Dirección General de Ambiente',
    responsableActual: 'Dr. Roberto Sánchez',
    estado: 'EN TRATAMIENTO',
    plazoDias: 30,
    historial: [
      makeHist('h11', '2026-01-28', '11:45', 'Ingreso por Mesa de Entrada', 'Joaquín López', 'Recepción', 'Mesa de Entrada', 'N/A', 'EN DESPACHO', 24, undefined, undefined, 'Fojas: 24'),
      makeHist('h12', '2026-01-28', '14:00', 'Evaluado - Derivación directa', 'Dr. Mamaní', 'Evaluador', 'Despacho', 'EN DESPACHO', 'EN DESPACHO', undefined, undefined, undefined, 'Derivado a: Dirección General de Ambiente'),
      makeHist('h13', '2026-01-29', '09:00', 'Pase emitido', 'Carla Fernández', 'Operador', 'Despacho', 'EN DESPACHO', 'EN TRÁNSITO', 24, undefined, undefined, 'De: Despacho → Dirección General de Ambiente'),
      makeHist('h14', '2026-01-29', '10:30', 'Recepción confirmada', 'Dr. Roberto Sánchez', 'Secretaría', 'Dirección General de Ambiente', 'EN TRÁNSITO', 'EN TRATAMIENTO', 24, 24, undefined, 'Fojas recibidas: 24 - Coincide'),
    ],
    pases: [
      {
        id: 'pase-3',
        documentoId: 'doc-4',
        numeroInterno: '0004/2026',
        areaOrigen: 'Despacho',
        areaDestino: 'Dirección General de Ambiente',
        fojasEnviadas: 24,
        plazoDias: 30,
        fechaEmision: '2026-01-29',
        horaEmision: '09:00',
        usuarioEmisor: 'Carla Fernández',
        estado: 'RECIBIDO',
        fojasRecibidas: 24,
        fechaRecepcion: '2026-01-29',
        horaRecepcion: '10:30',
        usuarioReceptor: 'Dr. Roberto Sánchez',
      }
    ]
  },
  {
    id: 'doc-5',
    numeroInterno: 'I-0012/2026',
    tipoDocumental: 'Nota',
    remitente: 'Dirección de Gestión de Residuos',
    tipoRemitente: 'Organismo',
    nombreRazonSocial: 'Dirección de Gestión de Residuos',
    asunto: 'Informe mensual de gestión de residuos - Febrero 2026',
    fechaIngreso: '2026-03-05',
    horaIngreso: '08:15',
    cantidadFojas: 12,
    areaActual: 'Mesa de Entrada',
    responsableActual: 'Joaquín López',
    estado: 'EN DESPACHO',
    historial: [
      makeHist('h15', '2026-03-05', '08:15', 'Ingreso por Mesa de Entrada', 'Joaquín López', 'Recepción', 'Mesa de Entrada', 'N/A', 'EN DESPACHO', 12, undefined, undefined, 'Fojas: 12'),
    ],
    pases: []
  },
  {
    id: 'doc-6',
    numeroInterno: 'N-0050/2026',
    tipoDocumental: 'Nota',
    remitente: 'Municipalidad de San Salvador',
    tipoRemitente: 'Organismo',
    nombreRazonSocial: 'Municipalidad de San Salvador de Jujuy',
    asunto: 'Solicitud de cooperación técnica - Programa de arbolado urbano',
    fechaIngreso: '2025-12-10',
    horaIngreso: '15:00',
    cantidadFojas: 3,
    areaActual: 'Dirección de Recursos Naturales',
    responsableActual: 'Ing. Ana Morales',
    estado: 'FINALIZADO',
    historial: [
      makeHist('h16', '2025-12-10', '15:00', 'Ingreso por Mesa de Entrada', 'Joaquín López', 'Recepción', 'Mesa de Entrada', 'N/A', 'EN DESPACHO', 3, undefined, undefined, 'Fojas: 3'),
      makeHist('h17', '2025-12-11', '09:00', 'Evaluado - Derivación directa', 'Dr. Mamaní', 'Evaluador', 'Despacho', 'EN DESPACHO', 'EN DESPACHO', undefined, undefined, undefined, 'Derivado a: Dirección de Recursos Naturales'),
      makeHist('h18', '2025-12-11', '10:00', 'Pase emitido', 'Carla Fernández', 'Operador', 'Despacho', 'EN DESPACHO', 'EN TRÁNSITO', 3, undefined, undefined, 'De: Despacho → Dirección de Recursos Naturales'),
      makeHist('h19', '2025-12-11', '11:30', 'Recepción confirmada', 'Ing. Ana Morales', 'Secretaría', 'Dirección de Recursos Naturales', 'EN TRÁNSITO', 'EN TRATAMIENTO', 3, 3, undefined, 'Fojas recibidas: 3 - Coincide'),
      makeHist('h20', '2026-02-15', '16:00', 'Trámite finalizado', 'Ing. Ana Morales', 'Secretaría', 'Dirección de Recursos Naturales', 'EN TRATAMIENTO', 'FINALIZADO', undefined, undefined, undefined, 'Respuesta enviada. Trámite cerrado.'),
    ],
    pases: [
      {
        id: 'pase-4',
        documentoId: 'doc-6',
        numeroInterno: 'N-0050/2026',
        areaOrigen: 'Despacho',
        areaDestino: 'Dirección de Recursos Naturales',
        fojasEnviadas: 3,
        plazoDias: 10,
        fechaEmision: '2025-12-11',
        horaEmision: '10:00',
        usuarioEmisor: 'Carla Fernández',
        estado: 'RECIBIDO',
        fojasRecibidas: 3,
        fechaRecepcion: '2025-12-11',
        horaRecepcion: '11:30',
        usuarioReceptor: 'Ing. Ana Morales',
      }
    ]
  },
  {
    id: 'doc-7',
    numeroInterno: '0006/2026',
    tipoDocumental: 'Expediente',
    remitente: 'Cooperativa Tierra Fértil',
    tipoRemitente: 'Organismo',
    nombreRazonSocial: 'Cooperativa de Trabajo Tierra Fértil Ltda.',
    cuil: '30-71999888-2',
    asunto: 'Inscripción en Registro de Productores Orgánicos',
    fechaIngreso: '2026-03-08',
    horaIngreso: '13:00',
    cantidadFojas: 15,
    areaActual: 'Despacho',
    responsableActual: 'Carla Fernández',
    estado: 'PENDIENTE DE CARÁTULA',
    historial: [
      makeHist('h21', '2026-03-08', '13:00', 'Ingreso por Mesa de Entrada', 'Joaquín López', 'Recepción', 'Mesa de Entrada', 'N/A', 'EN DESPACHO', 15, undefined, undefined, 'Fojas: 15'),
      makeHist('h22', '2026-03-09', '09:30', 'Evaluado - Requiere carátula', 'Dr. Mamaní', 'Evaluador', 'Despacho', 'EN DESPACHO', 'PENDIENTE DE CARÁTULA'),
    ],
    pases: []
  },
  {
    id: 'doc-8',
    numeroInterno: '0007/2026',
    tipoDocumental: 'Expediente',
    remitente: 'Minera Andina S.A.',
    tipoRemitente: 'Organismo',
    nombreRazonSocial: 'Minera Andina Sociedad Anónima',
    cuil: '30-70555444-1',
    asunto: 'Presentación de plan de remediación ambiental - Sitio minero abandonado',
    caratula: 'Minera Andina S.A. s/ Plan de Remediación Ambiental',
    fechaIngreso: '2026-02-25',
    horaIngreso: '09:00',
    cantidadFojas: 10,
    identificadorGDE: 'EX-2026-000000310',
    areaActual: 'Despacho',
    responsableActual: 'Carla Fernández',
    estado: 'EN TRÁNSITO',
    plazoDias: 20,
    historial: [
      makeHist('h23', '2026-02-25', '09:00', 'Ingreso por Mesa de Entrada', 'Joaquín López', 'Recepción', 'Mesa de Entrada', 'N/A', 'EN DESPACHO', 10, undefined, undefined, 'Fojas: 10'),
      makeHist('h24', '2026-02-25', '11:00', 'Evaluado - Derivación directa', 'Dr. Mamaní', 'Evaluador', 'Despacho', 'EN DESPACHO', 'EN DESPACHO', undefined, undefined, undefined, 'Derivado a: Dirección de Recursos Naturales'),
      makeHist('h25', '2026-03-01', '14:00', 'Pase emitido', 'Carla Fernández', 'Operador', 'Despacho', 'EN DESPACHO', 'EN TRÁNSITO', 10, undefined, undefined, 'De: Despacho → Dirección de Recursos Naturales'),
    ],
    pases: [
      {
        id: 'pase-5',
        documentoId: 'doc-8',
        numeroInterno: '0007/2026',
        areaOrigen: 'Despacho',
        areaDestino: 'Dirección de Recursos Naturales',
        fojasEnviadas: 10,
        plazoDias: 20,
        fechaEmision: '2026-03-01',
        horaEmision: '14:00',
        usuarioEmisor: 'Carla Fernández',
        estado: 'PENDIENTE DE RECEPCIÓN',
      }
    ]
  },
];
