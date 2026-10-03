import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { PageBackground, playXboxSound } from '@egen-civitas/esm-framework';
import { 
  DIRECTORY_EMPLOYEES, 
  type DirectoryEmployee, 
  findEmployeeByParam, 
  getEmployeeCover, 
  getEmployeeUuid 
} from '../data/directory-data';
import { 
  CollaborateurDetailHeader, 
  type CollaborateurTabKey 
} from '../collaborateur/collaborateur-detail-header.component';
import { CollaborateurReviewList } from '../collaborateur/collaborateur-review-list.component';
import { CollaborateurOtherTabsView } from '../collaborateur/collaborateur-other-tabs-view.component';
import { CollaborateurDetailsCard } from '../collaborateur/collaborateur-details-card.component';
import { CollaborateurShippingAddressCard } from '../collaborateur/collaborateur-shipping-address-card.component';
import { CollaborateurContactInfoCard } from '../collaborateur/collaborateur-contact-info-card.component';
import { CollaborateurRoleCard } from '../collaborateur/collaborateur-role-card.component';
import { CollaborateurTagsCard } from '../collaborateur/collaborateur-tags-card.component';

interface CollaborateurDetailPageProps {
  onShowToast?: (msg: string, type?: 'info' | 'success' | 'warning') => void;
}

const VALID_TABS: CollaborateurTabKey[] = [
  'purchase-history',
  'wishlist',
  'review',
  'loyalty',
  'support',
  'insight',
  'activity',
];

export function CollaborateurDetailPage({ onShowToast }: CollaborateurDetailPageProps) {
  const { collaborateurId, uuid, id, tab } = useParams<{ collaborateurId?: string; uuid?: string; id?: string; tab?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const targetParam = collaborateurId || uuid || id || '968579';

  // Recherche du collaborateur correspondant par UUID ou ID
  const employee: DirectoryEmployee = useMemo(() => {
    const found = findEmployeeByParam(targetParam);
    if (found) return found;
    // Si non trouvé, repli gracieux sur Brooklyn Simmons ou le premier collaborateur
    return (
      DIRECTORY_EMPLOYEES.find(e => e.id === 'emp-brooklyn') ||
      DIRECTORY_EMPLOYEES[0]
    );
  }, [targetParam]);

  const employeeUuid = employee.uuid || getEmployeeUuid(employee);

  // Détection de l'onglet actif à partir de l'URL (ex: /annuaire/968579/wishlist ou /annuaire/968579/details/wishlist)
  const getTabFromLocation = (): CollaborateurTabKey => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    const lastPart = (tab || pathParts[pathParts.length - 1] || '').toLowerCase() as CollaborateurTabKey;
    if (VALID_TABS.includes(lastPart)) {
      return lastPart;
    }
    return 'review';
  };

  const [activeTab, setActiveTab] = useState<CollaborateurTabKey>(getTabFromLocation());

  useEffect(() => {
    setActiveTab(getTabFromLocation());
  }, [location.pathname, tab]);

  // Changement d'onglet avec navigation vers la route dédiée (comme pour les sites : /annuaire/UUID/tab)
  const handleTabChange = (newTab: CollaborateurTabKey) => {
    playXboxSound('select');
    setActiveTab(newTab);
    navigate(`/annuaire/${employeeUuid}/${newTab}`);
  };

  // Index actuel pour la navigation précédente / suivante
  const currentIndex = useMemo(() => {
    return DIRECTORY_EMPLOYEES.findIndex(e => e.id === employee.id);
  }, [employee]);

  const handlePrevEmployee = () => {
    if (currentIndex > 0) {
      const prev = DIRECTORY_EMPLOYEES[currentIndex - 1];
      const prevUuid = prev.uuid || getEmployeeUuid(prev);
      playXboxSound('toggle');
      navigate(`/annuaire/${prevUuid}/${activeTab}`);
    }
  };

  const handleNextEmployee = () => {
    if (currentIndex < DIRECTORY_EMPLOYEES.length - 1) {
      const next = DIRECTORY_EMPLOYEES[currentIndex + 1];
      const nextUuid = next.uuid || getEmployeeUuid(next);
      playXboxSound('toggle');
      navigate(`/annuaire/${nextUuid}/${activeTab}`);
    }
  };

  // Arrière-plan immersif : utilise la photo de couverture haute résolution du collaborateur
  const coverImage = getEmployeeCover(employee);

  return (
    <div className="w-full h-full min-h-0 overflow-y-auto flex flex-col justify-start relative select-none">
      
      {/* ── 1. Arrière-plan dynamique configuré avec la photo de couverture du collaborateur courant ── */}
      <PageBackground
        imageSrc={coverImage}
        imageAlt={`Photo de couverture de ${employee.fullName}`}
        showDarkWash={true}
        showGlow={true}
        className="opacity-95"
      />

      {/* ── 2. Contenu principal (Main) : Organisé par sections bien modulaires et transparentes ── */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col lg:flex-row lg:items-start gap-6">
      <div className="flex-1 min-w-0 flex flex-col gap-6">
        
        {/* Section 1 : En-tête avec avatar, nom, statut actif, UUID/ID, actions et onglets horizontaux avec routes dédiées */}
        <section className="w-full block">
          <CollaborateurDetailHeader
            employee={employee}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onPrevEmployee={currentIndex > 0 ? handlePrevEmployee : undefined}
            onNextEmployee={currentIndex < DIRECTORY_EMPLOYEES.length - 1 ? handleNextEmployee : undefined}
            onSendMessage={() => onShowToast?.(`Messagerie directe ouverte avec ${employee.fullName}`, 'success')}
            onShowToast={onShowToast}
          />
        </section>

        {/* Section 2 : Contenu de l'onglet actif (rendu selon la sous-page / route sélectionnée) */}
        <section className="w-full block">
          {activeTab === 'review' ? (
            <CollaborateurReviewList onShowToast={onShowToast} />
          ) : (
            <CollaborateurOtherTabsView
              activeTab={activeTab}
              employee={employee}
              onShowToast={onShowToast}
            />
          )}
        </section>

      </div>

      {/* ── 3. Volet latéral droit : cartes affichées dans l'aside (à droite dès lg, sous le contenu sinon) ── */}
      <aside className="w-full lg:w-[340px] xl:w-[380px] shrink-0 flex flex-col gap-4 lg:sticky lg:top-0">
        {/* Carte 1 : Customer Details (source, dernière connexion) */}
        <div className="w-full">
          <CollaborateurDetailsCard employee={employee} />
        </div>

        {/* Carte 2 : Shipping Address (carte interactive, pin, adresse) */}
        <div className="w-full">
          <CollaborateurShippingAddressCard
            employee={employee}
            onShowToast={onShowToast}
          />
        </div>

        {/* Carte 3 : Contact Information (email et téléphone avec copie) */}
        <div className="w-full">
          <CollaborateurContactInfoCard
            employee={employee}
            onShowToast={onShowToast}
          />
        </div>

        {/* Carte 4 : Contact Information / Rôle (Business Owner) */}
        <div className="w-full">
          <CollaborateurRoleCard
            employee={employee}
            onShowToast={onShowToast}
          />
        </div>

        {/* Carte 5 : Tags / Compétences */}
        <div className="w-full">
          <CollaborateurTagsCard
            employee={employee}
            onShowToast={onShowToast}
          />
        </div>
      </aside>

      </div>
    </div>
  );
}
