import { loadConfig } from './config/env.js';
import { buildServer } from './server/app.js';

export async function main(): Promise<void> {
  const config = loadConfig();
  const server = await buildServer(config);

  try {
    await server.listen({ host: config.host, port: config.port });
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
}

await main();
