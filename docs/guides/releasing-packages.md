# Release npm packages

Infoschematics publishes seven public packages as one coordinated version from one immutable repository tag. Preparing, building, packing, or merging release work does not grant authority to publish. A release owner must deliberately create the tag and start the protected workflow.

## Configure trusted publishing

Before the first publication, confirm the organisation controls the `@infoschematics` npm scope and all seven package names. Configure each package's npm trusted publisher for this GitHub repository, workflow filename `release-npm.yml`, environment `npm`, and allowed action `npm publish`.

Create a GitHub environment named `npm`. Require a reviewer who did not start the deployment where the plan permits, restrict environment administration, and use a repository ruleset to protect `v*` release tags. The environment stores no npm token: the workflow obtains a short-lived credential through its `id-token: write` OIDC permission. npm requires npm 11.5.1 or later and Node 22.14 or later; the workflow uses Node 24 on a GitHub-hosted runner.

See [npm trusted publishers](https://docs.npmjs.com/trusted-publishers/) and [GitHub deployment environments](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments) for provider configuration and protection rules.

## Prepare one version

Choose one SemVer, including a patch for a fix-forward release. Apply the exact version to all seven public package manifests and that same exact version to every dependency between them. Do not independently version one package or include Site or authored examples in the release set.

Prepare changelog text covering consumer-visible additions, changes, fixes, and migration notes. This text becomes the GitHub Release notes for the same tag. Call out any export removal, renderer contract, required stylesheet import, or Node support change explicitly.

From a clean checkout, install locked dependencies and run the complete verification:

```bash
bun install --frozen-lockfile
bun run ki:check
bun run ki:release:verify
```

`ki:release:verify` is the required dry run. It builds unbundled ESM and declarations, inspects packed contents, installs the tarballs in clean consumers, and exercises public entry points and server rendering. Review package filenames, exact internal dependency versions, and CSS entries before continuing.

## Tag the release

Merge the reviewed version, changelog, and release-contract changes to the default branch. From the exact verified commit, create one annotated tag matching the package version:

```bash
git tag -a v0.1.0 -m "release: v0.1.0"
git push origin v0.1.0
```

Pushing the tag is a release-authority action. Do it only after explicit approval. Never move or reuse a published tag or version.

## Publish

Open GitHub Actions, select **Release npm packages**, and enter the exact existing `v<version>` tag. The workflow definition remains human-triggered from the default branch but checks out and verifies that tag before release work. Verify the checkout commit, seven package versions, and changelog all match. Approve the protected `npm` environment.

The workflow reruns repository and release verification, checks that the requested version does not already exist, then publishes dependency-first with provenance. It refuses a branch-only, malformed, moved, mismatched, or existing version. There is no automatic publication on a push, pull request, or tag creation.

## Verify publication

After the workflow succeeds:

1. Check `npm view <package>@<version>` for all seven names, exact internal dependency ranges, public access, and provenance.
2. Install the packages by version in a new empty Node consumer and repeat the import and server-render smoke checks.
3. Create a GitHub Release from the same tag using the prepared changelog.
4. Confirm README and React integration links point consumers to the current entry points and stylesheets.

## Recover

npm versions are immutable. Do not move the tag, overwrite a tarball, or unpublish a routine faulty release. Stop the workflow if safe, record any packages published before the failure, deprecate defective versions when consumers need a warning, fix the root cause, and publish a new coordinated patch across all seven packages.

```bash
npm deprecate '@infoschematics/view-studio@0.1.0' 'Defective release; use 0.1.1.'
```

Apply deprecation deliberately to every affected package version. Reserve npm unpublish for an exceptional security or legal response under registry policy; it is not a rollback mechanism.
