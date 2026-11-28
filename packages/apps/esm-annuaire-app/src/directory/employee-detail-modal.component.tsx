import React, { useEffect, useRef, useState } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Building2,
  Briefcase,
  User,
  QrCode,
  Download,
  Copy,
  Check,
  Share2,
  Calendar,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { type DirectoryEmployee, getEmployeeUuid } from '../data/directory-data';
import { CardModal, playXboxSound } from '@egen-civitas/esm-framework';

interface EmployeeDetailModalProps {
  employee: DirectoryEmployee | null;
  initialShowQr?: boolean;
  onClose: () => void;
  onShowNotification?: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
  employee: employeeProp,
  initialShowQr = false,
  onClose,
  onShowNotification,
}) => {
  const navigate = useNavigate();
  const [showQrCode, setShowQrCode] = useState(initialShowQr);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Conserve la dernière fiche affichée : le contenu reste monté pendant l'animation de sortie du CardModal.
  const lastEmployeeRef = useRef<DirectoryEmployee | null>(employeeProp);
  if (employeeProp) lastEmployeeRef.current = employeeProp;
  const employee = employeeProp ?? lastEmployeeRef.current;

  // Le modal reste monté entre deux ouvertures : on réinitialise l'état éphémère à chaque ouverture.
  useEffect(() => {
    if (employeeProp) {
      setShowQrCode(initialShowQr);
      setCopiedField(null);
    }
  }, [employeeProp, initialShowQr]);

  if (!employee) return null;

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      playXboxSound('back');
      onClose();
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    playXboxSound('select');
    navigator.clipboard?.writeText(text);
    setCopiedField(fieldName);
    if (onShowNotification) {
      onShowNotification(`${fieldName} copié dans le presse-papiers`, 'success');
    }
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownloadVCard = () => {
    playXboxSound('achievement');
    const vCardData = `BEGIN:VCARD
VERSION:3.0
N:${employee.lastName};${employee.firstName};;;
FN:${employee.fullName}
ORG:EGEN RDC;${employee.department}
TITLE:${employee.role}
TEL;TYPE=WORK,VOICE:${employee.extension}
TEL;TYPE=CELL,VOICE:${employee.phone}
EMAIL;TYPE=PREF,INTERNET:${employee.email}
ADR;TYPE=WORK:;;${employee.site};Kinshasa;;RDC
NOTE:${employee.bio || ''}
END:VCARD`;

    const blob = new Blob([vCardData], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${employee.lastName}_${employee.firstName}.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onShowNotification) {
      onShowNotification(`Carte de visite (.vcf) de ${employee.fullName} téléchargée`, 'success');
    }
  };

  return (
    <CardModal
      open={employeeProp !== null}
      onOpenChange={handleOpenChange}
      cardVariant="glass"
      animation="scale"
      className="w-full max-w-xl"
      cardProps={{ contentClassName: '!p-0 overflow-hidden' }}
    >
      <div className="relative w-full overflow-hidden text-muted-foreground">
        {/* En-tête bandeau */}
        <div className="relative h-28 bg-gradient-to-r from-primary-900 via-popover to-secondary-900 px-6 py-4 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-foreground/10 backdrop-blur-sm border border-foreground/20 text-foreground">
              {employee.department}
            </span>
            {employee.badge && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-warning-400/20 border border-warning-300/40 text-warning-300">
                {employee.badge}
              </span>
            )}
          </div>
        </div>

        {/* Avatar chevauchant */}
        <div className="px-6 -mt-12 flex items-end justify-between">
          <div className="relative">
            <img
              src={employee.avatar}
              alt={employee.fullName}
              referrerPolicy="no-referrer"
              className="w-24 h-24 rounded-2xl object-cover border-4 border-900 shadow-xl bg-muted-foreground"
            />
            <span
              className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-900 ${
                employee.status === 'available'
                  ? 'bg-success-500'
                  : employee.status === 'busy'
                    ? 'bg-error-500'
                    : 'bg-warning-500'
              }`}
            />
          </div>

          <div className="flex items-center gap-2 pb-1">
            <button
              type="button"
              onClick={() => setShowQrCode(!showQrCode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                showQrCode
                  ? 'bg-primary-500 text-foreground border-primary-400'
                  : 'bg-muted-foreground hover:bg-muted-foreground text-muted-foreground border-700'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>{showQrCode ? 'Fiche Contact' : 'vCard & QR'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadVCard}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-muted-foreground hover:bg-muted-foreground text-muted-foreground border border-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export VCF</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playXboxSound('select');
                onClose();
                navigate(`/annuaire/${getEmployeeUuid(employee)}/details`);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-gradient-to-r from-primary-500 to-success-500 hover:from-primary-400 hover:to-success-400 text-primary-foreground font-bold border border-primary-300 shadow-sm transition-all"
              title="Ouvrir la page profil détaillée"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
              <span>Page détaillée</span>
            </button>
          </div>
        </div>

        {/* Corps principal */}
        <div className="p-6 space-y-5 max-h-[calc(85vh-160px)] overflow-y-auto scrollbar-thin scrollbar-thumb-primary-500/20">
          <div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">{employee.fullName}</h2>
            <p className="text-sm text-primary-400 font-medium">{employee.role}</p>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span>{employee.group}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="w-3 h-3 text-primary-500" />
                {employee.site}
              </span>
            </div>
          </div>

          {/* Vue QR Code vCard */}
          {showQrCode ? (
            <div className="p-6 rounded-xl bg-popover/80 border border-700 flex flex-col items-center text-center">
              <div className="p-4 bg-foreground rounded-xl shadow-lg mb-3">
                {/* QR Code SVG simulé et précis */}
                <div className="w-40 h-40 bg-foreground flex flex-col items-center justify-center p-2 border-2 border-900 rounded">
                  <QrCode className="w-32 h-32 text-background" />
                  <span className="text-[9px] font-mono text-muted-foreground mt-1 uppercase">vCard 3.0</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                Scannez pour enregistrer {employee.fullName} dans votre smartphone
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                Poste : {employee.extension} • Mob : {employee.phone}
              </p>
            </div>
          ) : (
            <>
              {/* Coordonnées de contact directes avec copie rapide */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-muted-foreground/60 border border-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-lg bg-primary-500/10 text-primary-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold">Email Professionnel</p>
                      <a
                        href={`mailto:${employee.email}`}
                        className="text-xs font-medium text-primary-300 hover:underline truncate block"
                      >
                        {employee.email}
                      </a>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(employee.email, 'Email')}
                    className="p-1 text-muted-foreground hover:text-foreground"
                    title="Copier l'email"
                  >
                    {copiedField === 'Email' ? (
                      <Check className="w-3.5 h-3.5 text-success-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-muted-foreground/60 border border-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-lg bg-secondary-500/10 text-secondary-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold">Téléphone Mobile</p>
                      <a
                        href={`tel:${employee.phone}`}
                        className="text-xs font-medium text-muted-foreground hover:underline truncate block"
                      >
                        {employee.phone}
                      </a>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(employee.phone, 'Téléphone')}
                    className="p-1 text-muted-foreground hover:text-foreground"
                    title="Copier le numéro"
                  >
                    {copiedField === 'Téléphone' ? (
                      <Check className="w-3.5 h-3.5 text-success-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-muted-foreground/60 border border-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-lg bg-info-500/10 text-info-400">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold">Poste Interne Fixe</p>
                      <p className="text-xs font-mono font-medium text-muted-foreground truncate">
                        {employee.extension}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(employee.extension, 'Poste')}
                    className="p-1 text-muted-foreground hover:text-foreground"
                    title="Copier le poste"
                  >
                    {copiedField === 'Poste' ? (
                      <Check className="w-3.5 h-3.5 text-success-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-muted-foreground/60 border border-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-lg bg-warning-500/10 text-warning-400">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold">Site de Rattachement</p>
                      <p className="text-xs font-medium text-muted-foreground truncate">{employee.site}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(employee.site, 'Site')}
                    className="p-1 text-muted-foreground hover:text-foreground"
                    title="Copier le site"
                  >
                    {copiedField === 'Site' ? (
                      <Check className="w-3.5 h-3.5 text-success-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Bio & Description */}
              {employee.bio && (
                <div className="p-3.5 rounded-xl bg-muted-foreground/40 border border-700/40">
                  <p className="text-xs text-muted-foreground leading-relaxed italic">« {employee.bio} »</p>
                </div>
              )}

              {/* Compétences / Expertises */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary-400" />
                  <span>Compétences & Domaines d'Expertise</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {employee.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md text-xs font-medium bg-muted-foreground text-primary-300 border border-primary-500/30"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Responsable & Rattachement */}
              {employee.manager && (
                <div className="flex items-center justify-between pt-2 border-t border-800 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Responsable Hiérarchique :</span>
                  </span>
                  <span className="font-semibold text-muted-foreground">{employee.manager}</span>
                </div>
              )}
            </>
          )}

          {/* Boutons d'action directe en bas */}
          <div className="pt-3 border-t border-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => {
                playXboxSound('select');
                window.location.href = `mailto:${employee.email}`;
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-info-600 hover:bg-info-500 text-foreground flex items-center gap-1.5 shadow-md transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Contacter via Outlook</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playXboxSound('select');
                if (onShowNotification) onShowNotification(`Chat Teams lancé avec ${employee.fullName}`, 'success');
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-secondary-600 hover:bg-secondary-500 text-foreground flex items-center gap-1.5 shadow-md transition-colors"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Discuter sur Teams</span>
            </button>
          </div>
        </div>
      </div>
    </CardModal>
  );
};
