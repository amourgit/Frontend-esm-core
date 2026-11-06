"use client";

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Check, ChevronDown, ChevronRight, Copy } from "lucide-react";
import { Breadcrumb, BreadcrumbList, BreadcrumbSeparator } from "../ui/breadcrumb";
import { WaterGlassModal } from "../ui/WaterGlassModal";
import { useWorkspace } from "../../context/WorkspaceContext";
import { bindNavSelection } from "../../utils/navSelection";
import { buildBreadcrumbModel, type Crumb, type CrumbOption } from "../../utils/buildBreadcrumbModel";
import { computeBreadcrumbCollapse } from "../../utils/computeBreadcrumbCollapse";
import { SITES_LIST } from "../../data/sitesData";
import { findEmployeeByParam, getEmployeeUuid } from "../../data/directoryData";
import { playXboxSound } from "../../utils/xboxAudio";

// =============================================================================
//  FIL D'ARIANE DE LA TOPBAR
//
//  Élément de navigation : il s'affiche dans la région que lui attribue `global/placement.ts` (par défaut au
//  centre du niveau 2), sans rien supposer du niveau où il se trouve.
//
//  Qui fait quoi, dans l'ordre :
//   1. `buildBreadcrumbModel` (utils/) lit l'arbre de navigation + le chemin courant et produit
//      les maillons « Accueil › Section › Entrée » AVEC, pour chacun, ses alternatives de même niveau.
//   2. Ce composant y ajoute les maillons de contexte (site, collaborateur) puis les affiche.
//   3. Un maillon qui a des alternatives ouvre un menu en verre qui les liste ; sinon c'est un lien
//      (ou la page courante s'il est le dernier).
//   4. Si le fil ne tient pas dans la largeur, `computeBreadcrumbCollapse` dit combien de maillons
//      replier sous « … » : on garde toujours Accueil et le dernier maillon, on replie les ancêtres
//      du plus proche de la racine au plus proche de la page. Le clic sur « … » liste les maillons
//      repliés. Pas de débordement → pas de « … ».
//
//  Exemple : Accueil › Annuaire › Organigramme › #968579 › Détails — trop long :
//  Accueil › … › #968579 › Détails ; le clic sur « … » affiche « Annuaire » puis « Organigramme ».
// =============================================================================

interface Props {
  onToggleFullMenu?: () => void;
}

/** Un maillon affichable : modèle de navigation, ou maillon de contexte (rendu libre). */
interface ChainItem {
  key: string;
  label: string;
  crumb?: Crumb;
  /** Maillon de contexte (site, collaborateur) : contenu libre, sans alternatives. */
  custom?: React.ReactNode;
}

const TEXT = "text-[11px] sm:text-xs md:text-sm";

