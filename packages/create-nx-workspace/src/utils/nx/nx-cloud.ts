import * as ora from 'ora';
import { join } from 'path';
import { execAndWait } from '../exec-and-wait';
import { output } from '../output';
import { getPackageManagerCommand, PackageManager } from '../package-manager';
import { getFileName, mapErrorToBodyLines } from '../string-utils';

export async function setupNxCloud(
  name: string,
  packageManager: PackageManager
) {
  const nxCloudSpinner = ora(`Setting up NxCloud`).start();
  try {
    const pmc = getPackageManagerCommand(packageManager);
    const res = await execAndWait(
      `${pmc.exec} nx g @nrwl/nx-cloud:init --no-analytics --installationSource=create-nx-workspace`,
      join(process.cwd(), getFileName(name))
    );
    nxCloudSpinner.succeed('NxCloud has been set up successfully');
    return res;
  } catch (e) {
    nxCloudSpinner.fail();

    output.error({
      title: `Nx failed to setup NxCloud`,
      bodyLines: mapErrorToBodyLines(e),
    });

    process.exit(1);
  } finally {
    nxCloudSpinner.stop();
  }
}

export function printNxCloudSuccessMessage(nxCloudOut: string) {
  const bodyLines = nxCloudOut
    .split('Distributed caching via Nx Cloud has been enabled')[1]
    .trim();
  output.note({
    title: `Distributed caching via Nx Cloud has been enabled`,
    bodyLines: bodyLines.split('\n').map((r) => r.trim()),
  });
}
