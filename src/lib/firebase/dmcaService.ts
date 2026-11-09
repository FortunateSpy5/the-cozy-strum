import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  collection,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { getFirebaseDb } from './config';
import type { DmcaRequest, DmcaStatus, CatalogIndexDoc, SongCategory } from './types';
import { CATALOG_CACHE_KEY } from './tabsService';

export interface DmcaSubmissionInput {
  tabId: string;
  songTitle: string;
  artistName: string;
  claimantName: string;
  claimantEmail: string;
  companyOrRightsholder: string;
  infringingUrl: string;
  statementOfGoodFaith: boolean;
  digitalSignature: string;
}

export async function submitDmcaRequest(input: DmcaSubmissionInput): Promise<string> {
  const claimantName = input.claimantName.trim();
  const claimantEmail = input.claimantEmail.trim();
  const digitalSignature = input.digitalSignature.trim();

  if (!claimantName || !claimantEmail || !digitalSignature) {
    throw new Error('Name, valid email, and digital signature are required.');
  }
  if (!input.statementOfGoodFaith) {
    throw new Error('You must confirm the good-faith statement under penalty of perjury.');
  }

  const db = getFirebaseDb();
  const id = `dmca-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  const requestData: DmcaRequest = {
    id,
    tabId: input.tabId.trim(),
    songTitle: input.songTitle.trim(),
    artistName: input.artistName.trim(),
    claimantName,
    claimantEmail,
    companyOrRightsholder: input.companyOrRightsholder.trim(),
    infringingUrl: input.infringingUrl.trim(),
    statementOfGoodFaith: true,
    digitalSignature,
    status: 'open',
    createdAt: now,
  };

  if (db) {
    const docRef = doc(db, 'dmca_requests', id);
    await setDoc(docRef, requestData);
    return id;
  }

  return id;
}

export async function getDmcaRequests(): Promise<DmcaRequest[]> {
  const db = getFirebaseDb();
  if (!db) return [];

  const q = query(
    collection(db, 'dmca_requests'),
    orderBy('createdAt', 'desc'),
    limit(100)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as DmcaRequest);
}

export async function resolveDmcaRequest(
  adminUser: User,
  requestId: string,
  tabId: string,
  resolution: Exclude<DmcaStatus, 'open'>,
  adminNotes?: string
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;

  const now = new Date().toISOString();
  const reqRef = doc(db, 'dmca_requests', requestId);

  await updateDoc(reqRef, {
    status: resolution,
    resolvedByUid: adminUser.uid,
    resolvedAt: now,
    ...(adminNotes ? { adminNotes } : {}),
  });

  if (resolution === 'approved_removed' && tabId) {
    const tabRef = doc(db, 'tabs', tabId);
    await updateDoc(tabRef, {
      status: 'removed_dmca',
      updatedAt: now,
    });

    // Remove tab from public catalog index and recalculate counts
    const indexRef = doc(db, 'meta', 'catalog_index');
    try {
      const snap = await getDoc(indexRef);
      if (snap.exists()) {
        const catalog = snap.data() as CatalogIndexDoc;
        const items = { ...catalog.items };
        delete items[tabId];

        const categoryCounts: Partial<Record<SongCategory, number>> = {};
        for (const item of Object.values(items)) {
          for (const cat of item.categories || []) {
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
          }
        }

        await setDoc(indexRef, {
          lastUpdated: now,
          totalCount: Object.keys(items).length,
          items,
          categoryCounts,
        });

        if (typeof window !== 'undefined') {
          localStorage.removeItem(CATALOG_CACHE_KEY);
        }
      }
    } catch {
      // index update fallback
    }
  }
}
