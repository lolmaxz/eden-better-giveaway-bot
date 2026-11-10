// Unless explicitly defined, set NODE_ENV as development:
process.env.NODE_ENV ??= 'development';

import { ApplicationCommandRegistries, RegisterBehavior } from '@sapphire/framework';
import '@sapphire/plugin-logger/register';
import { setup } from '@skyra/env-utilities';
import * as colorette from 'colorette';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { rootDir, srcDir } from './constants';

// Set default behavior to bulk overwrite
ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(RegisterBehavior.BulkOverwrite);

// Load .env from project root (Docker) or src/ (local Windows). Docker Compose
// env_file also injects vars into process.env before this runs.
const envPath = [join(rootDir, '.env'), join(srcDir, '.env')].find((path) => existsSync(path));
setup(envPath ? { path: envPath } : undefined);

// Enable colorette
colorette.createColors({ useColor: true });
