import React from 'react';

// Stubs minimaux du framework pour tester les SECTIONS (assemblage, filtres, navigation) ; le rendu du
// squelette `Section` lui-même est testé dans esm-styleguide. `navigate` reçoit l'URL déjà interpolée.
export function createFrameworkMock(navigateTo: (to: string) => void) {
  const h = React.createElement;
  type Node = React.ReactNode;
  const Section = ({ title, actions, footer, footerActions, children }: Record<string, Node>) =>
    h(
      'section',
      { 'aria-label': typeof title === 'string' ? title : undefined },
      h('header', null, title ? h('h2', null, title) : null, actions),
      h('div', null, children),
      footer || footerActions ? h('footer', null, footer, footerActions) : null,
    );
  const SectionAction = ({
    children,
    label,
    active,
    disabled,
    onClick,
  }: {
    children?: Node;
    label?: string;
    active?: boolean;
    disabled?: boolean;
    onClick?: () => void;
  }) =>
    h(
      'button',
      {
        type: 'button',
        'aria-label': children ? undefined : label,
        'aria-pressed': active || undefined,
        disabled,
        onClick,
      },
      children,
    );
  const SectionGrid = ({ children }: { children?: Node }) => h('div', null, children);
  const SectionCard = ({ as: Tag = 'div', children }: { as?: string; children?: Node }) => h(Tag, null, children);
  const SectionCardTitleButton = ({ children, onClick }: { children?: Node; onClick?: () => void }) =>
    h('button', { type: 'button', onClick }, children);
  return {
    Section,
    SectionAction,
    SectionGrid,
    SectionCard,
    SectionCardTitleButton,
    showToast: () => undefined,
    CardModal: () => null,
    interpolateUrl: (url: string) => url.replace('${egenSpaBase}', ''),
    navigate: ({ to }: { to: string }) => navigateTo(to),
  };
}
