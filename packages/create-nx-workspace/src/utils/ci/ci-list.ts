export const ciList = [
  'github',
  'circleci',
  'azure',
  'bitbucket-pipelines',
  'gitlab',
] as const;

export type CI = typeof ciList[number];
