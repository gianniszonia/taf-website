# Publishing to GitHub

How to publish this project to GitHub and keep it updated. Written for AI agents (Codex, Claude Code) and humans.

- **Repository:** `https://github.com/gianniszonia/taf-website` (owner: `gianniszonia`)
- **Visibility:** **private** — brand photos are used without written permission yet (see AGENTS.md). Do not make the
  repository public, enable GitHub Pages, or share it without the owner explicitly asking.
- **Default branch:** `main`

## What is (and isn't) in the repository

Committed: `content/` (the photos + JSON — the source of truth), `site/` source (HTML/CSS/JS, `data/content.js`,
`data/i18n.js`, logos), `scripts/`, docs, `package.json`, `package-lock.json`, `.claude/launch.json`.

Ignored by `.gitignore` (generated or installed — never commit them):
`node_modules/`, `site/img/brands/`, `site/img/inspiration/`, `site/data/catalog.js`.
After cloning, run `npm install && npm run build` to regenerate them.

## Prerequisites (check before doing anything)

```bash
git --version
gh --version
gh auth status          # must show: Logged in to github.com account gianniszonia, scopes include 'repo'
```

If `gh auth status` fails, **stop and ask the owner** to run `gh auth login` — never ask for, paste, or store a token.

Commits need an author identity. This repository is configured locally (not globally) with the owner's GitHub
noreply address, so the work email never appears in history:

```bash
git config user.name      # gianniszonia
git config user.email     # <id>+gianniszonia@users.noreply.github.com
```

If they are empty (e.g. a fresh clone), set them for this repository only:

```bash
git config user.name "gianniszonia"
git config user.email "$(gh api user --jq '"\(.id)+\(.login)@users.noreply.github.com"')"
```

## First-time publish (already done — for reference)

```bash
git init -b main
git add -A
git status                                  # review: no node_modules/, no site/img/brands|inspiration, no catalog.js
git commit -m "Initial commit: TAF website concept"
gh repo create taf-website --private --source . --remote origin --push \
  --description "Concept website for Takis Angelides Furnihome (TAF), Cyprus"
```

## Publishing changes (the normal workflow)

```bash
npm run build                               # make sure the site still builds (output is ignored, but errors matter)
git status                                  # see what changed
git add -A
git diff --cached --stat                    # sanity check: only intended files; nothing generated
git commit -m "<short summary of the change>"
git push
```

Rules for agents:

1. **Only commit and push when the owner asks** ("publish", "push", "commit"). Don't push on your own initiative.
2. Work on `main` only if the owner asked for a direct publish; for larger changes create a branch
   (`git switch -c <topic>`), push it (`git push -u origin <topic>`) and open a PR (`gh pr create --fill`) — then
   tell the owner the PR link.
3. Never force-push `main` (`git push --force`), rewrite published history, or delete the remote repository.
4. Never commit secrets, tokens, `.env` files, or `node_modules/`.
5. Commit messages: imperative, one-line summary (≤ 72 chars), optional body explaining *why*.
   If your tool requires an attribution trailer (e.g. `Co-Authored-By:`), add it at the end of the message.
6. Photos are large: keep single files well under GitHub's 100 MB limit (current photos are ≤ ~2 MB each).
   If `content/` ever grows past ~1 GB, discuss Git LFS with the owner before adding more.

## Checking the published state

```bash
gh repo view gianniszonia/taf-website --json name,visibility,defaultBranchRef,url
git log --oneline -5
git status -sb                              # "## main...origin/main" with no "ahead"/"behind" = in sync
```

## Getting the project on another machine

```bash
gh repo clone gianniszonia/taf-website
cd taf-website
npm install
npm run build
npm start                                   # http://localhost:5173
```

## Hosting the website later (not set up)

The site is static after `npm run build`. Hosting options when the owner wants it: GitHub Pages (needs a build
workflow, and a public repo or a paid plan for private Pages), Netlify, Vercel, Cloudflare Pages
(build command `npm run build`, publish directory `site`). Only after brand image permissions are sorted.
