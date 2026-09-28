# Politique de sécurité

## Signaler une vulnérabilité

Merci de ne pas ouvrir d'issue publique, de discussion ni de pull request pour une faille de
sécurité.

Utilisez le signalement privé de GitHub : onglet **Security** du dépôt, puis
**Report a vulnerability**, ou directement
<https://github.com/warrox1993/Beecuit/security/advisories/new>.

Précisez si possible :

- le commit ou la version concernés ;
- les étapes pour reproduire le problème ;
- l'impact estimé.

Le signalement reste privé entre vous et le mainteneur jusqu'à la publication d'un correctif.
Un accusé de réception est envoyé dès que possible.

## Périmètre

Sont concernés le code de ce dépôt et ses workflows GitHub Actions. Une faille propre à une
dépendance tierce se signale à ses mainteneurs ; son usage vulnérable dans ce dépôt peut en
revanche être signalé ici, par le même canal.

## Versions prises en charge

Seul l'état actuel de la branche `main` reçoit des correctifs de sécurité.

## Dépendance vulnérable en attente d'une version stable

**next-auth 5.0.0-beta.31** (état au 28/09/2026). Le projet utilise déjà la série bêta 5 de
next-auth, la seule compatible avec l'App Router. Six alertes Dependabot restent ouvertes sur
ce paquet (quatre critiques, deux hautes) :

| Avis | Gravité | Objet |
|---|---|---|
| GHSA-7rqj-j65f-68wh | critique | normalisation Unicode de l'e-mail faite après sa validation |
| GHSA-8fpg-xm3f-6cx3 | critique | une erreur de configuration peut peupler l'objet `auth` avec une erreur |
| GHSA-xmf8-cvqr-rfgj | haute | `getToken()` lève une exception sur un en-tête Bearer malformé |
| (cookies OAuth) | moyenne | cookies state, nonce et PKCE non liés au fournisseur qui les a créés |

Le seul correctif publié est **5.0.0-beta.32**, encore une bêta : décision du propriétaire,
aucune version bêta supplémentaire n'est installée. En attendant :

- `@auth/core`, où vivent les deux premiers correctifs, est surchargé en **0.41.3**, version
  stable (`pnpm.overrides` de `package.json`) ;
- le code ne se contente jamais de l'existence de la session : chaque contrôle d'accès lit
  `session?.user?.id` ou `session?.user?.role`, ce qui limite GHSA-8fpg-xm3f-6cx3 ;
- `.github/dependabot.yml` ignore les bêtas de next-auth 5, si bien que Dependabot proposera
  la **version stable 5.0.0** dès sa publication. Elle sera alors installée et ces alertes
  fermées.
