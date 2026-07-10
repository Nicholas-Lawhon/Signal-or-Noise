import { createDatabaseClient } from './client';
import { importProductionContent } from './contentImport';
import { loadDatabaseEnvironment } from './environment';

loadDatabaseEnvironment();

const prisma = createDatabaseClient();

try {
  const result = await importProductionContent(prisma);
  console.log(
    `Imported ${result.scenarios} scenarios, ${result.variants} variants, ` +
    `${result.dailyChallengePools} daily pools, and ${result.eras} eras.`,
  );
} finally {
  await prisma.$disconnect();
}
