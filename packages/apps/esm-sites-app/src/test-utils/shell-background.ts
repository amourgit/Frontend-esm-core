import { act } from '@testing-library/react';
import { renderPageBackground } from '@egen-civitas/esm-framework';

// Stand-in du shell : monte l'arrière-plan global dans un hôte SÉPARÉ de l'app, avec le vrai
// `renderPageBackground` du styleguide (même appel que esm-app-shell). Le fond déclaré par
// <PageBackground> dans l'app doit y apparaître — à travers deux racines React distinctes.
export async function mountShellBackground() {
  const host = document.createElement('div');
  host.id = 'egen-page-background-container';
  document.body.appendChild(host);
  await act(async () => renderPageBackground(host));
  return host;
}
