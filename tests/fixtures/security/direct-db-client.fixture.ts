import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "http://127.0.0.1:54321";
const serviceRole = "service_role_fake_negative_fixture";

export const directDbClient = createClient(supabaseUrl, serviceRole);

export async function directRpcFixture() {
  return directDbClient.rpc("unsafe_direct_rpc_fixture");
}
