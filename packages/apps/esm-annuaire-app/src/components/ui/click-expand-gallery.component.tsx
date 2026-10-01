import * as React from "react"
import { motion, useReducedMotion } from "framer-motion"
import { ChevronDown } from "lucide-react"

// ─────────────────────────────────────────────────────────────
// Types publics
// ─────────────────────────────────────────────────────────────

export type ClickExpandId = string | number

/** Couleur sémantique d'une pastille (statut, badge...). */
export type ClickExpandTone = "neutral" | "accent" | "success" | "warning" | "danger" | "info"

/** Classes Tailwind d'une teinte : `dot` pour le point de statut, `chip` pour la pastille. */
export type ClickExpandToneClasses = { dot: string; chip: string }

export type ClickExpandChip = {
  label: string
  tone?: ClickExpandTone
  icon?: React.ReactNode
}

export type ClickExpandDetail = {
  /** Identifiant unique dans la fiche. */
  id: string
  label: string
  /** Valeur affichée. Une valeur vide (undefined, null, "", false) masque la ligne. */
  value?: React.ReactNode
  icon?: React.ReactNode
  /** Rend la valeur cliquable : `tel:`, `mailto:`, `https://...` */
  href?: string
}

export type ClickExpandAction = {
  id: string
  label: string
  icon?: React.ReactNode
  onClick?: (event: React.MouseEvent<HTMLElement>) => void
  /** Si fourni, l'action est rendue comme un lien <a> au lieu d'un <button>. */
  href?: string
  target?: string
  /** "primary" = bouton plein, "secondary" = bouton discret. Défaut : "secondary". */
  variant?: "primary" | "secondary"
  disabled?: boolean
}

export type ClickExpandItem<T = unknown> = {
  /** Unique dans la liste. Sert de clé React et d'identifiant d'ouverture. */
  id: ClickExpandId
  /** Nom — visible au repos ET à l'ouverture. */
  title: string
  /** Poste / rôle — visible au repos ET à l'ouverture. */
  subtitle?: string
  /** Photo — visible au repos ET à l'ouverture (grandit à l'ouverture). */
  image?: string
  /** Texte alternatif. Vide par défaut, car le nom est déjà affiché à côté. */
  imageAlt?: string
  /** Fond CSS de la photo (dégradé, couleur). Utilisé sans image, ou si elle échoue. */
  accent?: string
  /** Point coloré sur la photo au repos + pastille dans le contenu ouvert. */
  status?: { label: string; tone?: ClickExpandTone }
  /** Pastilles supplémentaires (badge, distinction...) — contenu ouvert. */
  chips?: ClickExpandChip[]
  /** Lignes d'informations (site, téléphone, email...) — contenu ouvert. */
  details?: ClickExpandDetail[]
  /** Étiquettes (compétences...) — contenu ouvert. */
  tags?: readonly string[]
  /** Boutons d'action — contenu ouvert. */
  actions?: ClickExpandAction[]
  /** Contenu libre ajouté en bas du contenu ouvert. */
  content?: React.ReactNode
  /** Empêche l'ouverture de cette fiche. */
  disabled?: boolean
  /** Votre objet d'origine, restitué tel quel dans `onOpenChange` et les render props. */
  data?: T
}

/** État transmis aux render props. */
export type ClickExpandState = { isOpen: boolean; index: number }

export type ClickExpandAvatarShape = "circle" | "rounded" | "morph"

/**
 * Habillage visuel. Chaque clé REMPLACE la classe par défaut correspondante ;
 * la structure (flex, grid, overflow, transitions) reste gérée par le composant.
 */
export type ClickExpandClassNames = {
  /** Carte au repos. */
  item?: string
  /** Carte ouverte. */
  itemOpen?: string
  /** Classes ajoutées au bouton d'en-tête (zone cliquable). */
  header?: string
  /** Anneau de focus clavier (en-tête et actions). */
  focus?: string
  /** Cadre de la photo. */
  avatar?: string
  title?: string
  subtitle?: string
  chevron?: string
  /** Conteneur du contenu ouvert (séparateur, fond...). */
  panel?: string
  detailIcon?: string
  detailLabel?: string
  detailValue?: string
  detailLink?: string
  tagsTitle?: string
  tag?: string
  actionPrimary?: string
  actionSecondary?: string
}

