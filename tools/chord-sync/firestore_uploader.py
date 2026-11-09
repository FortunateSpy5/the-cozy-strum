"""
Optional Firestore Direct Uploader for The Cozy Strum.
Uploads generated tabs to tabs/{tabId} using firebase-admin service account credentials.
"""

from __future__ import annotations
import os
import re
from datetime import datetime, timezone
from typing import Optional

def generate_tab_slug(title: str, artist: str) -> str:
    """Generates a clean URL slug from title and artist."""
    raw = f"{title}-{artist}".lower()
    return re.sub(r"[^a-z0-9]+", "-", raw).strip("-")

def upload_tab_to_firestore(
    title: str,
    artist: str,
    content: str,
    chords_used: list[str],
    service_account_path: Optional[str] = None,
    visibility: str = "private",
    status: str = "draft",
    capo: int = 0,
    instrument: str = "guitar",
) -> str:
    """Uploads generated tab to Firestore using firebase-admin."""
    try:
        import firebase_admin  # type: ignore
        from firebase_admin import credentials, firestore  # type: ignore
    except ImportError:
        raise ImportError(
            "firebase-admin is required for direct Firestore upload.\n"
            "Install with: pip install firebase-admin"
        )

    creds_file = service_account_path or os.environ.get("GOOGLE_APPLICATION_CREDENTIALS") or "serviceAccountKey.json"
    if not os.path.exists(creds_file):
        raise FileNotFoundError(
            f"Service account file not found at: {creds_file}\n"
            "Set GOOGLE_APPLICATION_CREDENTIALS or pass --service-account <path>"
        )

    if not firebase_admin._apps:
        cred = credentials.Certificate(creds_file)
        firebase_admin.initialize_app(cred)

    db = firestore.client()

    now = datetime.now(timezone.utc).isoformat()
    slug = generate_tab_slug(title, artist)
    doc_id = f"auto-{slug[:32]}-{int(datetime.now().timestamp())}"

    tab_data = {
        "id": doc_id,
        "slug": slug,
        "title": title.strip(),
        "artist": artist.strip(),
        "instrument": instrument,
        "tuning": "Standard (E A D G B E)",
        "capo": capo,
        "difficulty": "Intermediate",
        "isFingerstyle": False,
        "chordsUsed": chords_used,
        "content": content,
        "authorUid": "cli-sync-tool",
        "authorName": "The Cozy Strum Aligner",
        "visibility": visibility,
        "status": status,
        "categories": ["Acoustic"],
        "favoritesCount": 0,
        "viewsCount": 0,
        "createdAt": now,
        "updatedAt": now,
    }

    db.collection("tabs").document(doc_id).set(tab_data)
    return doc_id
