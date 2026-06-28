import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/navbar/navbar.component';
import Hero from '../components/hero/hero.component';
import Stats from '../components/stats/stats.component';
import Features from '../components/features/features.component';
import UseCases from '../components/use-cases/use-cases.component';
import Pricing from '../components/pricing/pricing.component';
import Testimonials from '../components/testimonials/testimonials.component';
import Cta from '../components/cta/cta.component';
import Footer from '../components/footer/footer.component';
import styles from './home.scss';

// =============================================================================
//  HOME PAGE — Orchestrateur de la landing page publique EGEN
//
//  Pas de navigation primaire, pas de garde d'auth.
//  Le fond sombre global est appliqué ici : il s'étend derrière tous les
//  composants enfants qui utilisent les CSS vars du thème (via data-theme).
//
//  Sections (dans l'ordre) :
//    1. Navbar sticky (glass)
//    2. Hero (accroche + mockup)
//    3. Stats (chiffres clés)
//    4. Features (grille de 8 fonctionnalités)
//    5. Use Cases (tab switcher par profil)
//    6. Pricing (3 tiers FCFA avec toggle annuel)
//    7. Testimonials (carrousel)
//    8. CTA (appel à l'action final)
//    9. Footer (nav + légal + réseaux)
// =============================================================================

const HomePage: React.FC = () => {
  const { i18n } = useTranslation();

  // Force le mode sombre sur la page d'accueil publique
  // (même philosophie que la page login : fond sombre, glassmorphism)
  useEffect(() => {
    const root = document.documentElement;
    const prev = root.getAttribute('data-theme');
    root.setAttribute('data-theme', 'dark');
    return () => {
      if (prev) {
        root.setAttribute('data-theme', prev);
      } else {
        root.removeAttribute('data-theme');
      }
    };
  }, []);

  // Synchronisation de la langue html
  useEffect(() => {
    document.documentElement.lang = i18n.language ?? 'fr';
  }, [i18n.language]);

  return (
    <div className={styles.page}>
      {/* ── Navigation sticky ── */}
      <Navbar />

      {/* ── Contenu principal ── */}
      <main id="main-content" tabIndex={-1}>
        {/* Skip link pour l'accessibilité */}
        <a href="#main-content" className={styles.skipLink}>
          Aller au contenu principal
        </a>

        {/* 1. Hero */}
        <div className={styles.heroWrapper}>
          <Hero />
        </div>

        {/* 2. Stats */}
        <Stats />

        {/* 3. Fonctionnalités */}
        <Features />

        {/* 4. Cas d'usages */}
        <UseCases />

        {/* 5. Tarifs */}
        <Pricing />

        {/* 6. Témoignages */}
        <Testimonials />

        {/* 7. CTA final */}
        <Cta />
      </main>

      {/* ── Pied de page ── */}
      <Footer />
    </div>
  );
};

export default HomePage;
