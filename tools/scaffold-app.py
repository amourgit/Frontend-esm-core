#!/usr/bin/env python3
"""Crée l'ossature d'une nouvelle app du core (convention du projet), à compléter ensuite.

Usage :
    python3 tools/scaffold-app.py esm-foo-app "Description de l'app" "classnames,lucide-react" sous-dossier1,sous-dossier2

Reprend la config de build / TypeScript / déclarations de `esm-user-profile-app` et la config de tests de
`esm-primary-navigation-app` (setup) ; le package.json est dérivé de celui de `esm-user-profile-app`
(donc déjà aligné sur les versions `@egen-civitas/*` courantes). Les dépendances listées en 3e argument sont copiées avec
la version qu'utilise `esm-primary-navigation-app`.

Reste à faire à la main : src/index.ts, src/routes.json, src/config-schema.ts (si besoin), composants, tests, README,
traductions (translations/en.json), entrée dans le README racine, changeset, puis `yarn install`. Voir docs/SUIVI-REFORME-TOPBAR.md.
"""
import json
import shutil
import sys
from pathlib import Path

APPS = Path(__file__).resolve().parent.parent / 'packages' / 'apps'


def scaffold(app: str, description: str, extra_deps=None, subdirs=()):
    ref, nav, dst = APPS / 'esm-user-profile-app', APPS / 'esm-primary-navigation-app', APPS / app
    for d in ['src', 'translations', *[f'src/{s}' for s in subdirs]]:
        (dst / d).mkdir(parents=True, exist_ok=True)
    for f in ['rspack.config.js', 'tsconfig.json', 'src/declarations.d.ts']:
        shutil.copy(ref / f, dst / f)
    for f in ['vitest.config.ts', 'setup-tests.ts']:
        shutil.copy(nav / f, dst / f)

    pkg = json.loads((ref / 'package.json').read_text(encoding='utf-8'))
    pkg.update(name=f'@egen/{app}', version='1.0.0', description=description, browser=f'dist/egen-{app}.js')
    pkg['repository']['directory'] = f'packages/apps/{app}'
    pkg['homepage'] = f'https://github.com/amourgit/Frontend-esm-core/tree/main/packages/apps/{app}#readme'
    for section in ('peerDependencies', 'devDependencies'):
        pkg[section].pop('react-router-dom', None)
    nav_pkg = json.loads((nav / 'package.json').read_text(encoding='utf-8'))
    for dep in extra_deps or []:
        for section in ('dependencies', 'peerDependencies', 'devDependencies'):
            if dep in nav_pkg.get(section, {}):
                pkg.setdefault(section, {})[dep] = nav_pkg[section][dep]
    for section in ('dependencies', 'peerDependencies', 'devDependencies'):
        if section in pkg:
            pkg[section] = dict(sorted(pkg[section].items()))
    (dst / 'package.json').write_text(json.dumps(pkg, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    (dst / 'translations' / 'en.json').touch()
    print(f'ossature créée : packages/apps/{app}')


if __name__ == '__main__':
    scaffold(
        sys.argv[1],
        sys.argv[2],
        [d for d in sys.argv[3].split(',') if d] if len(sys.argv) > 3 else None,
        [s for s in sys.argv[4].split(',') if s] if len(sys.argv) > 4 else (),
    )
