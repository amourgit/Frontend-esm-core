const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
const WEEKDAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export interface RelativeDate {
  /** Mois abrégé (« Oct »). */
  month: string;
  /** Jour du mois sur 2 chiffres (« 07 »). */
  day: string;
  /** Jour de la semaine abrégé (« Mer »). */
  weekday: string;
  /** Libellé complet court (« Mer 7 oct »). */
  label: string;
}

/**
 * Date située `offset` jours après `from` (aujourd'hui par défaut ; négatif =
 * passé). Sert aux données d'exemple : les événements « à venir » le restent
 * quel que soit le jour où l'accueil est ouvert.
 */
export function inDays(offset: number, from: Date = new Date()): RelativeDate {
  const date = new Date(from.getFullYear(), from.getMonth(), from.getDate() + offset);
  const month = MONTHS[date.getMonth()];
  const weekday = WEEKDAYS[date.getDay()];
  return {
    month,
    day: String(date.getDate()).padStart(2, '0'),
    weekday,
    label: `${weekday} ${date.getDate()} ${month.toLowerCase()}`,
  };
}
