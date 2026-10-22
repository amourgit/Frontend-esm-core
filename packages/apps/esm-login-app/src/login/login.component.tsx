import '../tailwind.tw.css';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader, Lock, User } from 'lucide-react';
import {
  applyDevAuthBypassForLogin,
  interpolateUrl,
  navigate as egenNavigate,
  refetchCurrentUser,
  useConfig,
  useConnectivity,
  useSession,
} from '@egen-civitas/esm-framework';
import { getTenantStoreState, storeHeaderTenantId, useTenant, useTenantMode } from '@egen-civitas/esm-tenant';
import { getThemeState } from '@egen-civitas/esm-theme';
import { type ConfigSchema } from '../config-schema';
import { cn } from '../utils/cn';
import { BlurFade } from './ui/blur-fade.component';
import { Confetti, type ConfettiRef } from './ui/confetti.component';
import { GlassButton } from './ui/glass-button.component';
import { GradientBackground } from './ui/gradient-background.component';
import { LoginAnnouncements } from './login-announcements.component';
import { LoginFooter } from './login-footer.component';
import { LoginLogo } from './login-logo.component';
import { LoginStatusModal, type LoginModalStatus } from './login-status-modal.component';

export interface LoginReferrer {
  referrer?: string;
}

/** Délai (ms) d'affichage du succès (confettis) avant la redirection. */
const SUCCESS_REDIRECT_DELAY_MS = 900;

const titleClassName = 'font-serif text-4xl font-light tracking-tight text-balance text-foreground sm:text-5xl';
const floatingLabelClassName = 'absolute -top-6 left-4 z-10 text-xs font-semibold text-muted-foreground';
const inputClassName =
  'relative z-10 h-full w-0 flex-grow bg-transparent text-foreground placeholder:text-foreground/60 focus:outline-none';