export function BreadcrumbNav({ onToggleFullMenu }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const { workspaceId, currentWorkspace } = useWorkspace();

  const navRef = useRef<HTMLElement | null>(null);
  const measureRef = useRef<HTMLOListElement | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(0);
  const [copied, setCopied] = useState<"site" | "collab" | null>(null);

  // ── 1. Arbre de navigation (déclaré par les apps) → modèle du fil ─────────────────────────
  const navItems = useMemo(
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

  const goHome = useCallback(() => {
    playXboxSound("select");
    navigate("/home");
  }, [navigate]);

  const model = useMemo(
    () => buildBreadcrumbModel(navItems, location.pathname, { goHome }),
    [navItems, location.pathname, goHome],
  );

  // ── 2. Contexte propre à certaines pages : site, fiche collaborateur ─────────────────────
  const path = location.pathname.toLowerCase();
  const currentSite = SITES_LIST.find((s) => path.includes(s.uuid.toLowerCase()));

  const annuaireMatch = location.pathname.match(/^\/annuaire\/([^/]+)(?:\/.*)?$/i);
  const rawParam = annuaireMatch ? annuaireMatch[1] : null;
  const isAnnuaireTab = rawParam ? ["contacts", "organigramme", "structures"].includes(rawParam.toLowerCase()) : false;
  const collaborator = rawParam && !isAnnuaireTab ? findEmployeeByParam(rawParam) : undefined;
  const collaboratorUuid = collaborator
    ? collaborator.uuid || getEmployeeUuid(collaborator)
    : rawParam && !isAnnuaireTab
      ? rawParam
      : null;

  // Onglets d'une fiche collaborateur (hors arbre de navigation).
  let fallbackEntryTitle: string | null = null;
  if (collaboratorUuid && !model.entry) {
    const tabs: [string, string][] = [
      ["/purchase-history", "Purchase History"],
      ["/wishlist", "Wishlist"],
      ["/review", "Review"],
      ["/loyalty", "Loyalty Program"],
      ["/support", "Support Ticket"],
      ["/insight", "Insight"],
      ["/activity", "Activity"],
      ["/details", "Détails"],
    ];
    fallbackEntryTitle = tabs.find(([segment]) => path.includes(segment))?.[1] ?? null;
  }

  const copy = (text: string, which: "site" | "collab", e: React.MouseEvent) => {
    e.stopPropagation();
    playXboxSound("select");
    navigator.clipboard?.writeText(text);
    setCopied(which);
    setTimeout(() => setCopied(null), 2000);
  };

  // ── 3. Chaîne ordonnée : Accueil › Section › [site] › [collaborateur] › Entrée ───────────
  const items: ChainItem[] = useMemo(() => {
    const chain: ChainItem[] = [{ key: model.home.key, label: model.home.label, crumb: model.home }];
    if (model.section) chain.push({ key: model.section.key, label: model.section.label, crumb: model.section });

    if (currentSite) {
      chain.push({
        key: `site-${currentSite.uuid}`,
        label: currentSite.shortName,
        custom: (
          <span className="inline-flex min-w-0 max-w-full items-center gap-1">
            <span className={`truncate font-bold text-white ${TEXT}`}>{currentSite.shortName}</span>
            <button
              type="button"
              onClick={(e) => copy(currentSite.uuid, "site", e)}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded bg-teal-500/10 px-1.5 py-0.5 font-mono text-[9px] text-teal-300 transition-colors hover:bg-teal-500/20 sm:text-[11px]"
              title="Cliquer pour copier l'UUID du site"
            >
              <span>({currentSite.uuid})</span>
              {copied === "site" ? <Check className="h-2.5 w-2.5 text-emerald-400" /> : <Copy className="h-2.5 w-2.5 text-teal-400" />}
            </button>
          </span>
        ),
      });
    }

    if (collaboratorUuid) {
      chain.push({
        key: `collab-${collaboratorUuid}`,
        label: collaborator?.fullName ?? `#${collaboratorUuid}`,
        custom: (
          <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">
            {collaborator?.avatar && (
              <img
                src={collaborator.avatar}
                alt={collaborator.fullName}
                className="h-4 w-4 shrink-0 rounded-full border border-white/20 object-cover sm:h-5 sm:w-5"
              />
            )}
            <button
              type="button"
              onClick={(e) => copy(collaboratorUuid, "collab", e)}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md border border-amber-400/30 bg-amber-400/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-300 transition-all hover:bg-amber-400/25 sm:text-xs"
              title="Cliquer pour copier l'UUID du collaborateur"
            >
              <span>#{collaboratorUuid}</span>
              {copied === "collab" ? <Check className="h-2.5 w-2.5 text-emerald-400" /> : <Copy className="h-2.5 w-2.5 text-amber-300/70" />}
            </button>
            {collaborator && <span className={`truncate font-bold text-white ${TEXT}`}>{collaborator.fullName}</span>}
          </span>
        ),
      });
    }

    if (model.entry) {
      chain.push({ key: model.entry.key, label: model.entry.label, crumb: model.entry });
    } else if (fallbackEntryTitle) {
      chain.push({
        key: `fallback-${fallbackEntryTitle}`,
        label: fallbackEntryTitle,
        custom: <span className={`truncate font-bold text-teal-300 ${TEXT}`}>{fallbackEntryTitle}</span>,
      });
    } else if (model.next && model.atSectionRoot && !collaboratorUuid) {
      chain.push({ key: model.next.key, label: model.next.label, crumb: model.next });
    }
    return chain;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, currentSite, collaborator, collaboratorUuid, fallbackEntryTitle, copied]);

  // ── 4. Repli sous « … » quand le fil ne tient pas ────────────────────────────────────────
  const itemsSignature = items.map((i) => `${i.key}:${i.label}`).join("|");

  const recompute = useCallback(() => {
    const nav = navRef.current;
    const meter = measureRef.current;
    if (!nav || !meter) return;
    const widths = Array.from(meter.querySelectorAll<HTMLElement>("[data-crumb]")).map((el) => el.offsetWidth);
    const sepEl = meter.querySelector<HTMLElement>("[data-sep]");
    const ellEl = meter.querySelector<HTMLElement>("[data-ellipsis]");
    const gap = parseFloat(getComputedStyle(meter).columnGap) || 0;
    const between = (sepEl?.offsetWidth ?? 12) + 2 * gap;
    setCollapsed(computeBreadcrumbCollapse(widths, between, ellEl?.offsetWidth ?? 24, nav.clientWidth));
  }, []);

  useLayoutEffect(() => {
    recompute();
  }, [recompute, itemsSignature]);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(recompute);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [recompute]);

  // Fermeture des menus : clic en dehors, Échap.
  useEffect(() => {
    if (!openKey) return;
    const onDown = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenKey(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenKey(null);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openKey]);

  // Un changement de page referme les menus.
  useEffect(() => setOpenKey(null), [location.pathname]);

  const lastIndex = items.length - 1;
  const hidden = items.slice(1, 1 + collapsed);
  const visible: { item: ChainItem; index: number }[] = [
    { item: items[0], index: 0 },
    ...items.slice(1 + collapsed).map((item, i) => ({ item, index: 1 + collapsed + i })),
  ];

  // ── Rendu d'un menu d'alternatives (verre) ───────────────────────────────────────────────
  const renderOptions = (options: CrumbOption[]) => {
    let lastGroup: string | undefined;
    return (
      <div className="space-y-0.5">
        {options.map((opt) => {
          const heading = opt.group && opt.group !== lastGroup ? opt.group : null;
          lastGroup = opt.group;
          const Icon = opt.icon;
          return (
            <React.Fragment key={opt.key}>
              {heading && (
                <div className="mt-1 px-2 text-[9px] font-bold uppercase tracking-wider text-slate-400">{heading}</div>
              )}
              <button
                type="button"
                disabled={!opt.onSelect}
                onClick={() => {
                  setOpenKey(null);
                  opt.onSelect?.();
                }}
                aria-current={opt.current ? "page" : undefined}
                className={`flex w-full cursor-pointer items-center gap-2 rounded-xl border-none px-3 py-1.5 text-left text-xs transition-all disabled:cursor-default disabled:opacity-40 ${
                  opt.current
                    ? "bg-white/[0.10] font-bold text-teal-300"
                    : "font-medium text-slate-200/90 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                {Icon && <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />}
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate">{opt.label}</span>
                  {opt.description && <span className="truncate text-[10px] font-normal text-slate-400">{opt.description}</span>}
                </span>
                {opt.current && <Check className="h-3 w-3 shrink-0 text-teal-300" />}
              </button>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // ── Rendu du corps d'un maillon (interactif ou statique pour la mesure) ───────────────────
  const renderCrumb = (item: ChainItem, index: number, interactive: boolean) => {
    if (item.custom) return item.custom;
    const crumb = item.crumb as Crumb;
    const isLast = index === lastIndex;
    const hasMenu = crumb.options.length > 1;
    const colour = isLast ? "font-bold text-teal-300" : "font-medium text-slate-300 hover:text-white";
    const label = <span className="truncate">{crumb.label}</span>;

    if (hasMenu) {
      return (
        <>
          <button
            type="button"
            tabIndex={interactive ? 0 : -1}
            aria-haspopup="listbox"
            aria-expanded={interactive ? openKey === crumb.key : undefined}
            onClick={() => {
              playXboxSound("select");
              setOpenKey((prev) => (prev === crumb.key ? null : crumb.key));
            }}
            title={`${crumb.label} — afficher les options de ce niveau`}
            className={`inline-flex min-w-0 max-w-[16rem] cursor-pointer items-center gap-0.5 transition-colors ${TEXT} ${colour}`}
          >
            {label}
            <ChevronDown className={`h-3 w-3 shrink-0 opacity-70 transition-transform ${interactive && openKey === crumb.key ? "rotate-180" : ""}`} />
          </button>
          {interactive && openKey === crumb.key && (
            <WaterGlassModal
              align="left"
              width="w-auto min-w-[220px] max-w-[18rem]"
              header={
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300">
                  {crumb.menuTitle ?? crumb.label}
                </span>
              }
              optionsComponent={<div className="max-h-[60vh] overflow-y-auto">{renderOptions(crumb.options)}</div>}
            />
          )}
        </>
      );
    }

    if (isLast || !crumb.onSelect) {
      return (
        <span
          aria-current={isLast ? "page" : undefined}
          className={`max-w-[16rem] truncate ${TEXT} ${isLast ? "font-bold text-teal-300" : "font-medium text-slate-300"}`}
          title={crumb.label}
        >
          {crumb.label}
        </span>
      );
    }
    return (
      <button
        type="button"
        tabIndex={interactive ? 0 : -1}
        onClick={crumb.onSelect}
        title={crumb.kind === "home" ? "Retour à l'Accueil" : crumb.label}
        className={`max-w-[16rem] cursor-pointer truncate transition-colors ${TEXT} ${crumb.kind === "home" ? "font-medium text-slate-200 hover:text-white" : colour}`}
      >
        {crumb.label}
      </button>
    );
  };

  const separator = <BreadcrumbSeparator className="shrink-0 scale-75 sm:scale-100" />;
  // Espacement et non-retour-à-la-ligne en style inline : déterministes (la mesure du repli en dépend)
  // et immunisés contre les classes par défaut de `BreadcrumbList` (flex-wrap, gap-1.5…).
  const listClass = "flex items-center text-slate-300";
  const listStyle: React.CSSProperties = { flexWrap: "nowrap", columnGap: 6, rowGap: 0 };

  return (
    <div className="flex w-full select-none items-center justify-between overflow-visible py-0.5 sm:py-1">
      <Breadcrumb ref={navRef} className="relative min-w-0 flex-1 overflow-visible">
        <BreadcrumbList className={listClass} style={listStyle}>
          {visible.map(({ item, index }) => (
            <React.Fragment key={item.key}>
              {index > 0 && separator}

              {/* « … » : replié entre l'Accueil et le premier maillon visible */}
              {index === 1 + collapsed && collapsed > 0 && (
                <>
                  <li className="relative shrink-0">
                    <button
                      type="button"
                      aria-haspopup="menu"
                      aria-expanded={openKey === "ellipsis"}
                      onClick={() => {
                        playXboxSound("select");
                        setOpenKey((prev) => (prev === "ellipsis" ? null : "ellipsis"));
                      }}
                      className={`cursor-pointer px-0.5 font-bold text-slate-300 transition-colors hover:text-white ${TEXT}`}
                      title="Afficher les niveaux masqués"
                      aria-label="Niveaux masqués du fil d'Ariane"
                    >
                      …
                    </button>
                    {openKey === "ellipsis" && (
                      <WaterGlassModal
                        align="left"
                        width="w-auto min-w-[200px] max-w-[18rem]"
                        header={<span className="text-[10px] font-bold uppercase tracking-wider text-teal-300">Niveaux masqués</span>}
                        optionsComponent={
                          <div className="space-y-0.5">
                            {hidden.map((h, depth) => {
                              const action = h.crumb?.onSelect;
                              return (
                                <button
                                  key={h.key}
                                  type="button"
                                  disabled={!action}
                                  onClick={() => {
                                    setOpenKey(null);
                                    action?.();
                                  }}
                                  style={{ paddingLeft: `${0.75 + depth * 0.75}rem` }}
                                  className="flex w-full cursor-pointer items-center gap-1 rounded-xl border-none py-1.5 pr-3 text-left text-xs font-medium text-slate-200/90 transition-all hover:bg-white/[0.06] hover:text-white disabled:cursor-default disabled:opacity-60"
                                >
                                  {depth > 0 && <ChevronRight className="h-3 w-3 shrink-0 opacity-60" />}
                                  <span className="truncate">{h.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        }
                      />
                    )}
                  </li>
                  {separator}
                </>
              )}

              <li
                className="relative inline-flex items-center"
                style={index === lastIndex ? { minWidth: 0, flex: "0 1 auto" } : { flex: "0 0 auto" }}
              >
                {renderCrumb(item, index, true)}
              </li>
            </React.Fragment>
          ))}
        </BreadcrumbList>

        {/* Mesureur invisible : largeur naturelle de chaque maillon, du séparateur et de « … » */}
        <ol
          ref={measureRef}
          aria-hidden="true"
          className={listClass}
          style={{
            ...listStyle,
            position: "absolute",
            top: 0,
            left: 0,
            visibility: "hidden",
            pointerEvents: "none",
            height: 0,
            overflow: "hidden",
            width: "max-content",
            whiteSpace: "nowrap",
          }}
        >
          {items.map((item, index) => (
            <li key={item.key} data-crumb className="inline-flex items-center">
              {renderCrumb(item, index, false)}
            </li>
          ))}
          <li data-sep className="shrink-0 scale-75 sm:scale-100">
            <span className="px-0.5">/</span>
          </li>
          <li data-ellipsis className={`px-0.5 font-bold ${TEXT}`}>
            …
          </li>
        </ol>
      </Breadcrumb>

      {/* Action de droite : retour au menu complet */}
      <div className="flex shrink-0 items-center gap-3 pl-2">
        <button
          type="button"
          onClick={() => {
            playXboxSound("select");
            if (onToggleFullMenu) onToggleFullMenu();
            else navigate("/home");
          }}
          className="hidden cursor-pointer text-xs font-medium text-slate-300 transition-colors hover:text-white sm:inline-block"
          title="Afficher la barre complète du menu"
        >
          Menu complet
        </button>
        <span className="hidden text-xs font-medium text-slate-400 md:inline-block">{currentWorkspace.name}</span>
      </div>
    </div>
  );
}
