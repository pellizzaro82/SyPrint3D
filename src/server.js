import dotenv from 'dotenv';

import app from './app.js';
import { connectDatabase } from './config/database.js';
import { ensureDefaultAdminUser } from './services/userBootstrapService.js';
import { hydratePlanCatalogFromDatabase } from './services/planService.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

(async () => {
  await connectDatabase();
  await ensureDefaultAdminUser();
  await hydratePlanCatalogFromDatabase();

  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
})();
