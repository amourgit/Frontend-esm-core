/** @category MediaPlayer */
import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { AddIcon, EditIcon, OverflowMenuHorizontalIcon } from '../../icons';
import { MusicNoteIcon } from './music-note.icon';
import { GradientBlur } from './gradient-blur.component';
import type { MediaPlayerProps, MediaPlayerTrack } from './media-player.types';
import styles from './media-player.module.scss';

/**
 * `MediaPlayer` — vue "album" façon Apple Music : pochette + infos + liste de
 * morceaux, avec deux panneaux superposés :
 * - un panneau de DÉTAIL DE MORCEAU (`track.detail`), qui s'ouvre en glissant
 *   depuis la ligne du morceau cliqué (position calculée dynamiquement) ;
 * - un panneau ARTISTE (`author`), qui bascule en overlay avec fond assombri.
 *
 * Aucune donnée n'est en dur : `title`, `coverImageUrl`, `tracks`, `author`
 * (bio, photo, stats) viennent tous des props. Un morceau n'ouvre un détail
 * que si `track.detail` est fourni.
 *
 * @example
 * ```tsx
 * <MediaPlayer
 *   title="Cowboy Carter"
 *   coverImageUrl={cover}
 *   genre="Country"
 *   trackCountLabel="27 songs"
 *   year={2024}
 *   tracks={tracks}
 *   author={{ name: 'Beyoncé', photoUrl: photo, genre: 'Pop', bio: '...' }}
 * />
 * ```
 */
