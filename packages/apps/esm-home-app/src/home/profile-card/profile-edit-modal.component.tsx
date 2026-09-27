import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit3, X, Save } from 'lucide-react';
import styles from './profile-card.scss';

export interface UserProfile {
  name: string;
  title: string;
  department: string;
  followers: number;
  following: number;
  verified: boolean;
  avatarUrl: string;
  coverUrl: string;
}

export interface ProfileEditModalProps {
  open: boolean;
  profile: UserProfile;
  onClose: () => void;
  onSave: (profile: UserProfile) => void;
}

export function ProfileEditModal({ open, profile, onClose, onSave }: ProfileEditModalProps) {
  const [form, setForm] = useState(profile);

  // Resynchronise le formulaire à chaque ouverture, sur le profil courant.
  useEffect(() => {
    if (open) setForm(profile);
  }, [open, profile]);

  return (
    <AnimatePresence>
      {open && (
        <div className={styles.editOverlay}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className={styles.editModal}
          >
            <div className={styles.editHeader}>
              <div className={styles.editHeaderLeft}>
                <div className={styles.editHeaderIcon}>
                  <Edit3 />
                </div>
                <div>
                  <h4 className={styles.editHeaderTitle}>Éditer le profil</h4>
                  <p className={styles.editHeaderSubtitle}>Mettre à jour les informations visibles</p>
                </div>
              </div>
              <button type="button" onClick={onClose} className={styles.editCloseBtn} aria-label="Fermer">
                <X />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSave(form);
              }}
              className={styles.editForm}
            >
              <div className={styles.editAvatarRow}>
                <img src={form.avatarUrl} alt={form.name} className={styles.editAvatarPreview} />
                <div className={styles.editFieldGrow}>
                  <label className={styles.editLabel}>URL de la photo</label>
                  <input
                    type="text"
                    value={form.avatarUrl}
                    onChange={(e) => setForm((prev) => ({ ...prev, avatarUrl: e.target.value }))}
                    className={styles.editInputSmall}
                  />
                </div>
              </div>

              <div>
                <label className={styles.editLabel}>Nom complet</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className={styles.editInput}
                />
              </div>

              <div>
                <label className={styles.editLabel}>Profession & Titre</label>
                <textarea
                  rows={3}
                  required
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  className={styles.editTextarea}
                />
              </div>

              <div className={styles.editGrid2}>
                <div>
                  <label className={styles.editLabel}>Followers</label>
                  <input
                    type="number"
                    min={0}
                    value={form.followers}
                    onChange={(e) => setForm((prev) => ({ ...prev, followers: parseInt(e.target.value, 10) || 0 }))}
                    className={styles.editInput}
                  />
                </div>
                <div>
                  <label className={styles.editLabel}>Following</label>
                  <input
                    type="number"
                    min={0}
                    value={form.following}
                    onChange={(e) => setForm((prev) => ({ ...prev, following: parseInt(e.target.value, 10) || 0 }))}
                    className={styles.editInput}
                  />
                </div>
              </div>

              <div className={styles.editActions}>
                <button type="button" onClick={onClose} className={styles.editCancelBtn}>
                  Annuler
                </button>
                <button type="submit" className={styles.editSaveBtn}>
                  <Save className={styles.editSaveIcon} />
                  <span>Enregistrer</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default ProfileEditModal;
