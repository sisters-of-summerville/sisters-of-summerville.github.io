# Install the Sisters of Summerville Arcade

This package is already arranged for the existing GitHub Pages site at:

`https://sisters-of-summerville.github.io/games/`

## Add the arcade

1. Open the GitHub repository named `sisters-of-summerville.github.io`.
2. Upload the entire **games** folder from this package into the repository root. Keep every filename and subfolder exactly as supplied.
3. Commit the new files to the branch currently used by GitHub Pages (usually `main`).
4. After GitHub Pages finishes publishing, open `https://sisters-of-summerville.github.io/games/` and refresh once.

No build command or package installation is required. The arcade is a self-contained static site. Its service worker, manifest, art, saved scores, stars, and Treat Tickets all work from the `/games/` path.

## Add a Games link to the comic site

Add this anchor beside the comic site's other navigation links:

```html
<a class="games-nav-link" href="/games/">🎮 Games</a>
```

Optional matching button style:

```css
.games-nav-link {
  display: inline-block;
  padding: .55rem .85rem;
  border: 2px solid #4b1712;
  border-radius: .65rem;
  color: #35130e;
  background: #f6bd2f;
  font-weight: 800;
  text-decoration: none;
}
```

The arcade already includes a **← Comics** button that returns visitors to `https://sisters-of-summerville.github.io/`.

## Updating later

Replace the contents of the repository's `games/` folder with the newer package and commit the changes. The arcade uses versioned caching, so returning players will receive the updated files.
