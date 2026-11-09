"""
Public ASCII Tablature Fetcher for The Cozy Strum.
Retrieves authentic ASCII guitar & ukulele tablatures (intros, solos, riffs) from public archives.
"""

from __future__ import annotations
import json
import re
import urllib.parse
import urllib.request
from typing import Optional

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)"
SEARCH_URL = "https://www.ultimate-guitar.com/search.php"

def clean_ug_tab_text(raw_tab: str) -> str:
    """Removes UG markup tags like [tab], [ch], and HTML entities while preserving monospace."""
    cleaned = re.sub(r"\[/?(tab|ch)\]", "", raw_tab)
    cleaned = cleaned.replace("&quot;", '"').replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
    return cleaned.strip()

def extract_section_from_tab(tab_text: str, section_name: str = "intro") -> Optional[str]:
    """Extracts a specific section (e.g. Intro, Solo, Riff) and its ASCII tab lines."""
    lines = tab_text.splitlines()
    target_pattern = re.compile(rf"\[?{re.escape(section_name)}[\]:]?", re.IGNORECASE)
    section_lines: list[str] = []
    in_section = False

    for line in lines:
        stripped = line.strip()
        if target_pattern.search(stripped):
            in_section = True
            section_lines.append(line)
            continue
        if in_section:
            # If we hit another major section header like [Verse] or [Chorus]
            if re.match(r"^\[(Verse|Chorus|Bridge|Outro)\]", stripped, re.IGNORECASE):
                break
            section_lines.append(line)

    if section_lines:
        return "\n".join(section_lines).strip()
    return None

def extract_first_ascii_tab_block(tab_text: str) -> Optional[str]:
    """Finds and extracts the first contiguous block of ASCII tablature lines."""
    lines = tab_text.splitlines()
    tab_line_pattern = re.compile(r"^[A-Ga-g]\s*\|[\d\-\|\/\\hpbr~xXsS\(\)\^v\s]{3,}")
    block: list[str] = []
    found_block = False

    for line in lines:
        if tab_line_pattern.match(line.strip()):
            found_block = True
            block.append(line)
        elif found_block:
            if not line.strip() or line.strip().startswith("-"):
                # End of current tab stave block
                if len(block) >= 4:  # At least 4 strings (ukulele or guitar)
                    break
            else:
                break

    if len(block) >= 4:
        return "\n".join(block)
    return None

def fetch_public_ascii_tab(
    title: str,
    artist: str,
    section: Optional[str] = None,
    timeout: int = 8,
) -> Optional[str]:
    """Searches public tab archives for verified ASCII tabs and extracts content."""
    query = f"{title} {artist}".strip()
    params = urllib.parse.urlencode({"search_type": "title", "value": query})
    url = f"{SEARCH_URL}?{params}"
    headers = {"User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml"}

    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            html = resp.read().decode("utf-8", errors="ignore")

        m = re.search(r'class="js-store"\s+data-content="([^"]+)"', html)
        if not m:
            return None

        raw_json = m.group(1).replace("&quot;", '"').replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
        data = json.loads(raw_json)
        results = data.get("store", {}).get("page", {}).get("data", {}).get("results", [])

        # Filter for ASCII Tab entries
        tab_entries = [r for r in results if r.get("type") == "Tabs" and r.get("tab_url")]
        if not tab_entries:
            return None

        best_tab_url = tab_entries[0]["tab_url"]
        tab_req = urllib.request.Request(best_tab_url, headers=headers)
        with urllib.request.urlopen(tab_req, timeout=timeout) as tab_resp:
            tab_html = tab_resp.read().decode("utf-8", errors="ignore")

        tm = re.search(r'class="js-store"\s+data-content="([^"]+)"', tab_html)
        if not tm:
            return None

        t_data = json.loads(tm.group(1).replace("&quot;", '"').replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">"))
        wiki = t_data.get("store", {}).get("page", {}).get("data", {}).get("tab_view", {}).get("wiki_tab", {})
        content = wiki.get("content", "")
        if not content:
            return None

        cleaned = clean_ug_tab_text(content)
        if section:
            sec_block = extract_section_from_tab(cleaned, section)
            if sec_block:
                return sec_block

        first_block = extract_first_ascii_tab_block(cleaned)
        return first_block or cleaned[:1200]
    except Exception:
        return None
