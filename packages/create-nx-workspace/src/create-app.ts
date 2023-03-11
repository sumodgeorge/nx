import * as ora from 'ora';
import { join } from 'path';
import { CreateWorkspaceOptions } from './create-workspace-options';
import { execAndWait } from './utils/exec-and-wait';
import { output } from './utils/output';
import {
  getPackageManagerCommand,
  getPackageManagerVersion,
  PackageManager,
} from './utils/package-manager';
import { getFileName, mapErrorToBodyLines } from './utils/string-utils';
import { unparse } from './utils/unparse';

/**
 * Create a new Nx workspace
 * @param tmpDir
 * @param name name of new nx workspace
 * @param packageManager current package manager
 * @param parsedArgs
 * @returns
 */
export async function createApp<T extends CreateWorkspaceOptions>(
  tmpDir: string,
  name: string,
  packageManager: PackageManager,
  options: T
): Promise<string> {
  const { ...restArgs } = options;

  // Ensure to use packageManager for args
  // if it's not already passed in from previous process
  if (!restArgs.packageManager) {
    restArgs.packageManager = packageManager;
  }

  const args = unparse({
    ...restArgs,
  }).join(' ');

  const pmc = getPackageManagerCommand(packageManager);

  const command = `new ${name} ${args}`;

  const workingDir = process.cwd().replace(/\\/g, '/');
  let nxWorkspaceRoot = `"${workingDir}"`;

  // If path contains spaces there is a problem in Windows for npm@6.
  // In this case we have to escape the wrapping quotes.
  if (
    process.platform === 'win32' &&
    /\s/.test(nxWorkspaceRoot) &&
    packageManager === 'npm'
  ) {
    const pmVersion = +getPackageManagerVersion(packageManager).split('.')[0];
    if (pmVersion < 7) {
      nxWorkspaceRoot = `\\"${nxWorkspaceRoot.slice(1, -1)}\\"`;
    }
  }
  let workspaceSetupSpinner = ora(
    `Creating your workspace in ${getFileName(name)}`
  ).start();

  try {
    const fullCommand = `${pmc.exec} nx ${command} --nxWorkspaceRoot=${nxWorkspaceRoot}`;
    await execAndWait(fullCommand, tmpDir);

    workspaceSetupSpinner.succeed(
      `Nx has successfully created the workspace: ${getFileName(name)}.`
    );
  } catch (e) {
    workspaceSetupSpinner.fail();
    output.error({
      title: `Nx failed to create a workspace.`,
      bodyLines: mapErrorToBodyLines(e),
    });
    process.exit(1);
  } finally {
    workspaceSetupSpinner.stop();
  }
  return join(workingDir, getFileName(name));
}
