// Plus de dialogue de connexion : API compatible, sans effet.
export const useAuthStore = () => ({
  isOpen: false,
  mode: 'signin' as 'signin' | 'signup',
  openAuthDialog: (..._args: unknown[]) => undefined,
  closeAuthDialog: () => undefined,
});
