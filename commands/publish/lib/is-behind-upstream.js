"use strict";

const log = require("npmlog");
const childProcess = require("@lerna/child-process");

module.exports = isBehindUpstream;

function isBehindUpstream(gitRemote, branch, opts) {
  log.silly("isBehindUpstream");

  updateRemote(opts); // git remote update (fetch all branches .etc)

  const remoteBranch = `${gitRemote}/${branch}`;
  // symmetric difference ${sha1}...${sha2}
  // == git rev-list sha1 sha2 --not $(git merge-base --all sha1 sha2)
  // i.e. can be reached by either sha1 or sha2, but can't be reached by both;
  //      effectivly that who sha1 difference from sha2

  // here we are doing git rev-list --left-right  master...origin/master (exclude the merge-base of master and origin/master)
  // i.e symetric difference between you current branch with origin/branch
  const [behind, ahead] = countLeftRight(`${remoteBranch}...${branch}`, opts);

  log.silly(
    "isBehindUpstream",
    `${branch} is behind ${remoteBranch} by ${behind} commit(s) and ahead by ${ahead}`
  );

  return Boolean(behind);
}

function updateRemote(opts) {
  // git fetch, but for everything
  childProcess.execSync("git", ["remote", "update"], opts);
}

function countLeftRight(symmetricDifference, opts) {
  const stdout = childProcess.execSync(
    "git",
    ["rev-list", "--left-right", "--count", symmetricDifference], // git rev-list --left-right --count tells you statistics of how many commits you are behind , and how many ahead of
    opts
  );

  return stdout.split("\t").map(val => parseInt(val, 10));
}
