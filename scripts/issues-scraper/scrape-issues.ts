import { Octokit } from 'octokit';
import { ReportData, ScopeData } from './model';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export async function scrapeIssues(): Promise<ReportData> {
  const issues = getIssueIterator();

  let total = 0;
  let totalBugs = 0;
  let untriagedIssueCount = 0;
  const scopeLabels = await getScopeLabels();
  const scopes: Record<string, ScopeData> = {};

  for await (const { data: slice } of issues) {
    // ignore PRs
    const issueSlice = slice.filter((x) => !('pull_request' in x));
    total += issueSlice.length;
    for (const issue of issueSlice) {
      if (!(typeof issue === 'string')) {
        const bug = issue.labels.some(
          (x) => (typeof x === 'string' ? x : x.name) === 'type: bug'
        );
        if (bug) {
          totalBugs += 1;
        }
        let triaged = false;
        for (const scope of scopeLabels) {
          if (
            issue.labels.some(
              (x) => x === scope || (typeof x === 'object' && x.name === scope)
            )
          ) {
            scopes[scope] ??= { bugCount: 0, count: 0 };
            if (bug) {
              scopes[scope].bugCount += 1;
            }
            scopes[scope].count += 1;
            triaged = true;
          }
        }
        if (!triaged) {
          untriagedIssueCount += 1;
        }
      }
    }
  }

  return {
    scopes: scopes,
    totalBugCount: totalBugs,
    totalIssueCount: total,
    untriagedIssueCount,
    // Format is like: Mar 03 2023
    collectedDate: new Date().toDateString().split(' ').slice(1).join(' '),
  };
}

const getIssueIterator = () => {
  return octokit.paginate.iterator(octokit.rest.issues.listForRepo, {
    owner: 'nrwl',
    repo: 'nx',
    per_page: 100,
  });
};

let labelCache: string[];
export async function getScopeLabels(): Promise<string[]> {
  labelCache ??= await getAllLabels().then((labels) =>
    labels.filter((l) => l.startsWith('scope:'))
  );
  return labelCache;
}

async function getAllLabels() {
  const labels: string[] = [];

  for await (const slice of octokit.paginate.iterator(
    octokit.rest.issues.listLabelsForRepo,
    {
      owner: 'nrwl',
      repo: 'nx',
    }
  )) {
    const names = slice.data.map((l) => l.name);
    labels.push(...names);
  }
  return labels;
}
