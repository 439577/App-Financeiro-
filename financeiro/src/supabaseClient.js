import { createClient } from '@supabase/supabase-js';

// URL do seu projeto "BANCO TI.PRIME" (Confirmada pelos prints)
const supabaseUrl = 'https://hgckgcdajayzilyazmxs.supabase.co';

// Sua Chave Pública (Anon)
// ATENÇÃO: Usei a que você mandou. Se der erro, lembre de usar o botão de copiar no site.
const supabaseKey = 'sb_publishable_PRezSP8_eC5QpeHezUNrAw_yAHT6oJ2';

export const supabase = createClient(supabaseUrl, supabaseKey);