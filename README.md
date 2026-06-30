# 🐶🐱 Sisters of Summerville — Comic Strip Website

A dark-mode, searchable daily comic strip website featuring Honey Bear the Yorkie and Bootsie Belle the tuxedo cat. Built for GitHub Pages — free to host, easy to update daily.

🌐 **Live site:** [sisters-of-summerville.github.io/Sisters-of-Summerville](https://sisters-of-summerville.github.io/Sisters-of-Summerville/)

-----

## 📁 Repository Structure

```
Sisters-of-Summerville/
├── index.html                          ← Website HTML structure
├── captions.json                       ← All comic episode data (newest first)
├── characters.json                     ← All character profile data
├── blog.json                           ← All blog post data (newest first)
├── rss.xml                             ← RSS feed for follow.it email subscribers
├── css/
│   └── styles.css                      ← All site CSS
├── js/
│   └── app.js                          ← All site JavaScript
├── images/                             ← All images organized by type
│   ├── sos-banner.png                  ← Site header logo
│   ├── David_Fliesen_with_the_Sisters_of_Summerville.JPEG  ← About page photo
│   ├── blog/                           ← Blog post images
│   │   └── post-slug.jpeg
│   ├── 2025/                           ← Comic strip images by year
│   │   ├── 2025-10-01.png
│   │   └── ...
│   └── 2026/
│       ├── 2026-01-01.jpeg
│       └── ...
├── characters/                         ← Character portrait images
│   ├── honey-bear.jpeg
│   ├── bootsie-belle.jpeg
│   └── ...
└── README.md
```

-----

## 🚀 Site Features

- **Comics** — Searchable grid of all episodes, newest first, loads 40 at a time with Load More / Load All
- **Characters** — Full character profiles with navigable detail pages and arrow navigation
- **Blog** — Multi-post blog with prev/next navigation and YouTube embed support
- **About** — Creator bio with photo and portfolio link
- **Subscribe** — Embedded follow.it subscription form for daily email delivery
- **Hash-based deep linking** — Every comic, character, blog post, and tab has a unique shareable URL
- **RSS feed** — `rss.xml` powers follow.it email notifications with embedded images
- **Lightbox** — Click any comic image to view it full screen
- **Responsive** — Works on desktop, tablet, and mobile

-----

## 📅 Daily Workflow — Adding Content

### Option A — Admin Tool (Recommended)

Use the private admin tool to publish Comics, Blog posts, and Characters directly from your browser.

1. Navigate to the private admin URL
1. Enter your password
1. Select **Comic**, **Blog**, or **Character**
1. Fill in the form and upload your image
1. Click **🚀 PUBLISH**
1. The tool automatically updates the correct JSON file and `rss.xml`
1. Site goes live within ~2 minutes

### Option B — Manual Update

Update the relevant files directly in GitHub:

**For a new Comic** — update `captions.json` (newest first) and `rss.xml`:

```json
{
  "date": "2026-05-01",
  "title": "Your Episode Title",
  "image": "images/2026/2026-05-01.jpeg",
  "tags": ["tag1", "tag2", "tag3"],
  "intro": "Your episode description here."
}
```

**For a new Blog Post** — update `blog.json` (newest first):

```json
{
  "slug": "your-post-slug",
  "date": "2026-05-01",
  "title": "Your Post Title",
  "image": "images/blog/your-post-slug.jpeg",
  "tags": ["tag1", "tag2"],
  "body": "Your post body here.\n\nNew paragraph here."
}
```

**For a new Character** — update `characters.json`:

```json
{
  "name": "Character Name",
  "image": "characters/character-slug.jpeg",
  "tags": ["Recurring", "Species"],
  "description": "Character bio text here."
}
```

-----

## 🔗 Shareable URLs

|Page                |URL                        |
|--------------------|---------------------------|
|Homepage            |`.../#`                    |
|Subscribe           |`.../#subscribe`           |
|About               |`.../#about`               |
|Blog grid           |`.../#blog`                |
|Individual blog post|`.../#blog/post-slug`      |
|Characters grid     |`.../#characters`          |
|Individual character|`.../#character/honey-bear`|
|Individual comic    |`.../#2026-05-01`          |

Direct subscribe link: **[sisters-of-summerville.github.io/Sisters-of-Summerville/#subscribe](https://sisters-of-summerville.github.io/Sisters-of-Summerville/#subscribe)**

-----

## 🖼️ Image Guidelines

- **Format**: PNG or JPEG both work
- **Comics**: Square (1:1 ratio) — 1000×1000px recommended — named `YYYY-MM-DD.ext` in `images/YYYY/`
- **Characters**: Square — named `character-slug.ext` in `characters/`
- **Blog**: Any ratio — named `post-slug.ext` in `images/blog/`
- **File names are case-sensitive** — `2026-05-01.JPEG` and `2026-05-01.jpeg` are different files
- **Compress before uploading** using [squoosh.app](https://squoosh.app) — free and fast

-----

## 📡 RSS & Email Subscriptions

The site uses **follow.it** to deliver new content to email subscribers.

- RSS feed URL: `https://sisters-of-summerville.github.io/Sisters-of-Summerville/rss.xml`
- The admin tool automatically adds RSS entries for Comics, Blog posts, and new Characters
- RSS emails include the image embedded directly so subscribers see the comic without clicking
- Keep the newest ~30 items in `rss.xml` — older entries can be trimmed

-----

## 🔍 Search

Search works automatically across episode titles, descriptions, dates, and tags. Searching always shows all matching results regardless of pagination state.

-----

## ⚠️ Important Notes

- **Never edit `index.html` by downloading from the live site URL** — Cloudflare can inject scripts. Always use GitHub’s built-in web editor (pencil ✏️ icon) or upload a fresh file.
- **Admin tool is password protected** — the URL is not linked anywhere on the public site and should be kept private.
- **CSS lives in `css/styles.css`** and **JavaScript in `js/app.js`** — edit these separately from `index.html`.

-----

## 🎨 Site Colors

All colors are CSS variables at the top of `css/styles.css`:

```css
--amber:    #f5a623;   /* Main accent — gold/amber */
--blue:     #3ab5ff;   /* Secondary accent */
--bg-deep:  #0b0b13;   /* Darkest background */
--bg-card:  #1c1818;   /* Card background */
```

-----

*Creative partnership between Artist + AI · Made with ❤️ for Honey Bear & Bootsie Belle · Summerville, SC*