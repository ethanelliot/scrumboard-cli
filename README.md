# scrumboard-cli

CLI to log into, scrape, and sync the UC scrumboard into JSON for feeding into an AI.

It drives a real Chromium browser (via Playwright) using your logged-in session,
so it sees exactly what you'd see on the board.

## Install

```sh
npm install
npm run install-browser   # installs the Chromium build Playwright needs
```

Link it locally to get the `scrumboard` command on your PATH:

```sh
npm link
```

## Usage

### `scrumboard login`

Opens a browser window to the scrumboard login page and waits for you to
complete login (including any SSO/2FA). Once it detects a redirect away from
the login page, it saves your session to `~/.scrumboard-cli/session.json` for
later commands to reuse.

```sh
scrumboard login
```

### `scrumboard project [id]`

Gets or sets the active project ID, used to build the board URL for export.

```sh
scrumboard project 67      # set the active project
scrumboard project           # print the active project
```

> [!important]
> To find your project ID, open your project's board page. The URL will look something like `https://scrumboard.csse.canterbury.ac.nz/project/67/board` — the number before `/board` is the project ID.

### `scrumboard export`

Logs into the active project's board with your saved session and scrapes it
to JSON.

```sh
scrumboard export
scrumboard export -d -o exports/board.json
scrumboard export --headed
```

| Flag               | Description                                                                                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `-d, --details`    | Also open each story's detail modal to scrape its description and acceptance criteria. Without this flag, stories only include their name.                                |
| `-o, --out <path>` | Output location. A directory (auto-named `export-<timestamp>.json` inside it) or an exact path ending in `.json`. Falls back to `config.out`, then the current directory. |
| `--headed`         | Run the browser with a visible window instead of headless (useful for debugging).                                                                                         |

The export includes:

- **tasks** — every task card on the sprint board, with title, priority,
  complexity, time tracking, assignees, reviewers, and column status.
- **stories** — every story, with its name (and, with `--details`, its
  description and acceptance criteria).

## Config

Config is stored at `~/.scrumboard-cli/config.json` and can hold:

- `projectId` — the active project, set via `scrumboard project <id>`.
- `out` — a default output path for `scrumboard export`. There's no CLI
  command for this yet — set it by editing `~/.scrumboard-cli/config.json`
  directly, e.g. `{ "out": "exports/board.json" }`.

## Requirements

- Node.js >= 18
- A UC scrumboard account
