import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client/web'; // 注意这里引入的是 /web 版本以支持 Edge
import * as schema from '@repo/shared';

export function createDb(url: string, authToken: string) {
  const client = createClient({
    url,
    authToken,
  });
  
  return drizzle(client, { schema });
}