import { CreateWorkspaceOptions } from './create-workspace-options';
import { output } from './utils/output';
import { printNxCloudSuccessMessage, setupNxCloud } from './utils/nx/nx-cloud';
import { createSandbox } from './create-sandbox';
import { createApp } from './create-app';
import { createPreset } from './create-preset';
import { showNxWarning } from './utils/nx/show-nx-warning';
import { isKnownPreset, Preset } from './utils/preset/preset';
import { setupCI } from './utils/ci/setup-ci';
import { pointToTutorialAndCourse } from './utils/preset/point-to-tutorial-and-course';
import { messages, recordStat } from './utils/nx/ab-testing';
import { initializeGitRepo } from './utils/git/git';
import { nxVersion } from './utils/nx/nx-version';

export async function createWorkspace<T extends CreateWorkspaceOptions>(
  preset: string,
  options: T
) {
  const {
    packageManager,
    name,
    nxCloud,
    ci = '',
    skipGit = false,
    defaultBase = 'main',
    commit,
  } = options;

  output.log({
    title: `Nx is creating your v${nxVersion} workspace.`,
    bodyLines: [
      'To make sure the command works reliably in all environments, and that the preset is applied correctly,',
      `Nx will run "${options.packageManager} install" several times. Please wait.`,
    ],
  });

  const tmpDir = await createSandbox(packageManager);

  const directory = await createApp<T>(tmpDir, name, packageManager, options);

  if (!isKnownPreset(preset)) {
    await createPreset(preset, options, packageManager, directory);
  }

  let nxCloudInstallRes;
  if (nxCloud) {
    nxCloudInstallRes = await setupNxCloud(name, packageManager);
  }
  if (ci) {
    await setupCI(
      name,
      ci,
      packageManager,
      nxCloud && nxCloudInstallRes.code === 0
    );
  }
  if (!skipGit) {
    try {
      await initializeGitRepo(directory, { defaultBase, commit });
    } catch (e) {
      output.error({
        title: 'Could not initialize git repository',
        bodyLines: [e.message],
      });
    }
  }

  showNxWarning(name);

  if (isKnownPreset(preset)) {
    pointToTutorialAndCourse(preset as Preset);
  }

  if (nxCloud && nxCloudInstallRes.code === 0) {
    printNxCloudSuccessMessage(nxCloudInstallRes.stdout);
  }

  await recordStat({
    nxVersion,
    command: 'create-nx-workspace',
    useCloud: nxCloud,
    meta: messages.codeOfSelectedPromptMessage('nxCloudCreation'),
  });
}
