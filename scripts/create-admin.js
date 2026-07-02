import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local
const envPath = resolve(__dirname, "../.env.local");
if (!existsSync(envPath)) {
  console.error("❌  .env.local not found.");
  process.exit(1);
}

const envContent = readFileSync(envPath, "utf-8");
const env = Object.fromEntries(
  envContent
    .split("\n")
    .filter((line) => line.trim() && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const idx = line.indexOf("=");
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim().replace(/^["']|["']$/g, "")];
    })
);

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌  SUPABASE_SERVICE_ROLE_KEY is required.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function createAdmin() {
  const email = "admin@drivemy.com";
  const password = "password123";
  
  console.log(`👤 Creating admin account with email: ${email}...`);
  const { data, error } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
    user_metadata: {
      full_name: "Admin User"
    }
  });

  if (error) {
    if (error.status === 422 || error.message.includes("already exists") || error.message.includes("already registered")) {
      console.log(`⚠️ User with email ${email} already exists.`);
    } else {
      console.error(`❌ Failed to create user: ${error.message}`);
    }
  } else {
    console.log(`✅ Dummy admin account created successfully!`);
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
  }
}

createAdmin().catch((err) => {
  console.error("❌ Fatal error:", err);
});
