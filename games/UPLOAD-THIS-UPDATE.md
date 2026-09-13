# Sisters of Summerville Games Page Update

Upload the contents of this package to the root of the existing `sisters-of-summerville.github.io` repository and allow GitHub to replace the matching files.

The package changes only these six files:

- `index.html` — adds Games to the main website navigation
- `games/index.html` — adds the matching logo, navigation, heading and footer
- `games/styles.css` — applies the comic website's dark design system
- `games/game.js` — checks for game service-worker updates
- `games/sw.js` — removes the need for cache-bypass query text on future updates
- `games/manifest.webmanifest` — matches the site's dark browser theme

The existing game artwork and gameplay files remain in place. After GitHub Pages finishes rebuilding, use the clean address:

`https://sisters-of-summerville.github.io/games`