const Login: React.FC = () => {
  const {
    announcements = [],
    background = { image: '', color: '' },
    showPasswordOnSeparateScreen,
    provider: loginProvider,
    links: loginLinks,
  } = useConfig<ConfigSchema>();

  const isLoginEnabled = useConnectivity();
  const { t } = useTranslation();
  const { user } = useSession();
  const location = useLocation() as unknown as Omit<Location, 'state'> & {
    state: LoginReferrer;
  };
  const navigate = useNavigate();

  // ── Contexte multi-tenant ─────────────────────────────────────────────────
  // En mode multi-tenant, on récupère le tenant résolu depuis l'URL (sous-domaine
  // ou query param ?tenant= injecté par l'app de routage) pour l'inclure dans
  // la requête d'authentification et l'en-tête X-Tenant-ID.
  const tenantMode = useTenantMode();
  const activeTenant = useTenant();
  const isMultiTenant = tenantMode === 'multi';

  // Lire le tenant depuis le query param (fallback quand pas de sous-domaine en dev)
  const tenantFromQuery = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('tenant') ?? params.get('tenantId') ?? null;
  }, [location.search]);

  // Tenant effectif : activeTenant (résolu par sous-domaine) > query param
  const effectiveTenantSlug = isMultiTenant ? activeTenant ?? tenantFromQuery ?? null : null;

  const [errorMessage, setErrorMessage] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [modalStatus, setModalStatus] = useState<LoginModalStatus>('closed');
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const usernameInputRef = useRef<HTMLInputElement>(null);
  const confettiRef = useRef<ConfettiRef>(null);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const twoStep = !!showPasswordOnSeparateScreen;
  const passwordRevealed = !twoStep || showPasswordField;
  const hasUsername = username.trim().length > 0;
  const hasPassword = password.length > 0;

  // Marquer la route comme publique dès le montage (supprime le gap topNav).
  // La page de login force le mode sombre pour son propre branding, quel
  // que soit le mode choisi par l'utilisateur ailleurs dans l'app.
  //
  // Au démontage, on NE DOIT PAS simplement retirer l'attribut `data-theme` :
  // `<html>` resterait sans mode après la navigation login → home (UI
  // « claire/transparente » jusqu'à un rafraîchissement manuel). On restaure
  // le mode RÉEL résolu par le moteur de thème (source de vérité unique).
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-public-route', 'true');
    root.setAttribute('data-theme', 'dark');
    return () => {
      root.removeAttribute('data-public-route');
      root.setAttribute('data-theme', getThemeState()?.mode ?? 'dark');
    };
  }, []);

  useEffect(() => () => clearTimeout(redirectTimerRef.current), []);

  useEffect(() => {
    if (!user) {
      if (loginProvider.type === 'oauth2' || loginProvider.type === 'custom') {
        egenNavigate({ to: loginProvider.loginUrl });
      } else if (!username && location.pathname === '/login/confirm') {
        navigate('/login');
      }
    }
  }, [username, navigate, location, user, loginProvider]);

  useEffect(() => {
    if (showPasswordOnSeparateScreen) {
      if (showPasswordField) {
        if (!passwordInputRef.current?.value) {
          passwordInputRef.current?.focus();
        }
      } else {
        usernameInputRef.current?.focus();
      }
    }
  }, [showPasswordField, showPasswordOnSeparateScreen]);

  // Succès : confettis depuis les deux coins du bas.
  useEffect(() => {
    if (modalStatus !== 'success') {
      return;
    }
    const fire = confettiRef.current?.fire;
    if (fire) {
      // Purement décoratif : un canvas indisponible ne doit jamais bloquer la connexion.
      try {
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };
        fire({ ...defaults, particleCount: 50, origin: { x: 0, y: 1 }, angle: 60 });
        fire({ ...defaults, particleCount: 50, origin: { x: 1, y: 1 }, angle: 120 });
      } catch (error) {
        console.warn('Confetti unavailable', error);
      }
    }
  }, [modalStatus]);

  const continueLogin = useCallback(() => {
    const currentUsername = usernameInputRef.current?.value?.trim();
    if (currentUsername) {
      setUsername(currentUsername);
      setShowPasswordField(true);
    } else {
      usernameInputRef.current?.focus();
    }
  }, []);

  const changeUsername = useCallback((evt: React.ChangeEvent<HTMLInputElement>) => setUsername(evt.target.value), []);
  const changePassword = useCallback((evt: React.ChangeEvent<HTMLInputElement>) => setPassword(evt.target.value), []);

  const handleGoBack = useCallback(() => {
    setShowPasswordField(false);
    setPassword('');
    setShowPasswordText(false);
  }, []);

  const closeModal = useCallback(() => {
    setModalStatus('closed');
    setErrorMessage('');
    requestAnimationFrame(() => usernameInputRef.current?.focus());
  }, []);

  const failLogin = useCallback(
    (message: string) => {
      setErrorMessage(message);
      setUsername('');
      setPassword('');
      if (showPasswordOnSeparateScreen) {
        setShowPasswordField(false);
      }
      setModalStatus('error');
    },
    [showPasswordOnSeparateScreen],
  );

  const backgroundKind = background.image ? 'image' : background.color ? 'color' : 'default';

  const containerStyle = useMemo<React.CSSProperties | undefined>(() => {
    if (background.image) {
      return { '--login-bg-image': `url(${interpolateUrl(background.image)})` } as React.CSSProperties;
    }
    if (background.color) {
      return { '--login-bg-color': background.color } as React.CSSProperties;
    }
    return undefined;
  }, [background]);

  const handleSubmit = useCallback(
    async (evt: React.FormEvent<HTMLFormElement>) => {
      evt.preventDefault();
      evt.stopPropagation();

      const currentUsername = usernameInputRef.current?.value?.trim() || username;
      const currentPassword = passwordInputRef.current?.value || password;

      if (showPasswordOnSeparateScreen && !showPasswordField) {
        continueLogin();
        return false;
      }

      if (!currentPassword || !currentPassword.trim()) {
        passwordInputRef.current?.focus();
        return false;
      }

      try {
        setIsLoggingIn(true);
        setModalStatus('loading');

        // ── Bypass d'authentification pour développement ───────────────────────
        // Si EGEN_DEV_NO_AUTH=true, on skippe l'appel réseau et utilise une session fictive
        const bypassSession = applyDevAuthBypassForLogin();
        let sessionStore;

        if (bypassSession) {
          sessionStore = bypassSession;
        } else {
          sessionStore = await refetchCurrentUser(currentUsername, currentPassword);
        }

        const authenticated = sessionStore?.session?.authenticated;

        if (authenticated) {
          // ── Persistance du tenant après login (mode multi-tenant) ──────────────
          // Persiste le tenant actif en localStorage pour que les prochains
          // rechargements le retrouvent via la stratégie 'header'.
          if (isMultiTenant && effectiveTenantSlug) {
            storeHeaderTenantId(effectiveTenantSlug, getTenantStoreState().config.storageKey ?? 'egen:tenant:active');
          }

          // TODO(EGEN): La condition sur sessionLocation était liée à Egen.
          // Dans EGEN, on navigue directement vers la route de succès.
          let to = loginLinks?.loginSuccess || '${egenSpaBase}/';
          if (location?.state?.referrer) {
            if (location.state.referrer.startsWith('/')) {
              to = `\${egenSpaBase}${location.state.referrer}`;
            } else {
              to = location.state.referrer;
            }
          }

          setModalStatus('success');
          redirectTimerRef.current = setTimeout(() => egenNavigate({ to }), SUCCESS_REDIRECT_DELAY_MS);
        } else {
          failLogin(t('invalidCredentials', 'Invalid username or password'));
        }

        return true;
      } catch (error: unknown) {
        failLogin(error instanceof Error ? error.message : t('invalidCredentials', 'Invalid username or password'));
      } finally {
        setIsLoggingIn(false);
      }
    },
    [
      username,
      password,
      showPasswordOnSeparateScreen,
      showPasswordField,
      loginLinks,
      location,
      t,
      continueLogin,
      failLogin,
      isMultiTenant,
      effectiveTenantSlug,
    ],
  );

  if (loginProvider && loginProvider.type !== 'basic') {
    return null;
  }

  const stepKey = twoStep ? (showPasswordField ? 'password' : 'username') : 'single';

  return (
    <div
      className="login-root flex min-h-screen w-screen flex-col bg-background"
      style={containerStyle}
      data-testid="login-container"
      data-background={backgroundKind}
    >
      <Confetti
        ref={confettiRef}
        manualstart
        className="pointer-events-none fixed left-0 top-0 z-[999] h-full w-full"
      />
      <LoginStatusModal
        status={modalStatus}
        errorMessage={t(errorMessage, { defaultValue: errorMessage })}
        onClose={closeModal}
      />

      <div className="fixed left-4 top-4 z-20 flex items-center gap-2 md:left-1/2 md:-translate-x-1/2">
        <LoginLogo t={t} />
      </div>

      <main className="relative flex w-full flex-1 items-center justify-center overflow-hidden bg-card">
        {/* ── Fond : image / couleur configurée, sinon dégradé animé ── */}
        <div className="absolute inset-0 z-0">
          {backgroundKind === 'image' && (
            <>
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: 'var(--login-bg-image)' }}
              />
              <div className="absolute inset-0 bg-black/40" />
            </>
          )}
          {backgroundKind === 'color' && (
            <div className="absolute inset-0" style={{ backgroundColor: 'var(--login-bg-color)' }} />
          )}
          {backgroundKind === 'default' && <GradientBackground />}
        </div>

        <LoginAnnouncements announcements={announcements} />

        <fieldset
          disabled={modalStatus !== 'closed'}
          className="relative z-10 mx-auto flex w-full max-w-[340px] flex-col items-center gap-8 p-4"
        >
          {/* ── Titres ── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={stepKey}
              initial={{ y: 6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flex w-full flex-col items-center gap-4 text-center"
            >
              <BlurFade delay={0} className="w-full">
                <h2 className={titleClassName}>
                  {stepKey === 'password'
                    ? t('loginPasswordTitle', 'Enter your password')
                    : t('loginWelcomeTitle', 'Welcome back')}
                </h2>
              </BlurFade>
              <BlurFade delay={0.25}>
                <p className="text-sm font-medium text-muted-foreground">
                  {stepKey === 'password'
                    ? t('loginPasswordPrompt', 'Signing in as {{username}}', { username })
                    : stepKey === 'username'
                      ? t('loginUsernamePrompt', 'Enter your username to continue')
                      : t('loginSinglePrompt', 'Sign in to your account')}
                </p>
              </BlurFade>

              {/* Badge tenant — uniquement en mode multi-tenant si un tenant est résolu */}
              {isMultiTenant && effectiveTenantSlug && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-semibold text-foreground/80 backdrop-blur-md">
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
                    <circle cx="6" cy="6" r="4" />
                  </svg>
                  {effectiveTenantSlug}
                </span>
              )}
            </motion.div>
          </AnimatePresence>

          {/* ── Formulaire ── */}
          <form onSubmit={handleSubmit} className="w-full max-w-[300px] space-y-6">
            {/* Identifiant */}
            <BlurFade delay={0.5} className="w-full">
              <div className="relative w-full">
                {hasUsername && passwordRevealed && (
                  <span aria-hidden="true" className={floatingLabelClassName}>
                    {t('username', 'Username')}
                  </span>
                )}
                <div className="glass-input-wrap w-full">
                  <div className="glass-input">
                    <span className="glass-input-text-area" />
                    <div
                      className={cn(
                        'relative z-10 flex flex-shrink-0 items-center justify-center overflow-hidden transition-all duration-300 ease-in-out',
                        username.length > 20 && !showPasswordField ? 'w-0 px-0' : 'w-10 pl-2',
                      )}
                    >
                      <User className="h-5 w-5 flex-shrink-0 text-foreground/80" />
                    </div>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      aria-label={t('username', 'Username')}
                      placeholder={t('username', 'Username')}
                      value={username}
                      onChange={changeUsername}
                      ref={usernameInputRef}
                      autoFocus
                      className={inputClassName}
                    />
                    {twoStep && !showPasswordField && (
                      <div
                        className={cn(
                          'relative z-10 flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out',
                          hasUsername ? 'w-10 pr-1' : 'w-0',
                        )}
                      >
                        <GlassButton
                          type="button"
                          onClick={continueLogin}
                          size="icon"
                          disabled={!isLoginEnabled}
                          tabIndex={hasUsername ? 0 : -1}
                          aria-label={t('continue', 'Continue')}
                          contentClassName="text-foreground/80 hover:text-foreground"
                        >
                          <ArrowRight className="h-5 w-5" />
                        </GlassButton>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </BlurFade>

            {/* Mot de passe — toujours présent dans le DOM (autofill), masqué tant que l'étape n'est pas atteinte */}
            <div
              className={cn(
                'w-full transition-all duration-300 ease-in-out',
                passwordRevealed ? 'max-h-24 opacity-100' : 'pointer-events-none max-h-0 overflow-hidden opacity-0',
              )}
            >
              <div className="relative w-full">
                {hasPassword && (
                  <span aria-hidden="true" className={floatingLabelClassName}>
                    {t('password', 'Password')}
                  </span>
                )}
                <div className="glass-input-wrap w-full">
                  <div className="glass-input">
                    <span className="glass-input-text-area" />
                    <div className="relative z-10 flex w-10 flex-shrink-0 items-center justify-center pl-2">
                      {hasPassword ? (
                        <button
                          type="button"
                          aria-label={t('showPassword', 'Show password')}
                          onClick={() => setShowPasswordText((v) => !v)}
                          className="rounded-full p-2 text-foreground/80 transition-colors hover:text-foreground"
                        >
                          {showPasswordText ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      ) : (
                        <Lock className="h-5 w-5 flex-shrink-0 text-foreground/80" />
                      )}
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPasswordText ? 'text' : 'password'}
                      autoComplete="current-password"
                      aria-label={t('password', 'Password')}
                      placeholder={t('password', 'Password')}
                      value={password}
                      onChange={changePassword}
                      ref={passwordInputRef}
                      aria-hidden={!passwordRevealed}
                      tabIndex={passwordRevealed ? 0 : -1}
                      className={inputClassName}
                    />
                    {passwordRevealed && (
                      <div
                        className={cn(
                          'relative z-10 flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out',
                          hasPassword ? 'w-10 pr-1' : 'w-0',
                        )}
                      >
                        <GlassButton
                          type="submit"
                          size="icon"
                          disabled={!isLoginEnabled || isLoggingIn}
                          tabIndex={hasPassword ? 0 : -1}
                          aria-label={t('login', 'Log in')}
                          contentClassName="text-foreground/80 hover:text-foreground"
                        >
                          {isLoggingIn ? (
                            <Loader className="h-5 w-5 animate-spin" />
                          ) : (
                            <ArrowRight className="h-5 w-5" />
                          )}
                        </GlassButton>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {twoStep && showPasswordField && (
              <BlurFade inView delay={0.2}>
                <button
                  type="button"
                  onClick={handleGoBack}
                  className="flex items-center gap-2 text-sm text-foreground/70 transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" /> {t('goBack', 'Go back')}
                </button>
              </BlurFade>
            )}
          </form>
        </fieldset>
      </main>

      <LoginFooter />
    </div>
  );
};

export default Login;
