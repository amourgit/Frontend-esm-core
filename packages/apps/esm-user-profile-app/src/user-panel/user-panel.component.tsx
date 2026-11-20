import React from 'react';
import { UserAvatarIcon, useSession } from '@egen-civitas/esm-framework';

/** Identité de la session, affichée en tête du panneau du menu utilisateur (slot `user-panel-slot`). */
const UserPanel: React.FC = () => {
  const session = useSession();
  return (
    <li role="none" aria-label="User" className="flex items-center gap-2 px-4 py-2 text-sm">
      <UserAvatarIcon size={20} />
      <p>{session?.user?.person?.display}</p>
    </li>
  );
};

export default UserPanel;