export type ClickExpandLabels<T = unknown> = {
  /** aria-label de la liste. */
  list?: string
  /** Infobulle de l'en-tête quand la fiche est fermée. */
  open?: (item: ClickExpandItem<T>) => string
  /** Infobulle de l'en-tête quand la fiche est ouverte. */
  close?: (item: ClickExpandItem<T>) => string
  /** Titre au-dessus des étiquettes (ex. « Compétences »). Masqué si absent. */
  tags?: string
}

export type ClickExpandGalleryProps<T = unknown> = {
  items: readonly ClickExpandItem<T>[]

  /** Mode contrôlé : ids ouverts. À associer à `onOpenChange`. */
  openIds?: ClickExpandId[]
  /** Mode non contrôlé : ids ouverts au départ. Défaut : aucun (tout est fermé). */
  defaultOpenIds?: ClickExpandId[]
  /** Appelée à chaque clic d'ouverture / fermeture, avec la nouvelle liste d'ids ouverts. */
  onOpenChange?: (
    openIds: ClickExpandId[],
    change: { item: ClickExpandItem<T>; open: boolean }
  ) => void
  /** Autorise plusieurs fiches ouvertes en même temps. Défaut : false (une seule). */
  multiple?: boolean

  /** Largeur minimale d'une carte, en px. Sert à calculer le nombre de colonnes. Défaut : 272. */
  minItemWidth?: number
  /** Espace entre les cartes, en px. Défaut : 14. */
  gap?: number
  /** Taille de la photo au repos, en px. Défaut : 56. */
  restImageSize?: number
  /** Taille de la photo à l'ouverture, en px. Défaut : 80. */
  openImageSize?: number
  /** Forme de la photo : "circle", "rounded", ou "morph" (cercle → carré arrondi à l'ouverture). Défaut : "morph". */
  avatarShape?: ClickExpandAvatarShape
  /** Durée d'ouverture / fermeture, en ms. Défaut : 520. */
  duration?: number
  /** Fait défiler la fiche dans la zone visible après ouverture. Défaut : true. */
  scrollIntoView?: boolean
  /** Apparition échelonnée des cartes au montage. Défaut : true. */
  animateEntrance?: boolean
  /** Politique de referrer des photos. Défaut : "no-referrer". */
  imageReferrerPolicy?: React.HTMLAttributeReferrerPolicy

  labels?: ClickExpandLabels<T>
  classNames?: ClickExpandClassNames
  /** Remplace tout ou partie des teintes (success, warning...). */
  tones?: Partial<Record<ClickExpandTone, ClickExpandToneClasses>>

  /** Remplace le bloc nom + poste de l'en-tête. Contenu inline uniquement (<span>...), il est dans un <button>. */
  renderHeader?: (item: ClickExpandItem<T>, state: ClickExpandState) => React.ReactNode
  /** Remplace tout le contenu par défaut de la zone ouverte. */
  renderContent?: (item: ClickExpandItem<T>, state: ClickExpandState) => React.ReactNode
  /** Affiché à la place de la liste quand `items` est vide. */
  empty?: React.ReactNode
  /** Classes ajoutées à la liste racine (<ul>). */
  className?: string
}

// ─────────────────────────────────────────────────────────────
// Valeurs par défaut (habillage aligné sur la page Annuaire : slate + teal)
// ─────────────────────────────────────────────────────────────

const DEFAULT_CLASSNAMES: Required<ClickExpandClassNames> = {
  item: "rounded-2xl border border-white/10 bg-slate-900/60 shadow-lg backdrop-blur-md hover:border-white/20 hover:bg-slate-900/75",
  itemOpen:
    "rounded-2xl border border-teal-400/40 bg-slate-900/80 shadow-xl shadow-teal-500/10 backdrop-blur-md",
  header: "",
  focus: "focus-visible:ring-teal-400/60",
  avatar: "bg-slate-800 ring-1 ring-white/15",
  title: "text-sm font-bold text-white",
  subtitle: "text-xs text-slate-400",
  chevron: "text-slate-400 group-hover:text-white",
  panel: "border-t border-white/10",
  detailIcon: "bg-white/5 text-teal-400",
  detailLabel: "text-slate-500",
  detailValue: "text-slate-200",
  detailLink: "hover:text-teal-300",
  tagsTitle: "text-slate-500",
  tag: "border border-white/10 bg-white/5 text-slate-300",
  actionPrimary: "bg-teal-500 text-slate-950 shadow-lg hover:bg-teal-400",
  actionSecondary: "border border-white/15 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white",
}

