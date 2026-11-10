// Base URL des assets embarqués de l'app (dist/character-factory-assets), résolue À L'EXÉCUTION depuis l'URL de
// chargement du module (publicPath de rspack). Doit être importé AVANT le code hérité de CharacterStudio : celui-ci
// lit `import.meta.env.VITE_ASSET_PATH` (remplacé au build par cette variable globale) dès l'évaluation de ses modules.
//
// NB : `__webpack_public_path__` doit apparaître dans un vrai module (analysé par rspack). Placé dans une expression
// DefinePlugin, il n'est pas ré-analysé et reste un identifiant brut -> ReferenceError au chargement.
declare const __webpack_public_path__: string;

(globalThis as any).__EGEN_CHARACTER_FACTORY_ASSETS__ = `${__webpack_public_path__}character-factory-assets`;

export {};
