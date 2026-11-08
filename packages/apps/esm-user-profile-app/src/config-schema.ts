import { Type } from '@egen-civitas/esm-framework';

// =============================================================================
//  ESM USER PROFILE APP — Configuration runtime
//
//  Où l'app envoie l'utilisateur selon l'état de sa session. Ces routes étaient auparavant écrites en dur dans la TopBar.
// =============================================================================

export const configSchema = {
  session: {
    loginRoute: {
      _type: Type.String,
      _default: '/login',
      _description:
        "Route de connexion (relative à la base du SPA) où est renvoyé l'utilisateur sans session authentifiée (modes single/off ; en mode multi-tenant, c'est le garde du tenant qui renvoie).",
    },
    homeRoute: {
      _type: Type.String,
      _default: '${egenSpaBase}/home',
      _description: "Destination de l'utilisateur authentifié qui arrive à la racine du SPA (accepte ${egenSpaBase}).",
    },
  },
};

export interface ConfigSchema {
  session: { loginRoute: string; homeRoute: string };
}
