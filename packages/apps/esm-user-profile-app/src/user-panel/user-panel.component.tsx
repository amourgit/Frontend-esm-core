import React from 'react';
import { SwitcherItem } from '@carbon/react';
import { UserAvatarIcon, useSession } from '@egen-civitas/esm-framework';

/** Identité de la session, affichée en tête du panneau du menu utilisateur (slot `user-panel-slot`). */
const UserPanel: React.FC = () => {
  const session = useSession();
  return (
    <SwitcherItem aria-label="User">
      <UserAvatarIcon size={20} />
      <p>{session?.user?.person?.display}</p>
    </SwitcherItem>
  );
};

export default UserPanel;
