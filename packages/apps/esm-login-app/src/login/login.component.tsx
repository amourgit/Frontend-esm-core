import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import classnames from 'classnames';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, InlineLoading, InlineNotification, PasswordInput, TextInput, Tile } from '@carbon/react';
import {
  ArrowRightIcon,
  getCoreTranslation,
  interpolateUrl,
  refetchCurrentUser,
  navigate as egenNavigate,
  useConfig,
  useConnectivity,
  useSession,
  applyDevAuthBypassForLogin,
  isDevAuthBypassEnabled,
} from '@egen/esm-framework';
import { useTenant, useTenantMode, storeHeaderTenantId, getTenantStoreState } from '@egen/esm-tenant';
import { type ConfigSchema } from '../config-schema';
import Logo from '../logo.component';
import Footer from '../footer.component';
import LoginCarousel, { type CarouselSlide } from './login-carousel.component';
import styles from './login.scss';

export interface LoginReferrer {
  referrer?: string;
}

// ─── Slides par défaut (overridable via config) ───────────────────────────────
const DEFAULT_SLIDES: CarouselSlide[] = [
  {
    accent: 'Plateforme universelle',
    headline: 'Un framework conçu\npour votre domaine.',
    body: "EGEN est une architecture micro-frontend générique et modulaire. Construisez n'importe quelle application professionnelle sur cette base solide.",
  },
  {
    accent: 'Extensibilité totale',
    headline: 'Branchez vos modules\noù vous le souhaitez.',
    body: "Le système d'extensions permet à chaque module d'enrichir l'interface sans que les équipes se marchent dessus. Collaboration sans friction.",
  },
  {
    accent: 'Configuration runtime',
    headline: 'Personnalisez sans\nrecompiler.',
    body: "Thèmes, workflows, permissions, URLs d'API — tout se configure via un simple fichier JSON. Zéro modification de code pour adapter l'interface.",
  },
  {
    accent: 'Architecture CIVITAS',
    headline: "L'intelligence artificielle\nau service de l'Afrique.",
    body: 'CIVITAS intègre des agents IA dans un framework frontend robuste pour répondre aux besoins numériques du Gabon et du continent africain.',
  },
];

