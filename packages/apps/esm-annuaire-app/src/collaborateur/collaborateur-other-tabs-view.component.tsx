import React from 'react';
import {
  History,
  Bookmark,
  Award,
  LifeBuoy,
  BarChart3,
  Activity as ActivityIcon,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { type CollaborateurTabKey } from './collaborateur-detail-header.component';
import { type DirectoryEmployee } from '../data/directory-data';

interface CollaborateurOtherTabsViewProps {
  activeTab: CollaborateurTabKey;
  employee: DirectoryEmployee;
  onShowToast?: (msg: string, type?: 'info' | 'success' | 'warning') => void;
}

export function CollaborateurOtherTabsView({ activeTab, employee, onShowToast }: CollaborateurOtherTabsViewProps) {
  if (activeTab === 'purchase-history') {
    return (
      <div className="w-full flex flex-col gap-4">
        <div className="p-5 rounded-2xl border border-foreground/10 bg-foreground/[0.03] backdrop-blur-md">
          <div className="flex items-center gap-3 mb-4">
            <History className="w-5 h-5 text-warning-500" />
            <h3 className="text-base font-semibold text-foreground">Purchase & Assignment History</h3>
          </div>
          <div className="flex flex-col gap-3">
            {[
              { id: 'ORD-9821', item: 'Workstation ThinkPad P16 Gen 2', date: '15 Jan 2024', status: 'Delivered' },
              {
                id: 'ORD-9412',
                item: 'Licence Alfresco Content Services Enterprise',
                date: '02 Nov 2023',
                status: 'Active',
              },
              {
                id: 'ORD-8930',
                item: 'Écran Dell UltraSharp 32" 4K USB-C Hub',
                date: '18 Aug 2023',
                status: 'Delivered',
              },
            ].map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-foreground/[0.02] border border-foreground/10 hover:bg-foreground/[0.05] transition-colors"
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground text-sm">{row.item}</span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {row.id} • {row.date}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-success-500/20 text-success-500 border border-success-500/30">
                  {row.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'wishlist') {
    return (
      <div className="w-full flex flex-col gap-4">
        <div className="p-5 rounded-2xl border border-foreground/10 bg-foreground/[0.03] backdrop-blur-md">
          <div className="flex items-center gap-3 mb-4">
            <Bookmark className="w-5 h-5 text-primary" />
            <h3 className="text-base font-semibold text-foreground">Wishlist & Saved Items</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            3 éléments enregistrés dans la sélection du collaborateur pour les prochains renouvellements.
          </p>
        </div>
      </div>
    );
  }

  if (activeTab === 'loyalty') {
    return (
      <div className="w-full flex flex-col gap-4">
        <div className="p-5 rounded-2xl border border-foreground/10 bg-foreground/[0.03] backdrop-blur-md">
          <div className="flex items-center gap-3 mb-4">
            <Award className="w-5 h-5 text-warning-500" />
            <h3 className="text-base font-semibold text-foreground">Loyalty & Badges Program</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { title: 'MVP Contributor 2023', desc: "Plus de 100 revues d'architecture validées sans faille." },
              { title: 'Security Champion', desc: 'Certification ISO 27001 et conformité stricte des accès.' },
              { title: 'Lead Mentor', desc: "Accompagnement de 12 nouveaux ingénieurs sur l'intranet." },
              { title: 'Excellence Opérationnelle', desc: 'Taux de satisfaction de 98.4% auprès des directions.' },
            ].map((b) => (
              <div
                key={b.title}
                className="p-4 rounded-xl bg-foreground/[0.02] border border-foreground/10 flex flex-col gap-1"
              >
                <span className="text-sm font-semibold text-warning-500">{b.title}</span>
                <span className="text-xs text-muted-foreground">{b.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'support') {
    return (
      <div className="w-full flex flex-col gap-4">
        <div className="p-5 rounded-2xl border border-foreground/10 bg-foreground/[0.03] backdrop-blur-md">
          <div className="flex items-center gap-3 mb-4">
            <LifeBuoy className="w-5 h-5 text-info-500" />
            <h3 className="text-base font-semibold text-foreground">Support Tickets</h3>
          </div>
          <div className="flex flex-col gap-3">
            {[
              {
                id: 'TICK-4029',
                subject: 'Extension de quota de stockage documentaire',
                date: 'Il y a 3 jours',
                status: 'Résolu',
              },
              {
                id: 'TICK-3891',
                subject: 'Demande de certificat VPN Datacenter Limete',
                date: 'Il y a 2 semaines',
                status: 'Résolu',
              },
            ].map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-foreground/[0.02] border border-foreground/10"
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground text-sm">{t.subject}</span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {t.id} • {t.date}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-success-500/20 text-success-500 border border-success-500/30">
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'insight') {
    return (
      <div className="w-full flex flex-col gap-4">
        <div className="p-5 rounded-2xl border border-foreground/10 bg-foreground/[0.03] backdrop-blur-md">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-5 h-5 text-secondary" />
            <h3 className="text-base font-semibold text-foreground">Performance Insights & Analytics</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Taux de Résolution', val: '99.2%' },
              { label: 'Temps Moyen de Réponse', val: '14 min' },
              { label: 'Revues Documentaires', val: '1,420' },
              { label: 'Score Global', val: '4.8 / 5' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-3.5 rounded-xl bg-foreground/[0.02] border border-foreground/10 flex flex-col"
              >
                <span className="text-xs text-muted-foreground">{stat.label}</span>
                <span className="text-lg font-bold text-foreground mt-1">{stat.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Activity Tab
  return (
    <div className="w-full flex flex-col gap-4">
      <div className="p-5 rounded-2xl border border-foreground/10 bg-foreground/[0.03] backdrop-blur-md">
        <div className="flex items-center gap-3 mb-4">
          <ActivityIcon className="w-5 h-5 text-success-500" />
          <h3 className="text-base font-semibold text-foreground">Journal d'Activité Récent</h3>
        </div>
        <div className="flex flex-col gap-3">
          {[
            { action: "Validation de l'audit de conformité sur le rayon Archives R-04", time: "Aujourd'hui à 10:24" },
            { action: 'Mise à jour du schéma de sauvegarde haute disponibilité', time: 'Hier à 16:45' },
            { action: "Publication d'un compte-rendu de comité technique", time: '22 Fév 2024' },
            { action: "Attribution des droits d'archivage légal pour le site Limete", time: '19 Fév 2024' },
          ].map((act, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl bg-foreground/[0.02] border border-foreground/10"
            >
              <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm text-muted-foreground">{act.action}</span>
                <span className="text-[11px] text-muted-foreground">{act.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
