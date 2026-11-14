// Pas d'authentification dans le Studio : l'identité est gérée par le shell EGEN.
const LOCAL_SESSION = { user: { id: 'egen-local-user', name: 'EGEN', email: '' }, session: { id: 'local' } };

export const authClient = {
  useSession: () => ({ data: LOCAL_SESSION, isPending: false, error: null }),
  signOut: async () => undefined,
};
