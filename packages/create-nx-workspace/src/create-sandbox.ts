import { writeFileSync } from 'fs';
import { dirSync } from 'tmp';
import * as ora from 'ora';
import { join } from 'path';

import {
  generatePackageManagerFiles,
  getPackageManagerCommand,
  PackageManager,
} from './utils/package-manager';
import { execAndWait } from './utils/exec-and-wait';
import { output } from './utils/output';
import { mapErrorToBodyLines } from './utils/string-utils';
import { nxVersion } from './utils/nx/nx-version';

/**
 * Creates a temporary directory and installs Nx in it.
 * @param packageManager package manager to use
 * @returns directory where Nx is installed
 */
export async function createSandbox(packageManager: PackageManager) {
  const installSpinner = ora(
    `Installing dependencies with ${packageManager}`
  ).start();

  const { install } = getPackageManagerCommand(packageManager);

  const tmpDir = dirSync().name;
  try {
    writeFileSync(
      join(tmpDir, 'package.json'),
      JSON.stringify({
        dependencies: {
          nx: nxVersion,
          '@nrwl/workspace': nxVersion,
        },
        license: 'MIT',
      })
    );
    generatePackageManagerFiles(tmpDir, packageManager);

    await execAndWait(install, tmpDir);

    installSpinner.succeed();
  } catch (e) {
    installSpinner.fail();
    output.error({
      title: `Nx failed to install dependencies`,
      bodyLines: mapErrorToBodyLines(e),
    });
    process.exit(1);
  } finally {
    installSpinner.stop();
  }

  return tmpDir;
}