export const MediaPlayer: React.FC<MediaPlayerProps> = ({
  title,
  coverImageUrl,
  genre,
  trackCountLabel,
  year,
  tracks,
  author,
  onTrackOptionsClick,
  className,
  style,
}) => {
  const [isArtistModalActive, setIsArtistModalActive] = useState(false);
  const [activeTrackId, setActiveTrackId] = useState<MediaPlayerTrack['id'] | null>(null);
  const [trackModalTop, setTrackModalTop] = useState(0);
  const [trackModalTransform, setTrackModalTransform] = useState('translateY(0px)');

  const contentRef = useRef<HTMLDivElement>(null);
  const trackRowRefs = useRef(new Map<MediaPlayerTrack['id'], HTMLDivElement>());

  const isSongModalActive = activeTrackId !== null;
  const anyModalActive = isArtistModalActive || isSongModalActive;
  const activeTrack = tracks.find((t) => t.id === activeTrackId) ?? null;

  const setTrackRowRef = (id: MediaPlayerTrack['id']) => (el: HTMLDivElement | null) => {
    if (el) {
      trackRowRefs.current.set(id, el);
    } else {
      trackRowRefs.current.delete(id);
    }
  };

  useEffect(() => {
    if (activeTrackId === null) {
      return;
    }
    const updatePosition = () => {
      const row = trackRowRefs.current.get(activeTrackId);
      if (row && contentRef.current) {
        const top = row.getBoundingClientRect().top - contentRef.current.offsetTop - 2;
        setTrackModalTop(top);
      }
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [activeTrackId]);

  const handleArtistToggle = () => setIsArtistModalActive((prev) => !prev);

  const handleTrackOpen = (track: MediaPlayerTrack) => {
    if (!track.detail) {
      return;
    }
    const row = trackRowRefs.current.get(track.id);
    if (row && contentRef.current) {
      const distanceY = window.innerHeight - row.getBoundingClientRect().bottom + contentRef.current.offsetTop - 390;
      setTrackModalTransform(`translateY(${distanceY}px)`);
    }
    setActiveTrackId(track.id);
  };

  const handleTrackClose = () => {
    setTrackModalTransform('translateY(0px)');
    setActiveTrackId(null);
  };

  return (
    <div className={classNames(styles.root, className)} style={style}>
      <div className={styles.contentWrapper}>
        <div ref={contentRef} className={classNames(styles.content, { [styles['content--active']]: anyModalActive })}>
          <div className={styles.mainContent}>
            <div className={styles.photoWrapper}>
              <img className={styles.photo} src={coverImageUrl} alt="" />
              <img className={classNames(styles.photo, styles.photoBlur)} src={coverImageUrl} alt="" aria-hidden="true" />
            </div>

            <div className={styles.mainInfo}>
              <div className={styles.titleContainer}>
                <h1 className={styles.title}>{title}</h1>
                <div className={styles.titleInfo}>
                  {genre && <p className={styles.light}>{genre}</p>}
                  {genre && trackCountLabel && <div className={styles.divider} />}
                  {trackCountLabel && <p className={styles.light}>{trackCountLabel}</p>}
                  {trackCountLabel && year && <div className={styles.divider} />}
                  {year && <p className={styles.light}>{year}</p>}
                </div>
              </div>

              <div className={styles.songs}>
                {tracks.map((track) => (
                  <div
                    key={track.id}
                    ref={setTrackRowRef(track.id)}
                    className={styles.song}
                    onClick={() => handleTrackOpen(track)}
                  >
                    <p className={styles.bold}>{track.title}</p>
                    <div className={styles.end}>
                      <button
                        type="button"
                        className={styles.iconButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTrackOptionsClick?.(track);
                        }}
                        aria-label="Options"
                      >
                        <OverflowMenuHorizontalIcon size={20} />
                      </button>
                      <p className={styles.light}>{track.duration}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Panneau de détail du morceau ── */}
          {activeTrack && (
            <div
              className={classNames(styles.songModal, { [styles['songModal--active']]: isSongModalActive })}
              style={{ top: `${trackModalTop}px`, transform: trackModalTransform }}
            >
              <div className={styles.song}>
                <p className={styles.bold}>{activeTrack.title}</p>
                <div className={styles.end}>
                  <button type="button" className={styles.iconButton} onClick={handleTrackClose} aria-label="Fermer">
                    <AddIcon size={20} className={styles.closeIconRotated} />
                  </button>
                  <p className={styles.light}>{activeTrack.duration}</p>
                </div>
              </div>
              <div className={styles.songModalInfo}>
                {activeTrack.credits && (
                  <div className={styles.songCredits}>
                    <EditIcon size={20} />
                    <MusicNoteIcon />
                    {activeTrack.credits}
                  </div>
                )}
                {activeTrack.detail}
              </div>
              <GradientBlur />
            </div>
          )}

          {/* ── Panneau artiste ── */}
          {author && (
            <div
              className={styles.modal}
              style={{ display: isArtistModalActive ? 'flex' : isSongModalActive ? 'none' : undefined }}
            >
              <button type="button" className={styles.toggle} onClick={handleArtistToggle} aria-label={isArtistModalActive ? 'Fermer' : 'Voir l’artiste'}>
                <AddIcon size={24} className={classNames({ [styles.closeIconRotated]: isArtistModalActive })} />
              </button>
              <div className={styles.modalContent}>
                <div className={styles.photoWrapper}>
                  <h1 className={styles.title}>{author.name}</h1>
                  <img className={styles.photo} src={author.photoUrl} alt="" />
                  <img className={classNames(styles.photo, styles.photoBlur)} src={author.photoUrl} alt="" aria-hidden="true" />
                </div>
                <div className={styles.info}>
                  <div className={styles.infoTop}>
                    <div className={styles.infoTopLeft}>
                      {author.genre && <p className={classNames(styles.light, styles.genre)}>{author.genre}</p>}
                      {author.genre && author.trackCountLabel && <div className={styles.divider} />}
                      {author.trackCountLabel && <p className={styles.light}>{author.trackCountLabel}</p>}
                    </div>
                    {author.listenerCountLabel && <p className={styles.light}>{author.listenerCountLabel}</p>}
                  </div>
                  {author.bio && <p className={styles.bold}>{author.bio}</p>}
                </div>
              </div>
              <GradientBlur />
              <div className={styles.shade} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaPlayer;
