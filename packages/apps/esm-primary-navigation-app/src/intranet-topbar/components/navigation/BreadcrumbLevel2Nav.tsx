"use client";

import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";
import { useWorkspace } from "../../context/WorkspaceContext";
import { WORKSPACES_MOCK_DATA } from "../../data/workspaceMockData";
import { SITES_LIST } from "../../data/sitesData";
import { findEmployeeByParam, getEmployeeUuid } from "../../data/directoryData";
import { playXboxSound } from "../../utils/xboxAudio";
import { Copy, Check } from "lucide-react";
import { WaterGlassModal } from "../ui/WaterGlassModal";

interface Props {
  onToggleFullMenu?: () => void;
  showFullMenuToggle?: boolean;
}

export function BreadcrumbLevel2Nav({ onToggleFullMenu, showFullMenuToggle = true }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const { workspaceId, currentWorkspace } = useWorkspace();
  const [isEllipsisOpen, setIsEllipsisOpen] = useState(false);
  const [isOptionSubmenuOpen, setIsOptionSubmenuOpen] = useState(false);
  const ellipsisRef = useRef<HTMLLIElement | null>(null);
  const optionMenuRef = useRef<HTMLLIElement | null>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ellipsisRef.current && !ellipsisRef.current.contains(target)) {
        setIsEllipsisOpen(false);
      }
      if (optionMenuRef.current && !optionMenuRef.current.contains(target)) {
        setIsOptionSubmenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Get current workspace navItems
  const navItems = currentWorkspace?.navItems || WORKSPACES_MOCK_DATA[0].navItems;

  // Sibling options (all workspace options EXCEPT "Accueil")
  const siblingOptions = navItems.filter(
    (item) => item.label.toLowerCase() !== "accueil" && item.id !== 1
  );

  // Determine current main option and sub-option from path
  const path = location.pathname.toLowerCase();

  // Mapping paths to Option & SubOption
  let activeOption = siblingOptions.find((opt) => {
    const labelLower = opt.label.toLowerCase();
    if (labelLower === "informations" && (path.startsWith("/informations") || path.startsWith("/actualites") || path.startsWith("/annonces"))) {
      return true;
    }
    if ((labelLower === "sites" || labelLower === "site" || labelLower === "services") && (path.startsWith("/sites") || path.startsWith("/services") || path.startsWith("/applications") || (path.startsWith("/ged") && !path.startsWith("/ged/recherche")))) {
      return true;
    }
    if (labelLower === "recherche" && (path.startsWith("/recherche") || path.startsWith("/ged/recherche"))) {
      return true;
    }
    if (labelLower === "annuaire" && path.startsWith("/annuaire")) {
      return true;
    }
    if (labelLower === "administration" && (path.startsWith("/administration") || path.startsWith("/iam"))) {
      return true;
    }
    return false;
  });

  // Fallback if no exact option matched
  if (!activeOption) {
    if (path.includes("actualites") || path.includes("annonces")) {
      activeOption = siblingOptions.find((o) => o.label.toLowerCase() === "informations");
    } else if (path.includes("applications") || path.includes("ged") || path.includes("/sites") || path.includes("/services")) {
      activeOption = siblingOptions.find((o) => {
        const l = o.label.toLowerCase();
        return l === "sites" || l === "site" || l === "services";
      });
    } else if (path.includes("recherche")) {
      activeOption = siblingOptions.find((o) => o.label.toLowerCase() === "recherche");
    } else if (path.includes("annuaire")) {
      activeOption = siblingOptions.find((o) => o.label.toLowerCase() === "annuaire");
    } else if (path.includes("iam") || path.includes("administration")) {
      activeOption = siblingOptions.find((o) => o.label.toLowerCase() === "administration");
    } else {
      activeOption = siblingOptions[0];
    }
  }

  // Get route target for main option
  const getOptionRoute = (optionLabel: string) => {
    const l = optionLabel.toLowerCase();
    if (l === "informations") return "/informations";
    if (l === "sites" || l === "site" || l === "services") return "/sites";
    if (l === "recherche") return "/recherche";
    if (l === "annuaire") return "/annuaire";
    if (l === "administration") return "/administration";
    return "/";
  };

  const [copiedUuid, setCopiedUuid] = useState(false);
  const [copiedCollaboratorUuid, setCopiedCollaboratorUuid] = useState(false);
  const currentServiceMatch = SITES_LIST.find((s) => path.includes(s.uuid.toLowerCase()));

  // Check if we are on a collaborator route under /annuaire (e.g. /annuaire/968579, /annuaire/968579/details)
  const annuaireParamMatch = location.pathname.match(/^\/annuaire\/([^\/]+)(?:\/.*)?$/i);
  const rawCollaboratorParam = annuaireParamMatch ? annuaireParamMatch[1] : null;
  const isAnnuaireSubTab = rawCollaboratorParam 
    ? ['contacts', 'organigramme', 'structures'].includes(rawCollaboratorParam.toLowerCase())
    : false;

  const currentCollaborator = (rawCollaboratorParam && !isAnnuaireSubTab)
    ? findEmployeeByParam(rawCollaboratorParam)
    : undefined;

  const collaboratorUuid = currentCollaborator
    ? (currentCollaborator.uuid || getEmployeeUuid(currentCollaborator))
    : (rawCollaboratorParam && !isAnnuaireSubTab ? rawCollaboratorParam : null);

  // Determine Sub-Option Title based on current route
  let subOptionTitle: string | null = null;
  if (path === "/informations/news" || path === "/actualites") {
    subOptionTitle = "News et Publications";
  } else if (path === "/informations/annonces" || path === "/annonces") {
    subOptionTitle = "Annonces";
  } else if (path === "/informations/agenda") {
    subOptionTitle = "Agenda";
  } else if (path.includes("/membres")) {
    subOptionTitle = "Membres & Équipes";
  } else if (path.includes("/applications")) {
    subOptionTitle = "Applications & Outils";
  } else if (path.includes("/ressources") || path.startsWith("/ged")) {
    subOptionTitle = "Ressources (GED)";
  } else if (path.includes("/taches")) {
    subOptionTitle = "Mes tâches";
  } else if (path.includes("/activite")) {
    subOptionTitle = "Activité";
  } else if (path.includes("/parametres")) {
    subOptionTitle = "Paramètres";
  } else if (path.startsWith("/collaboration")) {
    subOptionTitle = "Collaboration";
  } else if (path === "/annuaire/contacts") {
    subOptionTitle = "Collaborateurs";
  } else if (path === "/annuaire/organigramme") {
    subOptionTitle = "Organigramme";
  } else if (path === "/annuaire/structures") {
    subOptionTitle = "Structures & Sites";
  } else if (path === "/administration/utilisateurs" || path === "/iam") {
    subOptionTitle = "Accès & Identités (IAM)";
  } else if (collaboratorUuid) {
    if (path.includes("/purchase-history")) subOptionTitle = "Purchase History";
    else if (path.includes("/wishlist")) subOptionTitle = "Wishlist";
    else if (path.includes("/review")) subOptionTitle = "Review";
    else if (path.includes("/loyalty")) subOptionTitle = "Loyalty Program";
    else if (path.includes("/support")) subOptionTitle = "Support Ticket";
    else if (path.includes("/insight")) subOptionTitle = "Insight";
    else if (path.includes("/activity")) subOptionTitle = "Activity";
    else if (path.includes("/details")) subOptionTitle = "Détails";
  }

  const isAtOptionRoot = 
    (path === "/informations" || 
    path === "/sites" || 
    path === "/services" || 
    path === "/recherche" || 
    path === "/annuaire" || 
    path === "/administration") && !collaboratorUuid;

  const handleCopyUuidBreadcrumb = (uuid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playXboxSound('select');
    navigator.clipboard.writeText(uuid);
    setCopiedUuid(true);
    setTimeout(() => setCopiedUuid(false), 2000);
  };

  const handleCopyCollaboratorUuid = (uuid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playXboxSound('select');
    navigator.clipboard.writeText(uuid);
    setCopiedCollaboratorUuid(true);
    setTimeout(() => setCopiedCollaboratorUuid(false), 2000);
  };

  return (
    <div className="w-full flex items-center justify-between py-0.5 sm:py-1 select-none overflow-visible">
      {/* Breadcrumb Navigation Bar */}
      <Breadcrumb className="overflow-visible min-w-0">
        <BreadcrumbList className="flex items-center flex-nowrap gap-1 sm:gap-2 text-[11px] sm:text-sm font-medium text-slate-300">
          {/* 1. Item Accueil */}
          <BreadcrumbItem className="shrink-0">
            <BreadcrumbLink
              href="/"
              onClick={(e) => {
                e.preventDefault();
                playXboxSound('select');
                navigate("/home");
              }}
              className="text-slate-200 hover:text-white transition-colors cursor-pointer font-medium text-[11px] sm:text-xs md:text-sm"
              title="Retour à l'Accueil"
            >
              Accueil
            </BreadcrumbLink>
          </BreadcrumbItem>

          {/* Separator */}
          <BreadcrumbSeparator className="shrink-0 scale-75 sm:scale-100" />

          {/* 2. Item Ellipsis (...) - Liste des autres options de navigation */}
          <BreadcrumbItem className="relative shrink-0" ref={ellipsisRef}>
            <button
              type="button"
              onClick={() => {
                playXboxSound('select');
                setIsEllipsisOpen((prev) => !prev);
              }}
              className="text-slate-300 hover:text-white transition-colors cursor-pointer font-bold px-0.5 select-none text-[11px] sm:text-xs md:text-sm"
              title="Afficher la liste des options"
              aria-label="Toutes les options"
            >
              ...
            </button>

            {/* Ellipsis Glassmorphism Dropdown via WaterGlassModal */}
            {isEllipsisOpen && (
              <WaterGlassModal
                align="left"
                width="w-56"
                header={
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300">
                      Options de l'espace
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">
                      {currentWorkspace.name}
                    </span>
                  </div>
                }
                optionsComponent={
                  <div className="space-y-1">
                    {siblingOptions.map((opt) => {
                      const isCurrent = activeOption?.id === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => {
                            playXboxSound('select');
                            setIsEllipsisOpen(false);
                            navigate(getOptionRoute(opt.label));
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all cursor-pointer text-xs border-none ${
                            isCurrent
                              ? "bg-white/[0.10] text-teal-300 font-bold"
                              : "hover:bg-white/[0.06] text-slate-200/90 hover:text-white font-medium"
                          }`}
                        >
                          <span className="truncate">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                }
              />
            )}
          </BreadcrumbItem>

          {/* Separator */}
          <BreadcrumbSeparator className="shrink-0 scale-75 sm:scale-100" />

          {/* 3. Item Option Principale (e.g. Informations, Services, Annuaire...) */}
          {activeOption && (
            <BreadcrumbItem className="relative min-w-0 max-w-[80px] sm:max-w-[130px] md:max-w-none" ref={optionMenuRef}>
              {(subOptionTitle || currentServiceMatch || collaboratorUuid) && !isAtOptionRoot ? (
                <BreadcrumbLink
                  href={getOptionRoute(activeOption.label)}
                  onClick={(e) => {
                    e.preventDefault();
                    playXboxSound('select');
                    navigate(getOptionRoute(activeOption.label));
                  }}
                  className="text-slate-300 hover:text-white transition-colors cursor-pointer font-medium truncate block text-[11px] sm:text-xs md:text-sm"
                  title={activeOption.label}
                >
                  {activeOption.label}
                </BreadcrumbLink>
              ) : (
                <div className="flex items-center gap-1 min-w-0">
                  <button
                    onClick={() => {
                      playXboxSound('select');
                      if (activeOption?.subMenus && activeOption.subMenus.length > 0) {
                        setIsOptionSubmenuOpen((prev) => !prev);
                      }
                    }}
                    className="font-bold text-white hover:text-teal-200 transition-colors cursor-pointer text-[11px] sm:text-xs md:text-sm truncate block"
                    title={activeOption.label}
                  >
                    {activeOption.label}
                  </button>
                </div>
              )}

              {/* Option Submenu Dropdown via WaterGlassModal */}
              {isOptionSubmenuOpen && activeOption.subMenus && (
                <WaterGlassModal
                  align="left"
                  width="w-auto min-w-[210px]"
                  header={
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300">
                      Sous-options de {activeOption.label}
                    </span>
                  }
                  optionsComponent={
                    <div className="space-y-1.5">
                      {activeOption.subMenus.map((subMenu) => (
                        <div key={subMenu.title} className="space-y-1">
                          <div className="px-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                            {subMenu.title}
                          </div>
                          {subMenu.items.map((subItem) => (
                            <button
                              key={subItem.label}
                              onClick={() => {
                                playXboxSound('select');
                                setIsOptionSubmenuOpen(false);
                                if (subItem.onClick) subItem.onClick();
                                if (subItem.link) navigate(subItem.link);
                              }}
                              className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-white/[0.06] text-slate-200/90 hover:text-white transition-all cursor-pointer text-xs border-none"
                            >
                              <span className="truncate">{subItem.label}</span>
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  }
                />
              )}
            </BreadcrumbItem>
          )}

          {/* 3.5 Item Service Spécifique avec UUID copiable */}
          {currentServiceMatch && (
            <>
              <BreadcrumbSeparator className="shrink-0 scale-75 sm:scale-100" />
              <BreadcrumbItem className="min-w-0 max-w-[110px] sm:max-w-[180px] md:max-w-none">
                <div className="inline-flex items-center gap-1 min-w-0 max-w-full">
                  <span className="font-bold text-white text-[11px] sm:text-xs md:text-sm truncate">
                    {currentServiceMatch.shortName}
                  </span>
                  <button
                    onClick={(e) => handleCopyUuidBreadcrumb(currentServiceMatch.uuid, e)}
                    className="inline-flex items-center gap-0.5 sm:gap-1 px-1 py-0.2 sm:px-1.5 sm:py-0.5 rounded bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 text-[9px] sm:text-[11px] font-mono transition-colors cursor-pointer shrink-0"
                    title="Cliquer pour copier l'UUID du site"
                  >
                    <span className="truncate max-w-[50px] sm:max-w-none">({currentServiceMatch.uuid})</span>
                    {copiedUuid ? <Check className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-emerald-400 shrink-0" /> : <Copy className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-teal-400 shrink-0" />}
                  </button>
                </div>
              </BreadcrumbItem>
            </>
          )}

          {/* 3.6 Item Collaborateur avec UUID pour Annuaire */}
          {collaboratorUuid && (
            <>
              <BreadcrumbSeparator className="shrink-0 scale-75 sm:scale-100" />
              <BreadcrumbItem className="min-w-0 max-w-[160px] sm:max-w-[320px] md:max-w-none">
                <div className="inline-flex items-center gap-1.5 min-w-0 max-w-full">
                  {currentCollaborator?.avatar && (
                    <img
                      src={currentCollaborator.avatar}
                      alt={currentCollaborator.fullName}
                      className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover border border-white/20 shrink-0"
                    />
                  )}

                  {/* UUID Pill with Copy */}
                  <button
                    type="button"
                    onClick={(e) => handleCopyCollaboratorUuid(collaboratorUuid, e)}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/30 text-amber-300 text-[10px] sm:text-xs font-mono font-bold transition-all cursor-pointer shrink-0 shadow-sm"
                    title="Cliquer pour copier l'UUID du collaborateur"
                  >
                    <span>#{collaboratorUuid}</span>
                    {copiedCollaboratorUuid ? (
                      <Check className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                    ) : (
                      <Copy className="w-2.5 h-2.5 text-amber-300/70 hover:text-amber-200 shrink-0" />
                    )}
                  </button>

                  {/* Collaborator Full Name */}
                  {currentCollaborator && (
                    <button
                      type="button"
                      onClick={() => {
                        playXboxSound('select');
                        navigate(`/annuaire/${collaboratorUuid}/review`);
                      }}
                      className="font-bold text-white hover:text-amber-200 transition-colors cursor-pointer text-[11px] sm:text-xs md:text-sm truncate hidden xs:inline"
                      title={`${currentCollaborator.fullName} - ${currentCollaborator.role}`}
                    >
                      {currentCollaborator.fullName}
                    </button>
                  )}
                </div>
              </BreadcrumbItem>
            </>
          )}

          {/* 4. Item Sous-Option (si applicable) */}
          {subOptionTitle && !isAtOptionRoot && (
            <>
              <BreadcrumbSeparator className="shrink-0 scale-75 sm:scale-100" />
              <BreadcrumbItem className="min-w-0 max-w-[90px] sm:max-w-[150px] md:max-w-none">
                <BreadcrumbPage className="font-bold text-teal-300 text-[11px] sm:text-xs md:text-sm truncate block" title={subOptionTitle}>
                  {subOptionTitle}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Right Action: Quick toggle or Workspace Badge */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => {
            playXboxSound('select');
            if (onToggleFullMenu) {
              onToggleFullMenu();
            } else {
              navigate("/home");
            }
          }}
          className="hidden sm:inline-block text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
          title="Afficher la barre complète du menu"
        >
          Menu complet
        </button>

        <span className="hidden md:inline-block text-slate-400 text-xs font-medium">
          {currentWorkspace.name}
        </span>
      </div>
    </div>
  );
}
