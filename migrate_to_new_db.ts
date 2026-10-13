import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import fs from "fs";

const newConfig = {
  apiKey: "AIzaSyCUohSuUaJ-FaffkWiV72U5UZm4J3A67NQ",
  authDomain: "studio-1139705993-b3bee.firebaseapp.com",
  projectId: "studio-1139705993-b3bee",
  storageBucket: "studio-1139705993-b3bee.firebasestorage.app",
  messagingSenderId: "495687556291",
  appId: "1:495687556291:web:8ab68aa140ee2c774ed676"
};

const app = initializeApp(newConfig, "migrationApp");
const db = getFirestore(app);

async function runMigration() {
  const rawData = fs.readFileSync("migration_source_data.json", "utf-8");
  const data = JSON.parse(rawData);

  console.log("Starting migration to studio-1139705993-b3bee...");

  for (const [colName, docs] of Object.entries(data)) {
    const docList = docs as any[];
    console.log(`\nMigrating collection [${colName}] (${docList.length} documents)...`);
    for (const item of docList) {
      const docId = item._id || item.id;
      const { _id, ...cleanData } = item;
      try {
        await setDoc(doc(db, colName, docId), cleanData);
        console.log(`  ✓ Saved [${colName}/${docId}]`);
      } catch (err: any) {
        console.error(`  ✗ Error saving [${colName}/${docId}]:`, err.message || err.code);
      }
    }
  }
  console.log("\nMigration execution finished!");
}

runMigration().then(() => process.exit(0)).catch(e => {
  console.error("Migration failed:", e);
  process.exit(1);
});
