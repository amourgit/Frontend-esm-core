export interface SiteItem {
  uuid: string;
  name: string;
  shortName: string;
  category: string;
  description: string;
  head: string;
  memberCount: number;
  appCount: number;
  status: string;
}

export const SITES_LIST: SiteItem[] = [
  {
    uuid: "srv-8f92a10b",
    name: "Direction des Systèmes d'Information",
    shortName: "DSI",
    category: "Technologies & Infras",
    description: "Infrastructures cloud, sécurité IAM, réseaux d'entreprise, support utilisateur et gouvernance GED.",
    head: "M. Jean-Luc BIKANGA",
    memberCount: 18,
    appCount: 6,
    status: "Opérationnel"
  },
  {
    uuid: "srv-3c71e92d",
    name: "Direction des Ressources Humaines",
    shortName: "DRH",
    category: "Administration & Personnel",
    description: "Gestion des talents, paie, mobilités internes, carrières et formations professionnelles.",
    head: "Mme Marie-Claire MBUYI",
    memberCount: 12,
    appCount: 4,
    status: "Actif"
  },
  {
    uuid: "srv-6a10f44e",
    name: "Direction de la Logistique & Bâtiments",
    shortName: "DLB",
    category: "Moyens Généraux",
    description: "Gestion des véhicules, approvisionnements, maintenance du patrimoine et accès physiques.",
    head: "M. Serge KABEYA",
    memberCount: 25,
    appCount: 3,
    status: "Actif"
  },
  {
    uuid: "srv-9d82b51c",
    name: "Direction Financière & Comptabilité",
    shortName: "DFC",
    category: "Finances & Budget",
    description: "Engagements budgétaires, trésorerie, facturation, contrôle de gestion et audits financiers.",
    head: "Mme Patricia TSHILOMBA",
    memberCount: 15,
    appCount: 5,
    status: "Opérationnel"
  }
];

export function getSiteByUuid(uuid?: string): SiteItem | undefined {
  if (!uuid) return undefined;
  return SITES_LIST.find((s) => s.uuid.toLowerCase() === uuid.toLowerCase());
}

// Aliases for compatibility
export type ServiceItem = SiteItem;
export const SERVICES_LIST = SITES_LIST;
export const getServiceByUuid = getSiteByUuid;
