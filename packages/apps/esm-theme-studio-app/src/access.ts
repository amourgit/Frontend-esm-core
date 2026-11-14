/** Accès au Studio : aucun privilège requis (vide) = ouvert ; sinon le privilège (ou super-utilisateur) est exigé. */
export function canUseStudio(requiredPrivilege: string, user: unknown, userHasAccess: (p: string, u: never) => boolean): boolean {
  if (!requiredPrivilege) return true;
  if (!user) return false;
  return userHasAccess(requiredPrivilege, user as never);
}
