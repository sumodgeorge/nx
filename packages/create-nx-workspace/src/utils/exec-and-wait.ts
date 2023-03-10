import { exec } from 'child_process';
import { writeFileSync } from 'fs';
import { join } from 'path';

export function execAndWait(command: string, cwd: string) {
  return new Promise((res, rej) => {
    exec(
      command,
      { cwd, env: { ...process.env, NX_DAEMON: 'false' } },
      (error, stdout, stderr) => {
        if (error) {
          const logFile = join(cwd, 'error.log');
          writeFileSync(logFile, `${stdout}\n${stderr}`);
          rej({ code: error.code, logFile, logMessage: stderr });
        } else {
          res({ code: 0, stdout });
        }
      }
    );
  });
}
