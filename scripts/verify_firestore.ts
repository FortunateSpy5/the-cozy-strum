import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('serviceAccountKey.json', 'utf8'));
const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);

async function verify() {
  const tabsSnap = await db.collection('tabs').count().get();
  console.log('Tabs collection document count in Cloud Firestore:', tabsSnap.data().count);
  const metaDoc = await db.collection('meta').doc('catalog_index').get();
  console.log('meta/catalog_index exists:', metaDoc.exists, 'totalCount:', metaDoc.data()?.totalCount);
  const sampleTab = await db.collection('tabs').doc('seed-husn').get();
  console.log('Sample tab (Husn):', sampleTab.exists, sampleTab.data()?.title, sampleTab.data()?.artist, 'Capo:', sampleTab.data()?.capo);
  process.exit(0);
}

verify().catch((e) => {
  console.error(e);
  process.exit(1);
});