const DEFAULT_TONES: Record<ClickExpandTone, ClickExpandToneClasses> = {
  neutral: { dot: "bg-slate-400", chip: "border-white/15 bg-white/5 text-slate-200" },
  accent: { dot: "bg-teal-400", chip: "border-teal-400/40 bg-teal-500/15 text-teal-200" },
  success: { dot: "bg-emerald-400", chip: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300" },
  warning: { dot: "bg-amber-400", chip: "border-amber-400/30 bg-amber-500/10 text-amber-300" },
  danger: { dot: "bg-rose-400", chip: "border-rose-400/30 bg-rose-500/10 text-rose-300" },
  info: { dot: "bg-sky-400", chip: "border-sky-400/30 bg-sky-500/10 text-sky-300" },
}

/** Rayon de la photo [repos, ouvert], en % (50% = cercle). */
const AVATAR_RADIUS: Record<ClickExpandAvatarShape, [string, string]> = {
  circle: ["50%", "50%"],
  rounded: ["24%", "24%"],
  morph: ["50%", "24%"],
}

/** Fusionne `custom` dans `base` en ignorant les valeurs undefined. */
function mergeDefined<V extends object>(base: V, custom?: Partial<V>): V {
  if (!custom) return base
  const merged = { ...base }
  for (const key of Object.keys(custom) as (keyof V)[]) {
    const value = custom[key]
    if (value !== undefined) merged[key] = value as V[keyof V]
  }
  return merged
}

const initialsOf = (title: string): string => {
  const parts = title.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  const first = parts[0].charAt(0)
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : ""
  return (first + last).toUpperCase()
}

// ─────────────────────────────────────────────────────────────
// Photo (image, ou initiales si absente / en échec)
// ─────────────────────────────────────────────────────────────

interface PhotoProps {
  src?: string
  alt: string
  initials: string
  fontSize: number
  referrerPolicy: React.HTMLAttributeReferrerPolicy
}

function Photo({ src, alt, initials, fontSize, referrerPolicy }: PhotoProps) {
  const [failed, setFailed] = React.useState(false)

  React.useEffect(() => {
    setFailed(false)
  }, [src])

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={alt}
        draggable={false}
        loading="lazy"
        decoding="async"
        referrerPolicy={referrerPolicy}
        onError={() => setFailed(true)}
        className="block h-full w-full object-cover"
        style={{ maxWidth: "none" }}
      />
    )
  }

  return (
    <span
      aria-hidden
      className="flex h-full w-full select-none items-center justify-center font-bold text-white/90 transition-[font-size] duration-[var(--cx-t)] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none"
      style={{ fontSize }}
    >
      {initials}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────
// Une fiche (repos : photo + nom + poste ; ouverte : tout le contenu)
// ─────────────────────────────────────────────────────────────

interface ItemSettings {
  restImageSize: number
  openImageSize: number
  avatarShape: ClickExpandAvatarShape
  duration: number
  scrollIntoView: boolean
  animateEntrance: boolean
  referrerPolicy: React.HTMLAttributeReferrerPolicy
}

interface ExpandItemProps<T> {
  key?: React.Key
  item: ClickExpandItem<T>
  index: number
  isOpen: boolean
  onToggle: () => void
  baseId: string
  reduceMotion: boolean
  settings: ItemSettings
  classes: Required<ClickExpandClassNames>
  tones: Record<ClickExpandTone, ClickExpandToneClasses>
  toggleTitle: string
  tagsTitle?: string
  renderHeader?: (item: ClickExpandItem<T>, state: ClickExpandState) => React.ReactNode
  renderContent?: (item: ClickExpandItem<T>, state: ClickExpandState) => React.ReactNode
}

function ExpandItem<T>({
  item,
  index,
  isOpen,
  onToggle,
  baseId,
  reduceMotion,
  settings,
  classes,
  tones,
  toggleTitle,
  tagsTitle,
  renderHeader,
  renderContent,
}: ExpandItemProps<T>) {
  const itemRef = React.useRef<HTMLLIElement>(null)
  const headerRef = React.useRef<HTMLButtonElement>(null)
  const wasOpen = React.useRef(isOpen)

  const domId = `${baseId}-${String(item.id).replace(/\s+/g, "-")}`
  const panelId = `${domId}-panel`
  const state: ClickExpandState = { isOpen, index }

  // Après ouverture, ramène la fiche dans la zone visible (le scroll est celui du parent).
  const { scrollIntoView, duration } = settings
  React.useEffect(() => {
    const justOpened = isOpen && !wasOpen.current
    wasOpen.current = isOpen
    if (!justOpened || !scrollIntoView) return undefined
    const timer = window.setTimeout(() => {
      itemRef.current?.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" })
    }, duration * 0.7)
    return () => window.clearTimeout(timer)
  }, [isOpen, scrollIntoView, duration, reduceMotion])

  const entrance =
    settings.animateEntrance && !reduceMotion
      ? {
          initial: { opacity: 0, y: 14, scale: 0.98 },
          animate: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { duration: 0.28, ease: "easeOut" as const, delay: Math.min(index, 12) * 0.03 },
          },
        }
      : {}

  const [radiusRest, radiusOpen] = AVATAR_RADIUS[settings.avatarShape]
  const size = isOpen ? settings.openImageSize : settings.restImageSize

  const details = (item.details ?? []).filter(
    (detail) =>
      detail.value !== undefined && detail.value !== null && detail.value !== "" && detail.value !== false
  )
  const hasChips = Boolean(item.status) || (item.chips?.length ?? 0) > 0
  const hasTags = (item.tags?.length ?? 0) > 0
  const hasActions = (item.actions?.length ?? 0) > 0

  const easeClasses =
    "duration-[var(--cx-t)] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none"

  return (
    <motion.li
      ref={itemRef}
      {...entrance}
      onKeyDown={(event) => {
        // Échap referme la fiche et rend le focus à son en-tête.
        if (event.key === "Escape" && isOpen) {
          event.stopPropagation()
          onToggle()
          headerRef.current?.focus()
        }
      }}
      className="min-w-0 scroll-my-2 list-none"
    >
      <div
        data-state={isOpen ? "open" : "closed"}
        className={`overflow-hidden transition-[border-color,background-color,box-shadow] duration-200 motion-reduce:transition-none ${
          isOpen ? classes.itemOpen : classes.item
        }`}
      >
        {/* ── REPOS : photo, nom, poste — seule zone qui ouvre / ferme, uniquement au clic ── */}
        <button
          ref={headerRef}
          type="button"
          id={domId}
          aria-expanded={isOpen}
          aria-controls={panelId}
          disabled={item.disabled}
          title={toggleTitle}
          onClick={onToggle}
          className={`group flex w-full cursor-pointer items-center gap-3 p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-60 ${
            isOpen ? "rounded-t-[inherit]" : "rounded-[inherit]"
          } ${classes.focus} ${classes.header}`}
        >
          <span
            className={`relative shrink-0 transition-[width,height] ${easeClasses}`}
            style={{ width: size, height: size }}
          >
            <span
              className={`absolute inset-0 overflow-hidden transition-[border-radius] ${easeClasses} ${classes.avatar}`}
              style={{ borderRadius: isOpen ? radiusOpen : radiusRest, background: item.accent }}
            >
              <Photo
                src={item.image}
                alt={item.imageAlt ?? ""}
                initials={initialsOf(item.title)}
                fontSize={Math.round(size * 0.34)}
                referrerPolicy={settings.referrerPolicy}
              />
            </span>
            {item.status ? (
              <span
                role="img"
                aria-label={item.status.label}
                title={item.status.label}
                className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-slate-900 ${
                  tones[item.status.tone ?? "neutral"].dot
                }`}
              />
            ) : null}
          </span>

          <span className="min-w-0 flex-1 text-left">
            {renderHeader ? (
              renderHeader(item, state)
            ) : (
              <>
                <span className={`block ${isOpen ? "break-words" : "truncate"} ${classes.title}`}>
                  {item.title}
                </span>
                {item.subtitle ? (
                  <span className={`mt-0.5 block ${isOpen ? "break-words" : "truncate"} ${classes.subtitle}`}>
                    {item.subtitle}
                  </span>
                ) : null}
              </>
            )}
          </span>

          <ChevronDown
            aria-hidden
            className={`h-4 w-4 shrink-0 transition-transform ${easeClasses} ${isOpen ? "rotate-180" : ""} ${classes.chevron}`}
          />
        </button>

        {/* ── OUVERTURE : tout le contenu. Fermé = invisible (donc non focalisable). ── */}
        <div
          id={panelId}
          role="region"
          aria-labelledby={domId}
          style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
          className={`grid transition-[grid-template-rows,opacity,visibility] ${easeClasses} ${
            isOpen ? "visible opacity-100" : "invisible opacity-0"
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <div className={`space-y-3.5 px-3.5 pb-3.5 pt-3 ${classes.panel}`}>
              {renderContent ? (
                renderContent(item, state)
              ) : (
                <>
                  {hasChips ? (
                    <div className="flex flex-wrap gap-1.5">
                      {item.status ? (
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                            tones[item.status.tone ?? "neutral"].chip
                          }`}
                        >
                          <span
                            aria-hidden
                            className={`h-1.5 w-1.5 rounded-full ${tones[item.status.tone ?? "neutral"].dot}`}
                          />
                          {item.status.label}
                        </span>
                      ) : null}
                      {item.chips?.map((chip, i) => (
                        <span
                          key={`${chip.label}-${i}`}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                            tones[chip.tone ?? "neutral"].chip
                          }`}
                        >
                          {chip.icon}
                          {chip.label}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {details.length > 0 ? (
                    <dl
                      className="m-0 grid gap-2.5"
                      style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 11rem), 1fr))" }}
                    >
                      {details.map((detail) => (
                        <div key={detail.id} className="flex min-w-0 items-start gap-2.5">
                          {detail.icon ? (
                            <span
                              aria-hidden
                              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${classes.detailIcon}`}
                            >
                              {detail.icon}
                            </span>
                          ) : null}
                          <div className="min-w-0">
                            <dt className={`text-[11px] font-medium ${classes.detailLabel}`}>{detail.label}</dt>
                            <dd className={`m-0 break-words text-xs font-medium ${classes.detailValue}`}>
                              {detail.href ? (
                                <a
                                  href={detail.href}
                                  className={`transition-colors focus-visible:underline focus-visible:outline-none ${classes.detailLink}`}
                                >
                                  {detail.value}
                                </a>
                              ) : (
                                detail.value
                              )}
                            </dd>
                          </div>
                        </div>
                      ))}
                    </dl>
                  ) : null}

                  {hasTags ? (
                    <div>
                      {tagsTitle ? (
                        <p className={`m-0 mb-1.5 text-[11px] font-medium ${classes.tagsTitle}`}>{tagsTitle}</p>
                      ) : null}
                      <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
                        {item.tags?.map((tag, i) => (
                          <li
                            key={`${tag}-${i}`}
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${classes.tag}`}
                          >
                            {tag}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {hasActions ? (
                    <div className="flex flex-wrap gap-2 pt-0.5">
                      {item.actions?.map((action) => {
                        const skin = action.variant === "primary" ? classes.actionPrimary : classes.actionSecondary
                        const actionClass = `inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 active:scale-95 disabled:pointer-events-none disabled:opacity-50 ${classes.focus} ${skin}`
                        const inner = (
                          <>
                            {action.icon}
                            <span>{action.label}</span>
                          </>
                        )
                        return action.href && !action.disabled ? (
                          <a
                            key={action.id}
                            href={action.href}
                            target={action.target}
                            rel={action.target === "_blank" ? "noopener noreferrer" : undefined}
                            onClick={action.onClick}
                            className={actionClass}
                          >
                            {inner}
                          </a>
                        ) : (
                          <button
                            key={action.id}
                            type="button"
                            disabled={action.disabled}
                            onClick={action.onClick}
                            className={actionClass}
                          >
                            {inner}
                          </button>
                        )
                      })}
                    </div>
                  ) : null}

                  {item.content}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.li>
  )
}

// ─────────────────────────────────────────────────────────────
// Composant
// ─────────────────────────────────────────────────────────────

export function ClickExpandGallery<T = unknown>({
  items,
  openIds: openIdsProp,
  defaultOpenIds,
  onOpenChange,
  multiple = false,
  minItemWidth = 272,
  gap = 14,
  restImageSize = 56,
  openImageSize = 80,
  avatarShape = "morph",
  duration = 520,
  scrollIntoView = true,
  animateEntrance = true,
  imageReferrerPolicy = "no-referrer",
  labels,
  classNames,
  tones,
  renderHeader,
  renderContent,
  empty,
  className = "",
}: ClickExpandGalleryProps<T>) {
  const reduceMotion = useReducedMotion() ?? false
  const baseId = React.useId()

  const [innerOpenIds, setInnerOpenIds] = React.useState<ClickExpandId[]>(() =>
    multiple ? [...(defaultOpenIds ?? [])] : (defaultOpenIds ?? []).slice(0, 1)
  )
  const isControlled = openIdsProp !== undefined
  const openIds = openIdsProp ?? innerOpenIds

  const classes = React.useMemo(() => mergeDefined(DEFAULT_CLASSNAMES, classNames), [classNames])
  const toneClasses = React.useMemo(() => mergeDefined(DEFAULT_TONES, tones), [tones])

  if (items.length === 0) return <>{empty ?? null}</>

  // Ouverture / fermeture : uniquement déclenchée par le clic sur l'en-tête d'une fiche.
  const toggle = (item: ClickExpandItem<T>) => {
    const wasOpen = openIds.includes(item.id)
    const next = wasOpen
      ? openIds.filter((id) => id !== item.id)
      : multiple
        ? [...openIds, item.id]
        : [item.id]
    if (!isControlled) setInnerOpenIds(next)
    onOpenChange?.(next, { item, open: !wasOpen })
  }

  const openLabel = labels?.open ?? ((item: ClickExpandItem<T>) => `Déplier ${item.title}`)
  const closeLabel = labels?.close ?? ((item: ClickExpandItem<T>) => `Replier ${item.title}`)

  const settings: ItemSettings = {
    restImageSize,
    openImageSize,
    avatarShape,
    duration,
    scrollIntoView,
    animateEntrance,
    referrerPolicy: imageReferrerPolicy,
  }

  const rootStyle = {
    "--cx-t": `${duration}ms`,
    gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${minItemWidth}px), 1fr))`,
    gap,
  } as React.CSSProperties

  return (
    <ul aria-label={labels?.list} style={rootStyle} className={`m-0 grid list-none items-start p-0 ${className}`}>
      {items.map((item, index) => {
        const isOpen = openIds.includes(item.id)
        return (
          <ExpandItem
            key={item.id}
            item={item}
            index={index}
            isOpen={isOpen}
            onToggle={() => toggle(item)}
            baseId={baseId}
            reduceMotion={reduceMotion}
            settings={settings}
            classes={classes}
            tones={toneClasses}
            toggleTitle={isOpen ? closeLabel(item) : openLabel(item)}
            tagsTitle={labels?.tags}
            renderHeader={renderHeader}
            renderContent={renderContent}
          />
        )
      })}
    </ul>
  )
}

export default ClickExpandGallery

// ═════════════════════════════════════════════════════════════
// GUIDE D'UTILISATION — à suivre tel quel
// ═════════════════════════════════════════════════════════════
//
// PRINCIPE
//   • Au repos : photo + nom + poste (title / subtitle / image).
//   • Au clic sur la fiche : elle s'ouvre et affiche tout le contenu
//     (statut, pastilles, détails, étiquettes, actions, contenu libre).
//   • Re-clic sur la même fiche (ou touche Échap) : elle se referme.
//   • Rien ne s'ouvre au survol : seule l'action de clic ouvre / ferme.
//   • Le composant ne connaît aucun type métier : vous lui donnez des
//     `items` génériques, il gère l'affichage, l'accessibilité et les animations.
//
// 1) IMPORT
//
//    import { ClickExpandGallery } from '../components/ui/click-expand-gallery.component';
//    import type { ClickExpandItem } from '../components/ui/click-expand-gallery.component';
//
// 2) TRANSFORMER VOS DONNÉES EN ITEMS
//
//    const items: ClickExpandItem<Person>[] = people.map((p) => ({
//      id: p.id,                                   // obligatoire, unique
//      title: p.fullName,                          // repos + ouvert
//      subtitle: p.role,                           // repos + ouvert
//      image: p.avatar,                            // photo ; sans image : initiales sur `accent`
//      status: { label: 'En ligne', tone: 'success' },
//      chips: [{ label: 'MVP', tone: 'accent' }],
//      details: [
//        { id: 'site', label: 'Site', value: p.site, icon: <MapPin className="w-3.5 h-3.5" /> },
//        { id: 'mail', label: 'Email', value: p.email, href: `mailto:${p.email}`, icon: <Mail className="w-3.5 h-3.5" /> },
//      ],
//      tags: p.skills,
//      actions: [
//        { id: 'open', label: 'Voir la fiche', variant: 'primary', onClick: () => openPerson(p) },
//      ],
//      data: p,                                    // votre objet, restitué dans les callbacks
//    }));
//
// 3) UTILISATION MINIMALE
//
//    <ClickExpandGallery items={items} />
//
// 4) UTILISATION COMPLÈTE (valeurs par défaut entre parenthèses)
//
//    <ClickExpandGallery
//      items={items}
//      multiple={false}                 // (false) true = plusieurs fiches ouvertes en même temps
//      defaultOpenIds={[]}              // ([]) ids ouverts au départ (mode non contrôlé)
//      minItemWidth={272}               // (272) largeur mini d'une carte en px → nombre de colonnes
//      gap={14}                         // (14) espace entre cartes en px
//      restImageSize={56}               // (56) taille de la photo au repos en px
//      openImageSize={80}               // (80) taille de la photo ouverte en px
//      avatarShape="morph"              // ("morph") "circle" | "rounded" | "morph"
//      duration={520}                   // (520) durée ouverture / fermeture en ms
//      scrollIntoView                   // (true) ramène la fiche ouverte dans la zone visible
//      animateEntrance                  // (true) apparition échelonnée au montage
//      imageReferrerPolicy="no-referrer"
//      labels={{
//        list: 'Collaborateurs',
//        open: (item) => `Déplier ${item.title}`,
//        close: (item) => `Replier ${item.title}`,
//        tags: 'Compétences',
//      }}
//      onOpenChange={(openIds, { item, open }) => {
//        // openIds : liste des ids ouverts après le clic
//        // item.data : votre objet d'origine ; open : true = vient de s'ouvrir
//      }}
//      empty={<p>Aucun résultat</p>}   // affiché si `items` est vide
//      className="pb-8"                 // classes ajoutées à la liste racine
//    />
//
// 5) MODE CONTRÔLÉ (vous décidez de ce qui est ouvert)
//
//    const [openIds, setOpenIds] = useState<ClickExpandId[]>([]);
//    <ClickExpandGallery items={items} openIds={openIds} onOpenChange={(ids) => setOpenIds(ids)} />
//
// 6) PERSONNALISER L'HABILLAGE — `classNames` (chaque clé REMPLACE la classe par défaut)
//
//    <ClickExpandGallery
//      items={items}
//      classNames={{
//        item: 'rounded-xl border border-slate-700 bg-slate-900',
//        itemOpen: 'rounded-xl border border-indigo-400 bg-slate-900',
//        title: 'text-base font-semibold text-white',
//        actionPrimary: 'bg-indigo-500 text-white hover:bg-indigo-400',
//        focus: 'focus-visible:ring-indigo-400/60',
//      }}
//    />
//
//    Clés disponibles : item, itemOpen, header, focus, avatar, title, subtitle,
//    chevron, panel, detailIcon, detailLabel, detailValue, detailLink,
//    tagsTitle, tag, actionPrimary, actionSecondary.
//    Teintes des pastilles : prop `tones` (neutral, accent, success, warning, danger, info),
//    chacune de la forme { dot: 'bg-...', chip: 'border-... bg-... text-...' }.
//
// 7) REMPLACER UNE ZONE ENTIÈRE
//
//    renderHeader={(item, { isOpen }) => (        // remplace le bloc nom + poste
//      <span className="block truncate text-sm text-white">{item.title}</span>
//    )}                                            // ⚠ contenu inline uniquement (<span>) : il est dans un <button>
//
//    renderContent={(item, { isOpen }) => (       // remplace tout le contenu ouvert
//      <MaFicheCustom person={item.data} />
//    )}
//
// 8) RÈGLES À RESPECTER
//    • `id` unique et stable pour chaque item (jamais l'index).
//    • Le composant n'impose aucune hauteur : placez-le dans le parent scrollable de votre page.
//    • Un détail dont `value` est vide est masqué automatiquement.
//    • Les libellés visibles (labels, détails, actions) sont à traduire côté appelant.
//    • Les actions `onClick` / `href` sont dans la zone ouverte : elles ne referment pas la fiche.