import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";
import path from "path";

// 1. Load Environment Variables
// Explicitly resolve from project root
const envPath = path.resolve(process.cwd(), ".env");
const result = dotenv.config({ path: envPath });

console.log("--- Turso Connection Test ---");
console.log("Env Loaded from:", envPath);
if (result.error) {
    console.error("Dotenv Error:", result.error);
}

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

// 2. Verify Variables
console.log("URL:", url);
console.log("Token Present:", !!authToken);
console.log("Token Length:", authToken?.length);

if (!url || !authToken) {
    console.error("Critical: Missing URL or Token");
    process.exit(1);
}

// 3. Attempt Connection
async function test() {
    if (!url || !authToken) {
        console.error("URL or Token is missing");
        return;
    }
    try {
        const client = createClient({ url, authToken });
        const rs = await client.execute("SELECT 1 AS status");
        console.log("Connection Success!");
        console.log("Result:", rs.rows);
    } catch (e) {
        console.error("Connection Failed:", e);
    }
}

test();
