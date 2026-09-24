# TikTok Dashboard

Dashboard local pour suivre plusieurs comptes TikTok : performances des vidéos, vues à 24 h, tendance des comptes et détection de shadowban.

Tout tourne sur ta machine : pas de compte à connecter, pas de clé API, pas de service tiers. Les données sont collectées avec [yt-dlp](https://github.com/yt-dlp/yt-dlp) et stockées dans une base SQLite locale.

## Fonctionnalités

- Suivi d'autant de comptes que tu veux (testé avec 5 à 20)
- Collecte incrémentale en un clic (1 à 2 minutes), avec barre de progression
- Vue globale : vues 7 jours, tendance, score de santé par compte, alertes
- Page par compte : vues à 24 h par vidéo comparées à la médiane du compte, historique complet
- Page par vidéo : courbe de croissance des vues, engagement, ratio vs médiane
- Détection de shadowban par heuristique :
  - **Vues à 24 h** : relevé le plus proche de 24 h après publication (fenêtre 12 h – 48 h)
  - **Médiane du compte** : médiane des vues à 24 h des 20 dernières vidéos (3 minimum pour fiabiliser)
  - **Vidéo suspecte** : moins de 30 % de la médiane du compte
  - **Score de santé** : pourcentage des 10 dernières vidéos dans la norme

La détection est une heuristique : TikTok ne communique jamais un shadowban. Les faux positifs sont limités en exigeant un minimum de vidéos analysées.

## Prérequis

- **Node.js 22 ou plus récent** — `node --version` pour vérifier, sinon [nodejs.org](https://nodejs.org) ou `brew install node`
- **yt-dlp** — `brew install yt-dlp` (ou `pipx install yt-dlp`, `pip install yt-dlp`...)
- macOS pour les scripts de lancement en double-clic. Sur Linux/Windows, tout fonctionne aussi, il suffit de lancer `npm run dev` manuellement.

## Installation (2 minutes)

```bash
git clone <url-du-repo>
cd tiktok-dashboard
npm install
```

Puis, sur macOS, double-clique sur **`Démarrer le dashboard.command`** : il démarre le serveur et ouvre [http://localhost:3000](http://localhost:3000) dans le navigateur.

Sinon, en ligne de commande :

```bash
npm run dev
# puis ouvrir http://localhost:3000
```

## Utilisation

1. Dans le dashboard, ajoute un compte avec `@sonpseudo` : les 50 dernières vidéos et leurs stats sont collectées immédiatement (environ 10 secondes par compte).
2. Clique sur **Actualiser maintenant** pour lancer une collecte incrémentale de tous les comptes.
3. **Actualise au moins une fois par jour.** Les scores de santé et la détection de shadowban ont besoin d'un relevé entre 12 h et 48 h après chaque publication. Après 2-3 jours de relevés, tout se remplit automatiquement.

Les chiffres affichés correspondent au dernier relevé. Plus tu actualises régulièrement, plus l'historique est précis.

## Ce qui est stocké où

| Chemin             | Contenu                                          |
| ------------------ | ------------------------------------------------ |
| `data/tiktok.db`   | La base SQLite (comptes, vidéos, relevés)        |
| `data/thumbs/`     | Les miniatures des vidéos                        |

Le dossier `data/` est ignoré par git : ta base reste locale et ne part jamais dans un commit.

## Maintenance

TikTok change régulièrement ses protections, et yt-dlp s'adapte en quelques jours. Pense à le mettre à jour toutes les 2 à 4 semaines :

```bash
brew upgrade yt-dlp
```

Sur macOS, tu peux aussi double-cliquer sur **`Mettre à jour yt-dlp.command`**.

### Si TikTok rate-limite ou demande une connexion

Ajoute tes cookies de navigateur en lançant le serveur avec la variable d'environnement :

```bash
YTDLP_COOKIES_FROM_BROWSER=chrome npm run dev
```

(valeurs possibles : `chrome`, `safari`, `firefox`, `edge`, `brave`...)

## Dépannage

| Problème | Solution |
| --- | --- |
| `yt-dlp introuvable` | Installe-le : `brew install yt-dlp` |
| Un compte passe en erreur | Vérifie qu'il existe et qu'il est public, puis relance une actualisation |
| Tout est en « En attente » | Normal au début : il faut 2-3 jours de relevés (12 h – 48 h après publication) pour les scores et la médiane |
| `npm install` échoue avec `EACCES` | Ton cache npm a un souci de permissions : `sudo chown -R $(id -u):$(id -g) ~/.npm` |
| Le port 3000 est occupé | `npm run dev -- -p 3001` puis ouvre `localhost:3001` |

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · Tailwind CSS 4 · SQLite via `node:sqlite` · yt-dlp · lucide-react · graphiques SVG faits maison (aucune librairie de charts)

## Structure

```
src/
  app/                  Pages et routes API
    page.tsx            Vue globale
    accounts/[username] Page compte
    videos/[id]         Page vidéo
    api/                Ajout de compte, actualisation, progression, miniatures
    components/         UI, graphes, contrôles
  lib/
    db.ts               Connexion SQLite + schéma
    ytdlp.ts            Appels yt-dlp
    collector.ts        Collecte incrémentale + jobs
    metrics.ts          Vues à 24 h, médiane, score de santé
    queries.ts          Requêtes SQL
    dashboard.ts        Assemblage des données pour les pages
```

## Commandes utiles

```bash
npm run dev      # serveur de développement
npm run build    # build de production
npm run lint     # ESLint
npm run format   # Prettier
```
