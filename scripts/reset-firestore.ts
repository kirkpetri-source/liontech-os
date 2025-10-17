import { adminDb } from '../src/lib/firebase-admin';

async function deleteAll(collectionName: string) {
  const snap = await adminDb.collection(collectionName).get();
  const docs = snap.docs;
  if (docs.length === 0) {
    return { collection: collectionName, deleted: 0 };
  }

  let deleted = 0;
  const CHUNK_SIZE = 400; // Firestore batch limit ~500
  for (let i = 0; i < docs.length; i += CHUNK_SIZE) {
    const batch = adminDb.batch();
    const slice = docs.slice(i, i + CHUNK_SIZE);
    for (const doc of slice) {
      batch.delete(doc.ref);
    }
    await batch.commit();
    deleted += slice.length;
  }

  return { collection: collectionName, deleted };
}

async function main() {
  const targets = ['clientes', 'ordens'] as const;
  const results = [] as Array<{ collection: string; deleted: number }>;
  for (const col of targets) {
    const r = await deleteAll(col);
    results.push(r);
  }
  console.log(JSON.stringify({ ok: true, results }, null, 2));
}

main().catch((err) => {
  console.error('Reset Firestore error:', err);
  process.exit(1);
});