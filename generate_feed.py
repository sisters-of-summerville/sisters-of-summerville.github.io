#!/usr/bin/env python3
"""
Sisters of Summerville — RSS Feed Generator
Run this script each time you add a new comic to captions.json.
It reads captions.json and writes feed.xml in the same folder.

Usage:
  python generate_feed.py
"""

import json
import os
from datetime import datetime
from xml.sax.saxutils import escape

# ── CONFIG — update these if anything changes ──────────────────
SITE_URL      = "https://sisters-of-summerville.github.io"
CAPTIONS_FILE = "captions.json"
FEED_FILE     = "feed.xml"
FEED_TITLE    = "Sisters of Summerville"
FEED_DESC     = "Daily AI comic strip — Honey Bear the Yorkie & Bootsie Belle the tuxedo cat getting into fresh trouble every day."
FEED_LANGUAGE = "en-us"
MAX_ITEMS     = 20   # how many recent comics to include in the feed
# ──────────────────────────────────────────────────────────────

def parse_date(date_str):
    """Try common date formats and return RFC-822 string for RSS."""
    formats = ["%Y-%m-%d", "%B %d, %Y", "%b %d, %Y"]
    for fmt in formats:
        try:
            dt = datetime.strptime(date_str.strip(), fmt)
            return dt.strftime("%a, %d %b %Y 08:00:00 +0000")
        except ValueError:
            continue
    # fallback: today
    return datetime.utcnow().strftime("%a, %d %b %Y 08:00:00 +0000")

def build_feed(comics):
    now_rfc = datetime.utcnow().strftime("%a, %d %b %Y %H:%M:%S +0000")
    items = []

    for c in comics[:MAX_ITEMS]:
        title   = escape(c.get("title", "Untitled"))
        date    = c.get("date", "")
        intro   = escape(c.get("intro", "").replace("\n", " "))
        image   = c.get("image", "")
        tags    = c.get("tags", [])
        link    = f"{SITE_URL}/index.html#{escape(date)}"

        # Build image URL (handle relative paths)
        if image.startswith("http"):
            img_url = image
        else:
            img_url = f"{SITE_URL}/{image}"

        # Tags as categories
        categories = "\n".join(
            f"    <category>{escape(t)}</category>" for t in tags
        )

        pub_date = parse_date(date)

        items.append(f"""  <item>
    <title>{title}</title>
    <link>{link}</link>
    <guid isPermaLink="false">{SITE_URL}/{escape(date)}</guid>
    <pubDate>{pub_date}</pubDate>
    <description>&lt;img src="{img_url}" alt="{title}" style="max-width:100%;"/&gt;&lt;br/&gt;&lt;br/&gt;{intro}</description>
{categories}
    <enclosure url="{img_url}" type="image/jpeg" length="0"/>
  </item>""")

    items_xml = "\n".join(items)

    return f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>{escape(FEED_TITLE)}</title>
    <link>{SITE_URL}</link>
    <description>{escape(FEED_DESC)}</description>
    <language>{FEED_LANGUAGE}</language>
    <lastBuildDate>{now_rfc}</lastBuildDate>
    <atom:link href="{SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>{SITE_URL}/sos-banner.png</url>
      <title>{escape(FEED_TITLE)}</title>
      <link>{SITE_URL}</link>
    </image>
{items_xml}
  </channel>
</rss>"""

def main():
    # Find captions.json relative to this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    captions_path = os.path.join(script_dir, CAPTIONS_FILE)
    feed_path     = os.path.join(script_dir, FEED_FILE)

    if not os.path.exists(captions_path):
        print(f"❌  Could not find {CAPTIONS_FILE} — make sure this script is in the same folder.")
        return

    with open(captions_path, "r", encoding="utf-8") as f:
        comics = json.load(f)

    print(f"✅  Loaded {len(comics)} comics from {CAPTIONS_FILE}")

    feed_xml = build_feed(comics)

    with open(feed_path, "w", encoding="utf-8") as f:
        f.write(feed_xml)

    print(f"✅  feed.xml written ({len(comics[:MAX_ITEMS])} items)")
    print(f"📤  Now upload feed.xml to your GitHub repo alongside index.html")
    print(f"🔗  Your feed URL will be: {SITE_URL}/feed.xml")

if __name__ == "__main__":
    main()
