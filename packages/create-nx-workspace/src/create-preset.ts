import { CreateWorkspaceOptions } from './create-workspace-options';
import { output } from './utils/output';
import {
  getPackageManagerCommand,
  getPackageManagerVersion,
  PackageManager,
} from './utils/package-manager';
import { spawnAndWait } from './utils/spawn-and-wait';
import { unparse } from './utils/unparse';

export async function createPreset<T extends CreateWorkspaceOptions>(
  preset: string,
  parsedArgs: T,
  packageManager: PackageManager,
  directory: string
): Promise<void> {
  const { skipGit, ci, commit, nxCloud, ...restArgs } = parsedArgs;

  const args = unparse({
    ...restArgs,
  }).join(' ');

  const pmc = getPackageManagerCommand(packageManager);

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

  const command = `g ${preset}:preset ${args}`;

  try {
    const [exec, ...args] = pmc.exec.split(' ');
    args.push(
      'nx',
      `--nxWorkspaceRoot=${nxWorkspaceRoot}`,
      ...command.split(' ')
    );
    await spawnAndWait(exec, args, directory);

    output.log({
      title: `Successfully applied preset: ${preset}.`,
    });
  } catch (e) {
    output.error({
      title: `Failed to apply preset: ${preset}`,
      bodyLines: ['See above'],
    });
    process.exit(1);
  }
}
