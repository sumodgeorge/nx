import { spawn } from 'child_process';

/**
 * Use spawn only for interactive shells
 */
export function spawnAndWait(command: string, args: string[], cwd: string) {
  return new Promise((res, rej) => {
    const childProcess = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      env: { ...process.env, NX_DAEMON: 'false' },
    });

    childProcess.on('exit', (code) => {
      if (code !== 0) {
        rej({ code: code });
      } else {
        res({ code: 0 });
      }
    });
  });
}
