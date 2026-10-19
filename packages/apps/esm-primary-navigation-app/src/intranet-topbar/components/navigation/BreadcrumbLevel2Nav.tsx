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
import { HOME_ROUTE, resolveActiveNav } from "../../utils/resolveActiveNav";
import { bindNavSelection } from "../../utils/navSelection";
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

  // Navigation de l'espace courant : celle que les apps ont déclarée sur le slot (aucune donnée codée en dur).
  const navItems = React.useMemo(
    () =>
      bindNavSelection(currentWorkspace?.navItems ?? [], {
        workspaceId,
        runDefault: (route) => {
          playXboxSound("select");
          if (route) navigate(`/${route}`);
        },
      }),
    [currentWorkspace, workspaceId, navigate],
  );

  // Options frères : toutes celles de l'espace, sauf l'accueil (déjà le premier élément du fil d'Ariane).
  const siblingOptions = navItems.filter((item) => item.route !== HOME_ROUTE);

  // Option et sous-option courantes, déduites de la route (la plus longue qui correspond au chemin).
  const path = location.pathname.toLowerCase();
  const activeNav = resolveActiveNav(siblingOptions, location.pathname);
  const activeOption = activeNav?.section;

  // Route du bouton d'une option (undefined si l'option n'est qu'un menu, sans page propre).
  const getOptionRoute = (option: { route?: string; subMenus?: { items: { route?: string }[] }[] }) => {
    const route = option.route ?? option.subMenus?.[0]?.items?.[0]?.route;
    return route ? `/${route}` : "/";
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

  // Titre de la sous-option : déduit de l'arborescence déclarée par les apps (route la plus précise).
  // Repli sur les cas propres à certaines pages (pages d'un site, onglets d'une fiche collaborateur).
  let subOptionTitle: string | null = activeNav?.entryLabel ?? null;
  if (!subOptionTitle) {
    if (path.includes("/membres")) {
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
  }

  const isAtOptionRoot = !!activeNav?.atSectionRoot && !collaboratorUuid;

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
                            navigate(getOptionRoute(opt));
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
                  href={getOptionRoute(activeOption)}
                  onClick={(e) => {
                    e.preventDefault();
                    playXboxSound('select');
                    navigate(getOptionRoute(activeOption));
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
                      {activeOption.subMenus.map((subMenu, subIdx) => (
                        <div key={`${subIdx}-${subMenu.title}`} className="space-y-1">
                          {subMenu.title ? (
                            <div className="px-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                              {subMenu.title}
                            </div>
                          ) : null}
                          {subMenu.items.map((subItem, itemIdx) => (
                            <button
                              key={`${subItem.entryName ?? subItem.label}-${itemIdx}`}
                              onClick={() => {
                                setIsOptionSubmenuOpen(false);
                                // Comportement déclaré par l'app, ou logique globale (son + navigation).
                                subItem.onClick?.();
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
