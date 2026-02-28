import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://hgckgcdajayzilayzmxs.supabase.co";

const supabaseKey =
  "sb_publishable_PRezSP8_eC5QpeHezUNrAw_yAHT6oJ2";

export const supabase = createClient(supabaseUrl, supabaseKey);