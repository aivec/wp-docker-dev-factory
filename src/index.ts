#!/usr/bin/env node

import { canUseDockerOrExit } from './docker/daemon';
import { showPrompts } from './interactive';

(async (): Promise<void> => {
  await canUseDockerOrExit();
  showPrompts();
})();
