import { Account, Contact, Activity, Project, Opportunity } from '@/types';
import { getTenantStorageKey, isCrmPymeBuild } from '@/config/branding';

const daysAgo = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
};
const daysFromNow = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

export const seedOpportunities: Opportunity[] = [
  {
    id: 'opp-1',
    accountId: 'acc-1',
    contactId: 'con-1',
    projectId: 'proj-1',
    name: 'Suministro Anclajes Químicos Línea 3',
    description: 'Cotización para 200 unidades de anclaje químico epoxy para estaciones del metro.',
    stage: 'proposal',
    amount: 45000000,
    probability: 50,
    expectedCloseDate: daysFromNow(15),
    actualCloseDate: null,
    lossReason: '',
    notes: 'Cliente evaluando. Competencia presente.',
    priority: 'high',
    tags: [],
    createdAt: daysAgo(30),
    updatedAt: daysAgo(3),
  },
  {
    id: 'opp-2',
    accountId: 'acc-2',
    contactId: 'con-3',
    projectId: 'proj-2',
    name: 'Contrato Anual Minera Andes',
    description: 'Renovación del contrato de suministro anual de sistemas de fijación para operaciones mineras.',
    stage: 'negotiation',
    amount: 120000000,
    probability: 75,
    expectedCloseDate: daysFromNow(7),
    actualCloseDate: null,
    lossReason: '',
    notes: 'Excelente evaluación. Proyectan aumento del 30%.',
    priority: 'urgent',
    tags: [],
    createdAt: daysAgo(60),
    updatedAt: daysAgo(5),
  },
  {
    id: 'opp-3',
    accountId: 'acc-3',
    contactId: 'con-5',
    projectId: null,
    name: 'Galpón Industrial Quilicura',
    description: 'Suministro de anclajes mecánicos para nuevo galpón industrial.',
    stage: 'qualified',
    amount: 8500000,
    probability: 25,
    expectedCloseDate: daysFromNow(45),
    actualCloseDate: null,
    lossReason: '',
    notes: 'Primera reunión exitosa. Pendiente cotización formal.',
    priority: 'medium',
    tags: [],
    createdAt: daysAgo(20),
    updatedAt: daysAgo(2),
  },
  {
    id: 'opp-4',
    accountId: 'acc-1',
    contactId: 'con-2',
    projectId: 'proj-1',
    name: 'Servicio Técnico Especializado',
    description: 'Contrato de servicio técnico para instalación de sistemas de fijación en túneles.',
    stage: 'lead',
    amount: 18000000,
    probability: 10,
    expectedCloseDate: daysFromNow(90),
    actualCloseDate: null,
    lossReason: '',
    notes: 'Contacto inicial. Requiere presentación formal.',
    priority: 'low',
    tags: [],
    createdAt: daysAgo(10),
    updatedAt: daysAgo(1),
  },
  {
    id: 'opp-5',
    accountId: 'acc-2',
    contactId: 'con-4',
    projectId: null,
    name: 'Prueba Piloto Fijación Química',
    description: 'Prueba piloto de 50 unidades de fijación química para evaluación en terreno.',
    stage: 'closed_won',
    amount: 3200000,
    probability: 100,
    expectedCloseDate: daysAgo(5),
    actualCloseDate: daysAgo(5),
    lossReason: '',
    notes: 'Prueba aprobada. Cliente satisfecho con resultados.',
    priority: 'medium',
    tags: [],
    createdAt: daysAgo(45),
    updatedAt: daysAgo(5),
  },
  {
    id: 'opp-6',
    accountId: 'acc-3',
    contactId: 'con-6',
    projectId: 'proj-3',
    name: 'Estructuras Metálicas Parque Eólico',
    description: 'Suministro de pernos y sistemas de anclaje para torres eólicas.',
    stage: 'closed_lost',
    amount: 65000000,
    probability: 0,
    expectedCloseDate: daysAgo(20),
    actualCloseDate: daysAgo(20),
    lossReason: 'Precio no competitivo frente a proveedor local',
    notes: 'Perdimos contra competidor con menor costo logístico.',
    priority: 'high',
    tags: [],
    createdAt: daysAgo(120),
    updatedAt: daysAgo(20),
  },
];

