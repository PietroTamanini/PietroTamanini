#!/usr/bin/env python3
"""Dependency-free checks for portfolio metadata, links, certificates, and sitemap."""
from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
import json
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://pietro.tamanini.dev.br"
HOME_PAGES = {"pt-BR": "/", "en": "/en.html", "es": "/es.html"}
CERT_PAGES = {"pt-BR": "/certificados.html", "en": "/certificates.html", "es": "/certificados-es.html"}
HTML_PAGES = ["index.html", "en.html", "es.html", "certificados.html", "certificates.html", "certificados-es.html", "404.html"]

class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.meta: dict[tuple[str, str], list[str]] = {}
        self.links: list[tuple[str, str]] = []
        self.ids: list[str] = []
        self.h1_count = 0
        self.title = ""
        self._in_title = False
        self._title_parts: list[str] = []
        self._in_h1 = False
        self._h1_parts: list[str] = []
        self._in_jsonld = False
        self._jsonld_parts: list[str] = []
        self.jsonld: list[str] = []
        self.certificate_hrefs: list[str] = []
        self.lang = ""

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        a = {k: (v or "") for k, v in attrs}
        if tag == "html":
            self.lang = a.get("lang", "")
        if "id" in a:
            self.ids.append(a["id"])
        if tag == "meta":
            key = (a.get("name", "").lower(), a.get("property", "").lower())
            self.meta.setdefault(key, []).append(a.get("content", ""))
        if tag == "link":
            href = a.get("href", "")
            rel = a.get("rel", "").lower().split()
            if href:
                self.links.append(("href", href))
            if "canonical" in rel:
                self.meta.setdefault(("canonical", ""), []).append(href)
            if "alternate" in rel and a.get("hreflang"):
                self.meta.setdefault(("hreflang", a["hreflang"]), []).append(href)
        if tag in {"a", "script", "img", "source", "iframe"}:
            attr = "src" if tag in {"script", "img", "source", "iframe"} else "href"
            value = a.get(attr, "")
            if value:
                self.links.append((attr, value))
        if tag == "a" and "certificate-card" in a.get("class", "").split() and a.get("href"):
            self.certificate_hrefs.append(a["href"])
        if tag == "title":
            self._in_title = True
            self._title_parts = []
        if tag == "h1":
            self.h1_count += 1
            self._in_h1 = True
            self._h1_parts = []
        if tag == "script" and a.get("type", "").lower() == "application/ld+json":
            self._in_jsonld = True
            self._jsonld_parts = []

    def handle_endtag(self, tag: str) -> None:
        if tag == "title" and self._in_title:
            self.title = "".join(self._title_parts).strip()
            self._in_title = False
        if tag == "h1" and self._in_h1:
            self._in_h1 = False
        if tag == "script" and self._in_jsonld:
            self.jsonld.append("".join(self._jsonld_parts))
            self._in_jsonld = False

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self._title_parts.append(data)
        if self._in_h1:
            self._h1_parts.append(data)
        if self._in_jsonld:
            self._jsonld_parts.append(data)


def error(message: str) -> None:
    ERRORS.append(message)

ERRORS: list[str] = []

