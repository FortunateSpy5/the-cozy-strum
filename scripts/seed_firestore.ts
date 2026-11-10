import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

interface CloudTab {
  id: string;
  slug: string;
  title: string;
  artist: string;
  album?: string;
  releaseYear?: number;
  category?: string;
  categories: string[];
  instrument: 'guitar' | 'ukulele';
  tuning: string;
  capo: number;
  bpm?: number;
  key?: string;
  timeSignature?: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  isFingerstyle: boolean;
  content: string;
  chordsUsed: string[];
  authorUid: string;
  authorName: string;
  visibility: string;
  status: string;
  favoritesCount: number;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
}

const serviceAccountPath = path.resolve('serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('Error: serviceAccountKey.json not found in project root.');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

const app = initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore(app);
db.settings({ ignoreUndefinedProperties: true });

async function seedFirestore() {
  const seedPath = path.resolve('src/lib/firebase/catalogSeedData.json');
  const tabs: CloudTab[] = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

  console.log(`\n======================================================`);
  console.log(`THE COZY STRUM — FIRESTORE CATALOG SEEDER`);
  console.log(`Target Project: ${serviceAccount.project_id}`);
  console.log(`Total Tabs to Upload: ${tabs.length}`);
  console.log(`======================================================\n`);

  const categoryCounts: Record<string, number> = {};
  const items: Record<string, any> = {};

  for (const tab of tabs) {
    items[tab.id] = {
      id: tab.id,
      slug: tab.slug,
      title: tab.title,
      artist: tab.artist,
      album: tab.album || null,
      releaseYear: tab.releaseYear || 2020,
      category: tab.category || (tab.categories && tab.categories[0]) || 'Acoustic',
      categories: tab.categories,
      instrument: tab.instrument,
      tuning: tab.tuning,
      capo: tab.capo,
      bpm: tab.bpm || 100,
      key: tab.key || 'C',
      timeSignature: tab.timeSignature || '4/4',
      difficulty: tab.difficulty,
      isFingerstyle: tab.isFingerstyle,
      chordsUsed: tab.chordsUsed,
      updatedAt: tab.updatedAt,
    };

    for (const cat of tab.categories) {
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }
  }

  const catalogIndex = {
    updatedAt: new Date().toISOString(),
    totalCount: tabs.length,
    items,
    categoryCounts,
  };

  // Upload in chunks of 200 documents
  const CHUNK_SIZE = 200;
  for (let i = 0; i < tabs.length; i += CHUNK_SIZE) {
    const chunk = tabs.slice(i, i + CHUNK_SIZE);
    const batch = db.batch();

    for (const tab of chunk) {
      const docRef = db.collection('tabs').doc(tab.id);
      batch.set(docRef, tab);
    }

    console.log(`Uploading batch ${Math.floor(i / CHUNK_SIZE) + 1}: documents ${i + 1} to ${Math.min(i + CHUNK_SIZE, tabs.length)}...`);
    await batch.commit();
    console.log(`✓ Batch committed successfully.`);
  }

  // Upload catalog index
  console.log(`\nUploading catalog summary to meta/catalog_index...`);
  await db.collection('meta').doc('catalog_index').set(catalogIndex);
  console.log(`✓ meta/catalog_index uploaded successfully!`);

  // Upload ultra-compact song directory
  const songDirDoc = JSON.parse(fs.readFileSync('src/lib/firebase/songDirectoryFallback.json', 'utf8'));
  console.log(`\nUploading compact song directory to meta/song_directory...`);
  await db.collection('meta').doc('song_directory').set(songDirDoc);
  console.log(`✓ meta/song_directory uploaded successfully!`);

  console.log(`\n======================================================`);
  console.log(`ALL ${tabs.length} SONGS SUCCESSFULLY SEEDED TO FIRESTORE!`);
  console.log(`======================================================\n`);
}

seedFirestore().catch((err) => {
  console.error('Fatal seeding error:', err);
  process.exit(1);
});
