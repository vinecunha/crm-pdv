// test_rpc.ts
import { supabase } from './src/lib/supabase'

async function testRPC() {
  console.log('Testando RPC create_sale_test...')
  
  const { data, error } = await supabase.rpc('create_sale_test', {
    p_created_by: '00000000-0000-0000-0000-000000000000',
    p_items: []
  })
  
  console.log('Data:', data)
  console.log('Error:', error)
}

testRPC()