for page_name in HTML_PAGES:
    path = ROOT / page_name
    if not path.is_file():
        error(f"Missing required page: {page_name}")
        continue
    source = path.read_text(encoding="utf-8")
    parser = PageParser()
    parser.feed(source)
    parser.close()
    if not source.lstrip().lower().startswith("<!doctype html>"):
        error(f"{page_name}: missing HTML5 doctype")
    if not parser.title:
        error(f"{page_name}: title is missing")
    if page_name != "404.html":
        if not parser.meta.get(("description", ""), [""])[0].strip():
            error(f"{page_name}: meta description is missing")
        if len(parser.meta.get(("canonical", ""), [])) != 1:
            error(f"{page_name}: expected exactly one canonical URL")
        if parser.h1_count != 1:
            error(f"{page_name}: expected one H1, found {parser.h1_count}")
        for locale in ("pt-BR", "en", "es", "x-default"):
            if len(parser.meta.get(("hreflang", locale), [])) != 1:
                error(f"{page_name}: expected one hreflang link for {locale}")
        if not parser.jsonld:
            error(f"{page_name}: JSON-LD structured data is missing")
        for number, payload in enumerate(parser.jsonld, 1):
            try:
                json.loads(payload)
            except json.JSONDecodeError as exc:
                error(f"{page_name}: JSON-LD block {number} is invalid: {exc}")
        if parser.meta.get(("keywords", "")):
            error(f"{page_name}: legacy meta keywords should not be present")
    # Duplicate IDs create unreliable fragments and ARIA references.
    seen: set[str] = set()
    dups: set[str] = set()
    for ident in parser.ids:
        if ident in seen:
            dups.add(ident)
        seen.add(ident)
    if dups:
        error(f"{page_name}: duplicate IDs: {', '.join(sorted(dups))}")

    if page_name in {"certificados.html", "certificates.html", "certificados-es.html"}:
        if len(parser.certificate_hrefs) != 11:
            error(f"{page_name}: expected 11 crawlable certificate links, found {len(parser.certificate_hrefs)}")
        for href in parser.certificate_hrefs:
            if not (ROOT / href.split("#", 1)[0].split("?", 1)[0]).is_file():
                error(f"{page_name}: certificate link points to a missing file: {href}")

    # Validate local href/src references and fragment IDs. Paths are relative to the HTML file.
    for attr, value in parser.links:
        if value.startswith(("http://", "https://", "mailto:", "tel:", "data:", "javascript:", "//")) or value == "about:blank":
            continue
        path_part, _, fragment = value.partition("#")
        path_part = path_part.split("?", 1)[0]
        target_path = (ROOT / path_part) if path_part else path
        if path_part and not target_path.exists():
            error(f"{page_name}: missing local {attr}: {value}")
        elif fragment and target_path.suffix == ".html" and target_path.is_file():
            target_parser = PageParser()
            target_parser.feed(target_path.read_text(encoding="utf-8"))
            target_parser.close()
            if fragment not in target_parser.ids:
                error(f"{page_name}: unresolved fragment #{fragment} in {path_part or page_name}")

# The sitemap must be parseable, include every canonical HTML page, and list the PDFs.
sitemap_path = ROOT / "sitemap.xml"
try:
    tree = ET.parse(sitemap_path)
    ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9", "x": "http://www.w3.org/1999/xhtml"}
    sitemap_urls = [el.find("s:loc", ns).text or "" for el in tree.findall("s:url", ns)]
    expected_paths = ["/", "/en.html", "/es.html", "/certificados.html", "/certificates.html", "/certificados-es.html"]
    for expected in expected_paths:
        if BASE + expected not in sitemap_urls:
            error(f"sitemap.xml: missing canonical page {BASE + expected}")
    for file_name in [p for p in (ROOT / "assets/certificados").glob("*.pdf")]:
        if BASE + "/" + file_name.relative_to(ROOT).as_posix() not in sitemap_urls:
            error(f"sitemap.xml: missing certificate PDF {file_name.relative_to(ROOT)}")
    for entry in tree.findall("s:url", ns):
        loc = entry.find("s:loc", ns)
        if loc is None or not loc.text:
            error("sitemap.xml: URL entry has no loc")
            continue
        path = urlparse(loc.text).path
        local_path = ROOT / (path.lstrip("/") or "index.html")
        if not local_path.is_file():
            error(f"sitemap.xml: URL has no matching local file: {loc.text}")
        if path in expected_paths:
            alternates = {a.attrib.get("hreflang") for a in entry.findall("x:link", ns)}
            if alternates != {"pt-BR", "en", "es", "x-default"}:
                error(f"sitemap.xml: incomplete language alternates for {loc.text}")
except (ET.ParseError, OSError) as exc:
    error(f"Cannot parse sitemap.xml: {exc}")

robots = (ROOT / "robots.txt").read_text(encoding="utf-8") if (ROOT / "robots.txt").is_file() else ""
if "https://pietro.tamanini.dev.br/sitemap.xml" not in robots:
    error("robots.txt: sitemap directive is missing")
if not (ROOT / "llms.txt").is_file():
    error("llms.txt is missing")
if not (ROOT / ".nojekyll").is_file():
    error(".nojekyll is missing")

if ERRORS:
    print("Site validation failed:")
    for item in ERRORS:
        print(f"- {item}")
    sys.exit(1)

print(f"Site validation passed: {len(HTML_PAGES)} HTML pages, sitemap XML, JSON-LD, local links, 33 certificate links, and 17 sitemap URLs.")