const Login: React.FC = () => {
  const {
    announcements = [],
    background = { image: '', color: '' },
    showPasswordOnSeparateScreen,
    provider: loginProvider,
    links: loginLinks,
    carousel: carouselConfig = { intervalMs: 5500, slides: [] },
  } = useConfig<ConfigSchema>();

  // Utiliser les slides de la config si disponibles, sinon les slides par défaut
  const carouselSlides = carouselConfig.slides?.length > 0 ? carouselConfig.slides : DEFAULT_SLIDES;
  const carouselInterval = carouselConfig.intervalMs ?? 5500;
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
  const effectiveTenantSlug = isMultiTenant ? activeTenant?.id ?? tenantFromQuery ?? null : null;

  const [errorMessage, setErrorMessage] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPasswordField, setShowPasswordField] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const usernameInputRef = useRef<HTMLInputElement>(null);

  // Marquer la route comme publique dès le montage (supprime le gap topNav)
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-public-route', 'true');
    root.setAttribute('data-theme', 'dark');
    return () => {
      root.removeAttribute('data-public-route');
      root.removeAttribute('data-theme');
    };
  }, []);

  useEffect(() => {
    // En mode bypass dev (EGEN_DEV_NO_AUTH=true), l'utilisateur est déjà
    // authentifié via la session fictive injectée par run.ts.
    // On redirige directement vers l'accueil sans afficher le formulaire.
    if (user && isDevAuthBypassEnabled()) {
      const to = loginLinks?.loginSuccess || '${egenSpaBase}/home';
      egenNavigate({ to });
      return;
    }

    if (!user) {
      if (loginProvider.type === 'oauth2' || loginProvider.type === 'custom') {
        egenNavigate({ to: loginProvider.loginUrl });
      } else if (!username && location.pathname === '/login/confirm') {
        navigate('/login');
      }
    }
  }, [username, navigate, location, user, loginProvider, loginLinks]);

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

  const containerClassName = classnames(styles.container, {
    [styles.containerWithImage]: !!background.image,
    [styles.containerWithColor]: !background.image && !!background.color,
  });

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

        // ── Bypass d'authentification pour développement ───────────────────────
        // Si EGEN_DEV_NO_AUTH=true, on skippe l'appel réseau et utilise une session fictive
        const bypassSession = applyDevAuthBypassForLogin();
        let sessionStore;

        if (bypassSession) {
          sessionStore = bypassSession;
        } else {
          sessionStore = await refetchCurrentUser(currentUsername, currentPassword);
        }

        const session = sessionStore.session;
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
          //
          // COMMENTÉ — ancienne logique Egen :
          // if (session.sessionLocation) { ... } else { navigate('/login/location'); }
          {
            let to = loginLinks?.loginSuccess || '/home';
            if (location?.state?.referrer) {
              if (location.state.referrer.startsWith('/')) {
                to = `\${egenSpaBase}${location.state.referrer}`;
              } else {
                to = location.state.referrer;
              }
            }
            egenNavigate({ to });
          }
        } else {
          setErrorMessage(t('invalidCredentials', 'Invalid username or password'));
          setUsername('');
          setPassword('');
          if (showPasswordOnSeparateScreen) setShowPasswordField(false);
        }

        return true;
      } catch (error: unknown) {
        if (error instanceof Error) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage(t('invalidCredentials', 'Invalid username or password'));
        }
        setUsername('');
        setPassword('');
        if (showPasswordOnSeparateScreen) setShowPasswordField(false);
      } finally {
        setIsLoggingIn(false);
      }
    },
    [
      username,
      password,
      navigate,
      showPasswordOnSeparateScreen,
      showPasswordField,
      loginLinks,
      location,
      t,
      continueLogin,
    ],
  );

  if (!loginProvider || loginProvider.type === 'basic') {
    return (
      <div className={containerClassName} style={containerStyle} data-testid="login-container">
        {/* ── Layout deux colonnes ── */}
        <div className={styles.inner}>
          {/* ── Panneau gauche : carrousel ── */}
          <LoginCarousel slides={carouselSlides} intervalMs={carouselInterval} />

          {/* ── Panneau droit : formulaire ── */}
          <div style={{ position: 'relative' }}>
            {announcements.length > 0 && (
              <div className={styles.announcements}>
                {announcements.map((announcement, i) => (
                  <InlineNotification
                    key={i}
                    kind={announcement.kind}
                    title={announcement.title ? t(announcement.title) : ''}
                    subtitle={t(announcement.text)}
                    lowContrast
                    hideCloseButton
                  />
                ))}
              </div>
            )}

            <Tile className={styles.loginCard}>
              {errorMessage && (
                <div className={styles.errorMessage}>
                  <InlineNotification
                    kind="error"
                    subtitle={t(errorMessage)}
                    title={getCoreTranslation('error')}
                    onClick={() => setErrorMessage('')}
                  />
                </div>
              )}

              <div className={styles.center}>
                <Logo t={t} />
              </div>

              {/* Badge tenant — affiché uniquement en mode multi-tenant si un tenant est résolu */}
              {isMultiTenant && effectiveTenantSlug && (
                <div className={styles.tenantBadgeWrapper}>
                  <span className={styles.tenantBadge}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
                      <circle cx="6" cy="6" r="4" />
                    </svg>
                    {activeTenant?.name ?? effectiveTenantSlug}
                  </span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className={styles.inputGroup}>
                  <TextInput
                    id="username"
                    type="text"
                    name="username"
                    autoComplete="username"
                    labelText={t('username', 'Username')}
                    value={username}
                    onChange={changeUsername}
                    ref={usernameInputRef}
                    required
                    autoFocus
                  />
                  {showPasswordOnSeparateScreen ? (
                    <>
                      <div className={showPasswordField ? undefined : styles.hiddenPasswordField}>
                        <PasswordInput
                          id="password"
                          labelText={t('password', 'Password')}
                          name="password"
                          autoComplete="current-password"
                          onChange={changePassword}
                          ref={passwordInputRef}
                          required
                          value={password}
                          showPasswordLabel={t('showPassword', 'Show password')}
                          invalidText={t('validValueRequired', 'A valid value is required')}
                          aria-hidden={!showPasswordField}
                          tabIndex={showPasswordField ? 0 : -1}
                        />
                      </div>
                      {showPasswordField ? (
                        <Button
                          type="submit"
                          className={styles.continueButton}
                          renderIcon={(props) => <ArrowRightIcon size={24} {...props} />}
                          iconDescription={t('loginButtonIconDescription', 'Log in button')}
                          disabled={!isLoginEnabled || isLoggingIn}
                        >
                          {isLoggingIn ? (
                            <InlineLoading
                              className={styles.loader}
                              description={t('loggingIn', 'Logging in') + '...'}
                            />
                          ) : (
                            t('login', 'Log in')
                          )}
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          className={styles.continueButton}
                          renderIcon={(props) => <ArrowRightIcon size={24} {...props} />}
                          iconDescription={t('continueToPassword', 'Continue to password')}
                          onClick={(evt) => {
                            evt.preventDefault();
                            continueLogin();
                          }}
                          disabled={!isLoginEnabled}
                        >
                          {t('continue', 'Continue')}
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <PasswordInput
                        id="password"
                        labelText={t('password', 'Password')}
                        name="password"
                        autoComplete="current-password"
                        onChange={changePassword}
                        ref={passwordInputRef}
                        required
                        value={password}
                        showPasswordLabel={t('showPassword', 'Show password')}
                        invalidText={t('validValueRequired', 'A valid value is required')}
                      />
                      <Button
                        type="submit"
                        className={styles.continueButton}
                        renderIcon={(props) => <ArrowRightIcon size={24} {...props} />}
                        iconDescription={t('loginButtonIconDescription', 'Log in button')}
                        disabled={!isLoginEnabled || isLoggingIn}
                      >
                        {isLoggingIn ? (
                          <InlineLoading className={styles.loader} description={t('loggingIn', 'Logging in') + '...'} />
                        ) : (
                          t('login', 'Log in')
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </form>
            </Tile>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  return null;
};

export default Login;