export const seedProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'Línea 3 Metro de Santiago',
    description: 'Proyecto de construcción de la Línea 3 del Metro de Santiago, incluyendo túneles, estaciones y sistemas de fijación estructural.',
    status: 'active',
    location: 'Santiago, Región Metropolitana',
    startDate: daysAgo(180),
    endDate: daysFromNow(365),
    budget: 1500000000,
    createdAt: daysAgo(180),
    updatedAt: daysAgo(10),
  },
  {
    id: 'proj-2',
    name: 'Planta Desalinización Antofagasta',
    description: 'Construcción de planta desalinizadora para suministro de agua a operaciones mineras en la región.',
    status: 'active',
    location: 'Antofagasta, Región de Antofagasta',
    startDate: daysAgo(120),
    endDate: daysFromNow(200),
    budget: 850000000,
    createdAt: daysAgo(120),
    updatedAt: daysAgo(5),
  },
  {
    id: 'proj-3',
    name: 'Parque Eólico Los Andes',
    description: 'Instalación de parque eólico con 45 turbinas y subestación eléctrica asociada.',
    status: 'completed',
    location: 'Los Andes, Región de Valparaíso',
    startDate: daysAgo(365),
    endDate: daysAgo(30),
    budget: 620000000,
    createdAt: daysAgo(365),
    updatedAt: daysAgo(30),
  },
];

export const seedAccounts: Account[] = [
  {
    id: 'acc-1',
    projectIds: ['proj-1'],
    companyName: 'Constructora del Sur S.A.',
    industry: 'Construcción',
    description: 'Empresa constructora especializada en proyectos de infraestructura vial y edificación comercial en la zona sur de Chile.',
    status: 'active',
    website: 'www.constructoradelsur.cl',
    address: 'Av. Los Puelches 2845',
    city: 'Concepción',
    country: 'Chile',
    tags: ['cliente-frecuente', 'mineria'],
    createdAt: daysAgo(90),
    updatedAt: daysAgo(5),
  },
  {
    id: 'acc-2',
    projectIds: ['proj-2'],
    companyName: 'Minera Andes del Norte',
    industry: 'Minería',
    description: 'Compañía minera dedicada a la extracción de cobre y molibdeno en la Región de Antofagasta.',
    status: 'active',
    website: 'www.mineraandesnorte.cl',
    address: 'Ruta C-110, Km 45',
    city: 'Calama',
    country: 'Chile',
    tags: [],
    createdAt: daysAgo(75),
    updatedAt: daysAgo(10),
  },
  {
    id: 'acc-3',
    projectIds: [],
    companyName: 'Industrias Metálicas Torres',
    industry: 'Industria',
    description: 'Fabricación de estructuras metálicas, galpones industriales y sistemas de anclaje para la industria.',
    status: 'active',
    website: 'www.imtorres.cl',
    address: 'Camino a Melipilla 8920',
    city: 'Santiago',
    country: 'Chile',
    tags: [],
    createdAt: daysAgo(60),
    updatedAt: daysAgo(3),
  },
];

