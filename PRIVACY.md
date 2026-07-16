# WebShell — Privacy Policy

*Last updated: July 14, 2026*

## The short version

The free WebShell extension does not collect, store, transmit or sell any user
data. Period. The optional paid upgrade (WebShell Pro) uses the minimum needed
to sell and operate it — see "WebShell Pro" below and the full policy at
https://web-shell.app/privacy.html.

## Details

- **Everything runs locally.** All commands you run (extracting data, modifying
  pages, watching for changes) execute entirely inside your browser, on your
  machine. WebShell has no servers and makes no network requests of its own.
- **No data leaves your device.** Data extracted from webpages (CSV/JSON files)
  is saved directly to your computer through your browser's download mechanism.
  Nothing is uploaded anywhere.
- **No tracking.** WebShell contains no analytics, telemetry, advertising or
  third-party code of any kind.
- **No account.** WebShell requires no sign-up, login or personal information.
- **Permissions explained:**
  - *Host access / scripting* — used solely to inject the terminal interface
    into the page where you invoke it (icon or keyboard shortcut).
  - *Notifications* — used solely to show desktop alerts created by your own
    `watch` commands.
  - *Storage* — used solely to keep your preferences in your browser's local
    extension storage.

## WebShell Pro (optional paid features)

Only if you buy WebShell Pro:

- **Payments** are processed by Paddle (merchant of record) under Paddle's
  privacy policy; we never see card details. We receive your **email address**
  and subscription status.
- **Your license** is a signed token (email + plan) stored in your browser —
  including the browser's own sync storage — and sent to our servers to
  validate Pro access and renew itself.
- **The `ssh` relay** carries sessions **end-to-end encrypted** (the SSH
  encryption happens in your browser): the relay cannot read passwords, keys
  or session content. Operational logs keep connection metadata only
  (destination host:port, license email, timestamps), briefly, for
  reliability and abuse prevention.
- No analytics, no ads, no selling of data — same as the free extension.

## Changes

If this policy ever changes, the update will be published in this repository
and reflected in the "Last updated" date above.

## Contact

Questions: open an issue at
https://github.com/juanma-dev/webshell-extension/issues
or email support@web-shell.app
