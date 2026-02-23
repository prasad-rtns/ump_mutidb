import { DatabaseType } from '../../types';

export async function connect(config: { type?: DatabaseType; connectionString: any; }) {
  const { MongoClient } = await import('mongodb');

  const client = new MongoClient(config.connectionString);

  await client.connect();

  return client.db();
}