export const seedContacts: Contact[] = [
  {
    id: 'con-1',
    accountId: 'acc-1',
    firstName: 'Roberto',
    lastName: 'Mendoza Salazar',
    email: 'rmendoza@constructoradelsur.cl',
    phone: '+56 41 234 5678',
    mobile: '+56 9 8765 4321',
    position: 'Gerente de Compras',
    department: 'Compras',
    status: 'active',
    isPrimary: true,
    notes: 'Contacto principal para cotizaciones. Prefiere comunicación por email.',
    tags: [],
    createdAt: daysAgo(88),
    updatedAt: daysAgo(5),
  },
  {
    id: 'con-2',
    accountId: 'acc-1',
    firstName: 'Catalina',
    lastName: 'Fuentes Rojas',
    email: 'cfuentes@constructoradelsur.cl',
    phone: '+56 41 234 5679',
    mobile: '+56 9 6543 2109',
    position: 'Jefa de Proyectos',
    department: 'Operaciones',
    status: 'active',
    isPrimary: false,
    notes: 'Responsable de coordinar entregas en obra.',
    tags: [],
    createdAt: daysAgo(85),
    updatedAt: daysAgo(20),
  },
  {
    id: 'con-3',
    accountId: 'acc-2',
    firstName: 'Andrés',
    lastName: 'Vega Contreras',
    email: 'avega@mineraandesnorte.cl',
    phone: '+56 55 234 5678',
    mobile: '+56 9 3456 7890',
    position: 'Superintendente de Mantenimiento',
    department: 'Mantenimiento',
    status: 'active',
    isPrimary: true,
    notes: 'Maneja grandes volúmenes de consumibles. Requiere atención prioritaria.',
    tags: [],
    createdAt: daysAgo(73),
    updatedAt: daysAgo(10),
  },
  {
    id: 'con-4',
    accountId: 'acc-2',
    firstName: 'Patricia',
    lastName: 'Soto Herrera',
    email: 'psoto@mineraandesnorte.cl',
    phone: '+56 55 234 5679',
    mobile: '+56 9 2345 6789',
    position: 'Ingeniera de Procesos',
    department: 'Ingeniería',
    status: 'active',
    isPrimary: false,
    notes: 'Interesada en nuevos productos de fijación química.',
    tags: [],
    createdAt: daysAgo(70),
    updatedAt: daysAgo(15),
  },
  {
    id: 'con-5',
    accountId: 'acc-3',
    firstName: 'Felipe',
    lastName: 'Araya Castillo',
    email: 'faraya@imtorres.cl',
    phone: '+56 2 2345 6789',
    mobile: '+56 9 8765 1234',
    position: 'Director Comercial',
    department: 'Comercial',
    status: 'active',
    isPrimary: true,
    notes: 'Toma decisiones de compra. Muy exigente con plazos de entrega.',
    tags: [],
    createdAt: daysAgo(58),
    updatedAt: daysAgo(3),
  },
  {
    id: 'con-6',
    accountId: 'acc-3',
    firstName: 'Daniella',
    lastName: 'Riquelme Paredes',
    email: 'driquelme@imtorres.cl',
    phone: '+56 2 2345 6790',
    mobile: '+56 9 7654 3210',
    position: 'Subgerente de Operaciones',
    department: 'Operaciones',
    status: 'active',
    isPrimary: false,
    notes: 'Coordina las órdenes de compra recurrentes.',
    tags: [],
    createdAt: daysAgo(55),
    updatedAt: daysAgo(12),
  },
];

