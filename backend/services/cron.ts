import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initCronJobs() {
    const cronDir = path.join(__dirname, '../cron');

    if (!fs.existsSync(cronDir)) {
        console.log('[CRON] No cron directory found.');
        return;
    }

    const files = fs.readdirSync(cronDir).filter(f => f.endsWith('.ts') || f.endsWith('.js'));

    for (const file of files) {
        if (file === 'index.ts' || file === 'index.js') continue;

        try {
            const filePath = path.join(cronDir, file);
            const module = await import(pathToFileURL(filePath).href);

            const config = module.default;

            if (config && config.schedule && config.handler) {
                cron.schedule(config.schedule, async () => {
                    console.log(`[CRON] Executing ${config.name || file}...`);
                    try {
                        await config.handler();
                    } catch (err) {
                        console.error(`[CRON] Error executing ${config.name || file}:`, err);
                    }
                });
                console.log(`[CRON] Registered job: ${config.name || file} [${config.schedule}]`);
            }
        } catch (err) {
            console.error(`[CRON] Failed to load cron job from ${file}:`, err);
        }
    }
}
