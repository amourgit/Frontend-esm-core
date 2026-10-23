// happy-dom ≥ 20.8 implémente l'API Web Animations. framer-motion l'utilise alors pour animer,
// et à chaque démontage `Animation.cancel()` rejette `finished` avec une AbortError que rien
// n'intercepte : vitest fait échouer la suite. Les versions précédentes de happy-dom n'avaient pas
// `Element.prototype.animate` et framer-motion retombait sur son moteur JavaScript. On rétablit
// ce comportement pour les tests de rendu (l'app, elle, tourne dans un vrai navigateur).
Reflect.deleteProperty(Element.prototype, 'animate');
