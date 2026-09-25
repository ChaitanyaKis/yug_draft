#!/usr/bin/env python3
"""Inline the site into single-file builds.

  dist/yugantra.html   full, self-contained HTML document (only Google Fonts are external)
  dist/embed.html      body-only fragment for hosts that supply their own <html>/<head>

Usage:  python3 scripts/build.py
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"


def read(rel: str) -> str:
    return (ROOT / rel).read_text(encoding="utf-8")


def inline(html: str) -> str:
    css = read("assets/css/main.css")
    html = html.replace('<link rel="stylesheet" href="assets/css/main.css">', f"<style>\n{css}\n</style>")

    def script(m: re.Match) -> str:
        src = read(m.group(1))
        if "</script" in src.lower():
            raise SystemExit(f"{m.group(1)} contains a closing script tag; cannot inline safely")
        return f"<script>\n{src}\n</script>"

    return re.sub(r'<script src="(assets/js/[\w.-]+)"></script>', script, html)


def main() -> None:
    DIST.mkdir(exist_ok=True)
    full = inline(read("index.html"))
    # The single file has no sibling assets: drop links that point at them
    # (the manifest, icons and share image only exist in the deployed folder).
    full = re.sub(r'\n<(?:link rel="(?:manifest|apple-touch-icon)"|meta property="og:image[^"]*"|meta name="apple-mobile-web-app-[^"]*")[^>]*>', "", full)
    (DIST / "yugantra.html").write_text(full, encoding="utf-8")

    title = re.search(r"<title>.*?</title>", full, re.S).group(0)
    fonts = "\n".join(re.findall(r'<link rel="(?:preconnect|stylesheet)" href="https://fonts[^>]*>', full))
    style = re.search(r"<style>.*?</style>", full, re.S).group(0)
    body = re.search(r"<!--@BODY-->(.*?)<!--@/BODY-->", full, re.S).group(1)
    scripts = "\n".join(re.findall(r"<script>\n.*?\n</script>", full.split("<!--@/BODY-->", 1)[1], re.S))
    embed = f"{title}\n{fonts}\n{style}\n{body}\n{scripts}\n"
    (DIST / "embed.html").write_text(embed, encoding="utf-8")

    for f in ("yugantra.html", "embed.html"):
        print(f"dist/{f}: {(DIST / f).stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
