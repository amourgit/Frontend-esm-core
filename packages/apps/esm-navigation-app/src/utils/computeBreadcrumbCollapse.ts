/**
 * Combien de maillons du fil d'Ariane faut-il replier sous « … » pour qu'il tienne dans la largeur ?
 *
 * Règles :
 *  - le premier maillon (Accueil) et le dernier (page courante) restent TOUJOURS visibles ;
 *  - on replie à partir du maillon qui suit l'Accueil, vers la droite (les ancêtres les plus
 *    proches de la racine d'abord) : le plus utile, la page courante et son parent, reste visible ;
 *  - tant que tout tient, on ne replie rien → pas de « … ».
 *
 * @param widths    largeur naturelle de chaque maillon (px)
 * @param between   largeur de ce qui sépare deux maillons : séparateur + 2 espacements (px)
 * @param ellipsis  largeur du bouton « … » (px)
 * @param available largeur disponible (px) ; 0 ou inconnue → on ne replie rien
 * @returns nombre de maillons repliés, pris à partir de l'indice 1
 */
export function computeBreadcrumbCollapse(
  widths: number[],
  between: number,
  ellipsis: number,
  available: number,
): number {
  const n = widths.length;
  if (n <= 2 || available <= 0) return 0;
  for (let k = 0; k <= n - 2; k++) {
    let used = widths[0];
    if (k > 0) used += between + ellipsis;
    for (let i = k + 1; i < n; i++) used += between + widths[i];
    if (used <= available) return k;
  }
  return n - 2;
}
