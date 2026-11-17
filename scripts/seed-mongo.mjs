// node --env-file=.env.local scripts/seed-mongo.mjs
import { MongoClient } from "mongodb";
import { embedText } from "../src/lib/embedding.ts";

const client = await new MongoClient(process.env.MONGODB_URI).connect();
const col = client.db(process.env.MONGODB_DB ?? "claim_engine").collection("IncidentReports");
await col.deleteMany({});

const img = (s) => `https://picsum.photos/seed/${s}/640/400`;
const docs = [
  { claimId: 1, policyId: 1, incidentType: "Auto Collision", location: "MG Road, Bengaluru", incidentDate: new Date("2026-10-02"), severityScore: 7,
    description: "Rear-ended at the MG Road signal by a white hatchback. Bumper crushed and tail light broken, driver unhurt.", photos: [img("car1"), img("car2")] },
  { claimId: 2, policyId: 1, incidentType: "Auto Collision", location: "MG Road, Bengaluru", incidentDate: new Date("2026-10-04"), severityScore: 7,
    description: "Rear ended at the MG Road signal by a white hatchback. Crushed bumper and broken tail light, driver not injured.", photos: [img("car1"), img("car3")] },
  { claimId: 3, policyId: 2, incidentType: "Water Damage", location: "Indiranagar, Bengaluru", incidentDate: new Date("2026-09-20"), severityScore: 5,
    description: "Burst pipe in the kitchen flooded the floor and damaged the wooden cabinets and refrigerator.", photos: [img("water1")] },
  { claimId: 4, policyId: 3, incidentType: "Theft", location: "Whitefield, Bengaluru", incidentDate: new Date("2026-11-01"), severityScore: 4,
    description: "Laptop and phone stolen from the apartment while the family was away for the weekend.", photos: [img("theft1")] },
  { claimId: 5, policyId: 2, incidentType: "Fire", location: "Indiranagar, Bengaluru", incidentDate: new Date("2026-11-05"), severityScore: 9,
    description: "Electrical short circuit started a fire in the living room, destroying the sofa, curtains and television.", photos: [img("fire1"), img("fire2")] },
].map((d) => ({
  ...d,
  adjusterNotes: [{ author: "Intake bot", note: "Photos received, awaiting adjuster review.", createdAt: new Date() }],
  embedding: embedText(d.description),
  createdAt: new Date(),
}));

await col.insertMany(docs);
await col.createIndex({ claimId: 1 }, { unique: true });
await col.createIndex({ policyId: 1, location: 1 });
await col.createIndex({ incidentType: 1, severityScore: 1 });
await col.createIndex({ description: "text" });
console.log("seeded", docs.length, "incident reports");
await client.close();
