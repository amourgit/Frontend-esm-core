import React, { useState } from 'react';
import { Users, UserCheck, Check } from 'lucide-react';
import { ProfileEditModal, type UserProfile } from './profile-edit-modal.component';
import styles from './profile-card.scss';

export type { UserProfile };

// =============================================================================
//  PROFILE CARD — Carte de profil utilisateur, éditable
//
//  Copié/adapté depuis Civitas-GED (SophieProfileCard.tsx). BUG CORRIGÉ AU
//  PASSAGE : la version d'origine avait le profil d'UNE personne précise
//  (nom, poste, email, photos) codé EN DUR dans un `useState` interne,
//  impossible à réutiliser pour qui que ce soit d'autre. `profile` est
//  maintenant une prop obligatoire.
//
//  L'édition reste gérée en interne (état local, resynchronisé si `profile`
//  change) : `onProfileChange` est optionnel, pour persister la modification
//  côté appelant (API, config...) si besoin.
// =============================================================================

export interface ProfileCardProps {
  profile: UserProfile;
  onProfileChange?: (profile: UserProfile) => void;
  onShowToast?: (msg: string, type: 'info' | 'success' | 'warning') => void;
  className?: string;
}

export function ProfileCard({ profile: initialProfile, onProfileChange, onShowToast, className }: ProfileCardProps) {
  const [profile, setProfile] = useState(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleSave = (updated: UserProfile) => {
    setProfile(updated);
    setImageError(false);
    setIsEditing(false);
    onProfileChange?.(updated);
    onShowToast?.('Profil mis à jour avec succès.', 'success');
  };

  const handleStatClick = (type: 'followers' | 'following') => {
    onShowToast?.(
      type === 'followers'
        ? `${profile.followers} abonnés suivent l'activité de ${profile.name}`
        : `${profile.name} suit ${profile.following} collaborateurs`,
      'info',
    );
  };

  return (
    <>
      <div className={[styles.card, className ?? ''].join(' ')}>
        <div className={styles.coverWrap}>
          <div className={styles.cover}>
            <img src={profile.coverUrl} alt="Photo de couverture" className={styles.coverImage} />
            <div className={styles.coverGradient} />
          </div>

          <div className={styles.avatarRow}>
            <div className={styles.avatarFrame}>
              {imageError ? (
                <span className={styles.avatarFallback} aria-hidden>
                  {profile.name
                    .split(' ')
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join('')}
                </span>
              ) : (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  onError={() => setImageError(true)}
                  referrerPolicy="no-referrer"
                  className={styles.avatarImage}
                />
              )}
            </div>

            {profile.verified && (
              <span title="Profil vérifié" className={styles.verifiedBadge}>
                <Check className={styles.verifiedIcon} />
                <span>Vérifié</span>
              </span>
            )}
          </div>
        </div>

        <div className={styles.info}>
          <h3 className={styles.name}>{profile.name}</h3>
          <p className={styles.title}>{profile.title}</p>
          <p className={styles.department}>{profile.department}</p>

          <div className={styles.stats}>
            <button type="button" onClick={() => handleStatClick('followers')} className={styles.statBtn}>
              <Users className={styles.statIcon} />
              <span className={styles.statValue}>{profile.followers}</span>
              <span className={styles.statLabel}>followers</span>
            </button>
            <button type="button" onClick={() => handleStatClick('following')} className={styles.statBtn}>
              <UserCheck className={styles.statIcon} />
              <span className={styles.statValue}>{profile.following}</span>
              <span className={styles.statLabel}>following</span>
            </button>
          </div>

          <button type="button" onClick={() => setIsEditing(true)} className={styles.editBtn}>
            Éditer
          </button>
        </div>
      </div>

      <ProfileEditModal open={isEditing} profile={profile} onClose={() => setIsEditing(false)} onSave={handleSave} />
    </>
  );
}

export default ProfileCard;

/* ============================================================================
 *  GUIDE D'UTILISATION — ProfileCard
 * ============================================================================
 *    <ProfileCard
 *      profile={{
 *        name: 'Amour Samuel NZILA NGALA',
 *        title: 'Directeur Général de CIVITAS Gabon',
 *        department: 'Direction Générale • CIVITAS Gabon',
 *        followers: 312,
 *        following: 48,
 *        verified: true,
 *        avatarUrl: '/assets/moi-assis.jpg',
 *        coverUrl: '/assets/moi-reunion.png',
 *      }}
 *      onProfileChange={(p) => saveProfileToApi(p)}
 *      onShowToast={showToast}
 *    />
 *
 *  `onProfileChange` est optionnel : sans lui, la modification reste locale
 *  à la session (perdue au rechargement) — branchez-le pour la persister.
 * ==========================================================================*/