export const seedActivities: Activity[] = [
  {
    id: 'act-1',
    accountId: 'acc-1',
    contactId: 'con-1',
    opportunityId: null,
    relatedActivityId: null,
    type: 'call',
    title: 'Cotización sistemas de anclaje químico',
    description: 'Roberto solicitó cotización para 200 unidades de anclaje químico epoxy para proyecto Línea 3 Metro. Necesita entrega en 15 días.',
    status: 'completed',
    scheduledDate: daysAgo(7),
    completedDate: daysAgo(7),
    duration: 25,
    outcome: 'Cotización enviada por email. Cliente evaluando.',
    reminderDate: null,
    isRecurring: false,
    recurringInterval: null,
    recurringEndDate: null,
    createdAt: daysAgo(7),
    updatedAt: daysAgo(7),
  },
  {
    id: 'act-2',
    accountId: 'acc-1',
    contactId: 'con-2',
    opportunityId: null,
    relatedActivityId: null,
    type: 'visit',
    title: 'Visita a obra Línea 3 Metro',
    description: 'Visita técnica para verificar condiciones de instalación y recomendar productos adecuados.',
    status: 'completed',
    scheduledDate: daysAgo(5),
    completedDate: daysAgo(5),
    duration: 120,
    outcome: 'Cliente conforme con recomendaciones. Se acordó envío de muestras.',
    reminderDate: null,
    isRecurring: false,
    recurringInterval: null,
    recurringEndDate: null,
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
  },
  {
    id: 'act-3',
    accountId: 'acc-1',
    contactId: null,
    opportunityId: null,
    relatedActivityId: null,
    type: 'email',
    title: 'Seguimiento cotización anclajes',
    description: 'Email de seguimiento preguntando estado de evaluación de cotización enviada.',
    status: 'completed',
    scheduledDate: daysAgo(3),
    completedDate: daysAgo(3),
    duration: null,
    outcome: 'Cliente respondió que está en proceso de aprobación interna.',
    reminderDate: null,
    isRecurring: false,
    recurringInterval: null,
    recurringEndDate: null,
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
  },
  {
    id: 'act-4',
    accountId: 'acc-2',
    contactId: 'con-3',
    opportunityId: null,
    relatedActivityId: null,
    type: 'meeting',
    title: 'Reunión anual de proveedores',
    description: 'Reunión para revisar desempeño del año y planificar necesidades del próximo periodo.',
    status: 'completed',
    scheduledDate: daysAgo(10),
    completedDate: daysAgo(10),
    duration: 90,
    outcome: 'Excelente evaluación. Se proyecta aumento de 30% en pedidos.',
    reminderDate: null,
    isRecurring: false,
    recurringInterval: null,
    recurringEndDate: null,
    createdAt: daysAgo(10),
    updatedAt: daysAgo(10),
  },
  {
    id: 'act-5',
    accountId: 'acc-2',
    contactId: 'con-4',
    opportunityId: null,
    relatedActivityId: null,
    type: 'call',
    title: 'Consulta productos de fijación química',
    description: 'Patricia consultó por tiempos de curado y resistencia a temperatura de productos de fijación.',
    status: 'completed',
    scheduledDate: daysAgo(4),
    completedDate: daysAgo(4),
    duration: 15,
    outcome: 'Se envió ficha técnica detallada. Interesada en pruebas piloto.',
    reminderDate: null,
    isRecurring: false,
    recurringInterval: null,
    recurringEndDate: null,
    createdAt: daysAgo(4),
    updatedAt: daysAgo(4),
  },
  {
    id: 'act-6',
    accountId: 'acc-2',
    contactId: 'con-3',
    opportunityId: null,
    relatedActivityId: null,
    type: 'note',
    title: 'Nota: Incremento de demanda esperado',
    description: 'Andrés comentó que por nueva ley de seguridad minera, necesitarán duplicar stock de sistemas de anclaje en los próximos 3 meses.',
    status: 'completed',
    scheduledDate: daysAgo(2),
    completedDate: daysAgo(2),
    duration: null,
    outcome: '',
    reminderDate: null,
    isRecurring: false,
    recurringInterval: null,
    recurringEndDate: null,
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
  },
  {
    id: 'act-7',
    accountId: 'acc-3',
    contactId: 'con-5',
    opportunityId: null,
    relatedActivityId: null,
    type: 'email',
    title: 'Orden de compra mensual',
    description: 'Felipe envió orden de compra por productos de fijación estándar para este mes.',
    status: 'completed',
    scheduledDate: daysAgo(3),
    completedDate: daysAgo(3),
    duration: null,
    outcome: 'OC recibida y confirmada. Entrega programada para el 20 del mes.',
    reminderDate: null,
    isRecurring: false,
    recurringInterval: null,
    recurringEndDate: null,
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
  },
  {
    id: 'act-8',
    accountId: 'acc-3',
    contactId: 'con-6',
    opportunityId: null,
    relatedActivityId: null,
    type: 'call',
    title: 'Coordinación entrega galpón Quilicura',
    description: 'Daniella coordinó fecha y hora de entrega de anclajes mecánicos para galpón nuevo en Quilicura.',
    status: 'completed',
    scheduledDate: daysAgo(1),
    completedDate: daysAgo(1),
    duration: 10,
    outcome: 'Entrega confirmada para jueves 08:00 hrs.',
    reminderDate: null,
    isRecurring: false,
    recurringInterval: null,
    recurringEndDate: null,
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
  {
    id: 'act-9',
    accountId: 'acc-1',
    contactId: 'con-1',
    opportunityId: null,
    relatedActivityId: null,
    type: 'meeting',
    title: 'Presentación nuevos productos Hilti',
    description: 'Agendar presentación de nueva línea de productos Hilti para sistemas de fijación.',
    status: 'pending',
    scheduledDate: daysFromNow(3),
    completedDate: null,
    duration: 60,
    outcome: '',
    reminderDate: null,
    isRecurring: false,
    recurringInterval: null,
    recurringEndDate: null,
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
];

function migrateActivities(raw: any[]): Activity[] {
  if (!raw || !Array.isArray(raw)) return seedActivities;
  return raw.map((a: any) => ({
    ...a,
    reminderDate: a.reminderDate ?? null,
    opportunityId: a.opportunityId ?? null,
    relatedActivityId: a.relatedActivityId ?? null,
    isRecurring: a.isRecurring ?? false,
    recurringInterval: a.recurringInterval ?? null,
    recurringEndDate: a.recurringEndDate ?? null,
  }));
}

function migrateAccounts(rawAccounts: any[]): Account[] {
  return (rawAccounts || []).map((a: any) => {
    if (a.projectIds !== undefined) return a as Account;
    if (a.projectId) return { ...a, projectIds: [a.projectId] };
    return { ...a, projectIds: [] };
  });
}

function migrateProjects(rawProjects: any[]): Project[] {
  return (rawProjects || []).map((p: any) => ({
    status: p.status || 'active',
    location: p.location || '',
    startDate: p.startDate || new Date().toISOString(),
    endDate: p.endDate || null,
    budget: p.budget || null,
    ...p,
  }));
}

export function loadInitialData(useDemoData = true): {
  opportunities: Opportunity[];
  projects: Project[];
  accounts: Account[];
  contacts: Contact[];
  activities: Activity[];
} {
  const storageKey = getTenantStorageKey('crm_data');
  const stored = localStorage.getItem(storageKey);

  // Si hay datos guardados, siempre los cargamos
  if (stored) {
    try {
      const raw = JSON.parse(stored);
      return {
        opportunities: migrateOpportunities(raw.opportunities),
        projects: migrateProjects(raw.projects || seedProjects),
        accounts: migrateAccounts(raw.accounts || seedAccounts),
        contacts: raw.contacts || seedContacts,
        activities: migrateActivities(raw.activities),
      };
    } catch {
      return { opportunities: seedOpportunities, projects: seedProjects, accounts: seedAccounts, contacts: seedContacts, activities: seedActivities };
    }
  }

  // INGEFIX build: mantener comportamiento legacy (datos demo si no hay nada)
  if (!isCrmPymeBuild()) {
    return { opportunities: seedOpportunities, projects: seedProjects, accounts: seedAccounts, contacts: seedContacts, activities: seedActivities };
  }

  // PulpoCRM build: sin wizard de onboarding. El administrador decide por cliente
  // (campo useDemoData en tenants.json) si parte con datos de ejemplo o vacío.
  if (useDemoData) {
    return { opportunities: seedOpportunities, projects: seedProjects, accounts: seedAccounts, contacts: seedContacts, activities: seedActivities };
  }

  return { opportunities: [], projects: [], accounts: [], contacts: [], activities: [] };
}

function migrateOpportunities(raw: any[] | undefined): Opportunity[] {
  if (!raw || !Array.isArray(raw)) return seedOpportunities;
  return raw.map((o: any) => ({
    ...o,
    tags: o.tags ?? [],
    projectId: o.projectId ?? null,
    lossReason: o.lossReason || '',
    notes: o.notes || '',
    priority: o.priority || 'medium',
    expectedCloseDate: o.expectedCloseDate ?? null,
    actualCloseDate: o.actualCloseDate ?? null,
  }));
}

export function saveData(
  opportunities: Opportunity[],
  projects: Project[],
  accounts: Account[],
  contacts: Contact[],
  activities: Activity[]
) {
  const storageKey = getTenantStorageKey('crm_data');
  localStorage.setItem(storageKey, JSON.stringify({ opportunities, projects, accounts, contacts, activities }));
}
