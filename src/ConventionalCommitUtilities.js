import dedent from "dedent";
import log from "npmlog";
import path from "path";
import semver from "semver";

import ChildProcessUtilities from "./ChildProcessUtilities";
import FileSystemUtilities from "./FileSystemUtilities";

const CHANGELOG_NAME = "CHANGELOG.md";
const CHANGELOG_HEADER = dedent(`# Change Log

  All notable changes to this project will be documented in this file.
  See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.`);

// We call these resolved CLI files in the "path/to/node path/to/cli <..args>"
// pattern to avoid Windows hangups with shebangs (e.g., WSH can't handle it)
const RECOMMEND_CLI = require.resolve("conventional-recommended-bump/cli");
const CHANGELOG_CLI = require.resolve("conventional-changelog-cli/cli");

export default class ConventionalCommitUtilities {
  // ########################################################################################################################

  static recommendIndependentVersion(pkg, opts) {
    // common-ui case;
    const args = [RECOMMEND_CLI, "-l", pkg.name, "--commit-path", pkg.location, "-p", "angular"];

    // yarn conventional-recommended-bump -l @wdpui/common-detect-web-view  --commmit-path packages/detect-web-view  -p angular
    return ConventionalCommitUtilities.recommendVersion(pkg, opts, "recommendIndependentVersion", args); // return either 'major'/'minor'/'patch'
  }

  static recommendFixedVersion(pkg, opts) {
    // react-gel case;
    const args = [RECOMMEND_CLI, "--commit-path", pkg.location, "-p", "angular"];
    return ConventionalCommitUtilities.recommendVersion(pkg, opts, "recommendFixedVersion", args);
  }

  static recommendVersion(pkg, opts, type, args) {
    log.silly(type, "conventional-recommended-bump: for %s at %s", pkg.name, pkg.location);

    // here conventional-recommended-bump is doing his work!!
    if (opts["debug-bump"]) {
      args.unshift("--inspect-brk");
      console.log(`${JSON.stringify(args)}    -- options    ${JSON.stringify(opts)}`);
    }
    // node ../../node_modules/conventional-recommended-bump/cli.js -l @wdpui/gel-button --commmit-path packages/gel-button -p angular
    // args: ["/opt/git/lerna/node_modules/conventional-recommended-bump/cli.js",
    //         "-l","@lernatest/gel-button",
    //         "--commit-path","/opt/git/lerna-muckaround/packages/button",
    //         "-p","angular" ]
    const recommendedBump = ChildProcessUtilities.execSync(process.execPath, args, opts);

    log.verbose(type, "conventional-recommended-bump: increment %s by %s", pkg.version, recommendedBump);
    // should use corp-semantic-release's way to do it;
    // shouldn't relay on local packages.json 's version as it's higly like to be out-of-sync with npm registry; (artifactory)

    // node -p "require('semver').inc('1.0.0', 'patch')"
    return semver.inc(
      pkg.version /*  always use local package.json version, should take npm info xx versions instead */,
      recommendedBump
    );
  }

  // ########################################################################################################################

  static updateIndependentChangelog(pkg, opts) {
    const pkgJsonLocation = path.join(pkg.location, "package.json");
    const args = [
      CHANGELOG_CLI,
      "-l",
      pkg.name,
      "--commit-path",
      pkg.location,
      "--pkg",
      pkgJsonLocation,
      "-p",
      ConventionalCommitUtilities.changelogPreset(opts),
    ];
    ConventionalCommitUtilities.updateChangelog(pkg, opts, "updateIndependentChangelog", args);
  }

  static updateFixedChangelog(pkg, opts) {
    const pkgJsonLocation = path.join(pkg.location, "package.json");
    const args = [
      CHANGELOG_CLI,
      "--commit-path",
      pkg.location,
      "--pkg",
      pkgJsonLocation,
      "-p",
      ConventionalCommitUtilities.changelogPreset(opts),
    ];
    ConventionalCommitUtilities.updateChangelog(pkg, opts, "updateFixedChangelog", args);
  }

  static updateFixedRootChangelog(pkg, opts) {
    const args = [
      CHANGELOG_CLI,
      "-p",
      ConventionalCommitUtilities.changelogPreset(opts),
      "--context",
      path.resolve(__dirname, "..", "lib", "ConventionalChangelogContext.js"),
    ];
    ConventionalCommitUtilities.updateChangelog(pkg, opts, "updateFixedRootChangelog", args);
  }

  static updateChangelog(pkg, opts, type, args) {
    log.silly(type, "for %s at %s", pkg.name, pkg.location);

    const changelogLocation = ConventionalCommitUtilities.changelogLocation(pkg);

    let changelogContents = "";
    if (FileSystemUtilities.existsSync(changelogLocation)) {
      changelogContents = FileSystemUtilities.readFileSync(changelogLocation);
    }

    // run conventional-changelog-cli to generate the markdown for the upcoming release.
    let newEntry = ChildProcessUtilities.execSync(process.execPath, args, opts);

    // When force publishing, it is possible that there will be no actual changes, only a version bump.
    // Add a note to indicate that only a version bump has occurred.
    if (!newEntry.split("\n").some(line => line.startsWith("*"))) {
      newEntry = dedent(
        `
        ${newEntry}
        
        **Note:** Version bump only for package ${pkg.name} 
        `
      );
    }

    log.silly(type, "writing new entry: %j", newEntry);

    // CHANGELOG entries start with <a name=, we remove
    // the header if it exists by starting at the first entry.
    if (changelogContents.indexOf("<a name=") !== -1) {
      changelogContents = changelogContents.substring(changelogContents.indexOf("<a name="));
    }

    FileSystemUtilities.writeFileSync(
      changelogLocation,
      // only allow 1 \n at end of content.
      dedent(
        `${CHANGELOG_HEADER}

        ${newEntry}

        ${changelogContents}`.replace(/\n+$/, "\n")
      )
    );

    log.verbose(type, "wrote", changelogLocation);
  }

  static changelogLocation(pkg) {
    return path.join(pkg.location, CHANGELOG_NAME);
  }

  static changelogPreset(opts) {
    return opts && opts.changelogPreset ? opts.changelogPreset : "angular";
  }
}
