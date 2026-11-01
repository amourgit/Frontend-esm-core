import React, { useState } from 'react';
import { Folder, FileText, Plus, MoreHorizontal, ChevronDown, Upload } from 'lucide-react';
import styles from './documents.scss';

// =============================================================================
//  DOCUMENTS — Liste de documents récents (panneau latéral)
//
//  Copié/adapté depuis Civitas-GED (PortalDocuments.tsx). `items` et les
//  callbacks (`onOpenDocument`, `onSeeAll`...) sont maintenant des props —
//  la version d'origine allait chercher PORTAL_MOCK_DATA.documents en dur et
//  naviguait vers des routes fixes indépendamment du document cliqué.
//  Système de son Xbox ("playXboxSound") non porté, spécifique à GED.
// =============================================================================

export interface DocumentItem {
  id: string;
  name: string;
  type: 'folder' | 'docx' | 'xlsx' | 'pptx' | 'other';
  modifiedDate: string;
}

export interface DocumentsProps {
  items: DocumentItem[];
  onOpenDocument: (doc: DocumentItem) => void;
  onSeeAll?: () => void;
  onCreateFolder?: () => void;
  onUploadFile?: () => void;
  onMoreOptions?: () => void;
}

function DocumentTypeIcon({ type }: { type: DocumentItem['type'] }) {
  switch (type) {
    case 'folder':
      return <Folder className={styles.iconFolder} />;
    case 'docx':
      return <span className={[styles.iconBadge, styles.iconBadgeWord].join(' ')}>W</span>;
    case 'xlsx':
      return <span className={[styles.iconBadge, styles.iconBadgeExcel].join(' ')}>X</span>;
    case 'pptx':
      return <span className={[styles.iconBadge, styles.iconBadgePowerpoint].join(' ')}>P</span>;
    default:
      return <FileText className={styles.iconFile} />;
  }
}

export function Documents({ items, onOpenDocument, onSeeAll, onCreateFolder, onUploadFile, onMoreOptions }: DocumentsProps) {
  const [isNewOpen, setIsNewOpen] = useState(false);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h3 className={styles.heading}>Documents</h3>
        {onSeeAll && (
          <button type="button" onClick={onSeeAll} className={styles.seeAllBtn}>
            Voir tout
          </button>
        )}
      </div>

      <div className={styles.actionBar}>
        <div className={styles.actionBarLeft}>
          <div className={styles.newMenuWrap}>
            <button type="button" onClick={() => setIsNewOpen((prev) => !prev)} className={styles.newBtn}>
              <Plus className={styles.newBtnIconPlus} />
              <span>Nouveau</span>
              <ChevronDown className={styles.newBtnIconChevron} />
            </button>

            {isNewOpen && (
              <div className={styles.newMenu}>
                <button
                  type="button"
                  onClick={() => {
                    setIsNewOpen(false);
                    onCreateFolder?.();
                  }}
                  className={styles.newMenuItem}
                >
                  <Folder className={styles.newMenuIconFolder} />
                  <span>Dossier</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsNewOpen(false);
                    onUploadFile?.();
                  }}
                  className={styles.newMenuItem}
                >
                  <Upload className={styles.newMenuIconUpload} />
                  <span>Téléverser un fichier</span>
                </button>
              </div>
            )}
          </div>

          {onMoreOptions && (
            <button type="button" onClick={onMoreOptions} className={styles.moreBtn}>
              <MoreHorizontal className={styles.moreBtnIcon} />
            </button>
          )}
        </div>
      </div>

      <div className={styles.list}>
        {items.length === 0 && <p className={styles.empty}>Aucun document récent.</p>}
        {items.map((doc) => (
          <div key={doc.id} onClick={() => onOpenDocument(doc)} role="button" tabIndex={0} className={styles.row}>
            <div className={styles.rowLeft}>
              <DocumentTypeIcon type={doc.type} />
              <span className={styles.docName}>{doc.name}</span>
            </div>
            <span className={styles.docDate}>{doc.modifiedDate}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Documents;

/* ============================================================================
 *  GUIDE D'UTILISATION — Documents
 * ============================================================================
 *    <HomeSection as="div" variant="panel" title="Documents" bare>
 *      <Documents
 *        items={documents}
 *        onOpenDocument={(doc) => (doc.type === 'folder' ? navigate(`/ged/${doc.id}`) : openViewer(doc))}
 *        onSeeAll={() => navigate('/ged')}
 *        onCreateFolder={() => navigate('/ged/ingestion')}
 *        onUploadFile={() => navigate('/ged/ingestion')}
 *      />
 *    </HomeSection>
 *
 *  `onSeeAll`/`onCreateFolder`/`onUploadFile`/`onMoreOptions` sont tous
 *  optionnels — le bouton correspondant n'est simplement pas rendu si absent.
 * ==========================================================================*/
