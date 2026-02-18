
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Fix __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const CONFIG = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
};

if (!CONFIG.apiKey) {
    console.error("❌ CRITICAL ERROR: MISSING API KEY from .env");
    process.exit(1);
}

// Initialize Firebase
const app = initializeApp(CONFIG);
const db = getFirestore(app);
const auth = getAuth(app);

const APP_SCOPE = 'apps/2h_web_solutions_google_ads_asssitant_v1';
const BRAIN_COLLECTION = `${APP_SCOPE}/knowledge/global_brain/items`;

const STRATEGY_DATA = {
    title: "STRATEGY_PLAYWORLD_BIRTHDAY",
    category: "Client Strategy",
    tags: ["google_ads", "playworld", "birthday", "wien", "keywords", "manual"],
    content: `
### STRATEGIE: Playworld Wien - Kindergeburtstag (High Intent)

**Ziel:** Maximale Conversion-Rate für Geburtstagsbuchungen, Minimierung von Streuverlusten (kein "Spielplatz-Traffic").

#### 1. KEYWORD-STRATEGIE (Phrase Match Only)

Wir suchen nach "Planern", nicht nach "Besuchern".

**AG 1: Allgemein - Geburtstag (Suche nach Location)**
*   "kindergeburtstag feiern wien"
*   "kindergeburtstag location wien"
*   "indoor spielplatz geburtstag wien"
*   "kindergeburtstag wien ideen"
*   "partyraum kindergeburtstag wien"
*   "geburtstagsparty kinder wien"

**AG 2: Themenpartys (USP Fokus)**
*   "themenzimmer kindergeburtstag"
*   "mottoparty kindergeburtstag wien"
*   "partyboxen kindergeburtstag"
*   "ausgefallene kindergeburtstagslocations"
*   "kindergeburtstag piratenparty wien"

**AG 3: All-Inclusive (Sorglos-Eltern)**
*   "kindergeburtstag rundum sorglos wien"
*   "kindergeburtstag inkl essen wien"
*   "all inclusive kindergeburtstag wien"
*   "kindergeburtstag paket preise"

**Ausschließende Keywords (Negative List):**
*   -gratis, -kostenlos, -billig, -günstig
*   -basteln, -kuchen rezepte

#### 2. ANZEIGENTEXTE (RSA)
*Limit: Headlines 30 Zeichen, Descriptions 90 Zeichen.*

**Headlines (Auswahl):**
1. Kindergeburtstag in Wien
2. Playworld Wien - Geburtstag
3. 5.000m² Indoor-Erlebniswelt
4. Exklusive Themen-Partyboxen
5. All-Inclusive Paket
6. Stressfrei feiern in Wien
7. Piraten & Weltraum Zimmer
8. Jetzt Termin anfragen
9. Österreichs größter Park
10. Unvergessliche Partys

**Descriptions:**
1. Feiere den perfekten Geburtstag in der Playworld Wien. Themenzimmer & All-inclusive Spaß.
2. 5.000m² Action für Kids, Entspannung für Eltern. Buche jetzt dein Rundum-Sorglos-Paket.

#### 3. SITELINKS
1. "Unsere Themenzimmer" -> (Link: /partyboxen)
2. "Preise & Pakete" -> (Link: /preise)
3. "Galerie & Attraktionen" -> (Link: /attraktionen)
4. "Jetzt online anfragen" -> (Link: /buchen)
`,
    source: "Manual Expert Input (Silvio)",
    lastUpdated: serverTimestamp()
};

async function main() {
    try {
        console.log("🔐 Authenticating...");
        await signInAnonymously(auth);

        console.log(`🧠 Uploading Strategy: ${STRATEGY_DATA.title}...`);

        // Use title as ID for idempotency
        const docRef = doc(db, BRAIN_COLLECTION, STRATEGY_DATA.title);
        await setDoc(docRef, STRATEGY_DATA, { merge: true });

        console.log("✅ Strategy uploaded successfully!");
        process.exit(0);

    } catch (error) {
        console.error("❌ FATAL ERROR IN SCRIPT:", error);
        process.exit(1);
    }
}

main();
