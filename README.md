<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/e8-editor/e8/main/docs/assets/banner-ports-dark.png">
  <img alt="E8 package ports" src="https://raw.githubusercontent.com/e8-editor/e8/main/docs/assets/banner-ports-light.png">
</picture>

Part of the [E8 package ports](https://github.com/e8-editor/e8#packages): Emacs packages ported to [E8](https://github.com/e8-editor/e8) and maintained with it. This is a port of [Casual](https://github.com/kickingvegas/casual) 2.9.0 by Charles Choi. The design and the original code are theirs; the port keeps upstream's licence, the GNU General Public License version 3 or later.

# e8-casual

Casual's keyboard menu for Dired, for [E8](https://github.com/e8-editor/e8): `casual-dired-tmenu` shows Dired's commands in a transient menu below the Dired window, grouped by what they act on, with menus of their own for sorting, links, changing files, marking by regexp, utilities, searching and settings.

Upstream Casual has menus for many of Emacs's modes (Calc, Info, Org agenda, I-search, Bookmarks and more). This port has only its Dired menu.

## Installing

In `~/.config/e8/init.ts`:

```ts
e8.usePackage("e8-editor/e8-casual");
e8.defineKey("dired-mode-map", "?", "casual-dired-tmenu");
```

E8 installs it at its newest version tag into `repos/` beside `init.ts`, records the commit in `e8-lock.json`, and requires `casual`, which loads the Dired menu. `M-x package-vc-upgrade` brings it up to date. Pin a version with `{ rev: "v0.1.0" }`. It needs E8 0.3.1 or newer.

The "Sort By" menu is shown only where `ls` is GNU's, which Casual reads from `dired-use-ls-dired`. E8 does not set that variable, so set it yourself if your `ls` is GNU's:

```ts
e8.setVariable("dired-use-ls-dired", true);
```

## Using it

`?` (or `M-x casual-dired-tmenu`) in a Dired buffer opens the menu. Each key in it runs the Dired command beside it: some leave the menu, others, such as marking and moving, keep it open so that you can go on. A label ending in `›` opens another menu; `…` means the command asks for something.

- `C-g` goes back to the menu before, or closes the menu at the top.
- `C-q` closes every menu at once.
- A key the menu does not have is refused, and the menu stays.
- `,` opens the settings menu, which shows the Dired and Casual variables that matter here.

Variables:

- `casual-lib-use-unicode`: `true` for symbols (arrows, folders) in the labels instead of words.
- `casual-lib-hide-navigation`: `true` to leave out the `C-g` and `C-q` entries.
- `casual-dired-listing-switches`: the `ls` switches the "Sort By" menu starts with; `-l` is always added.

## Differences from Casual

- Only the Dired menus are ported, from `casual-dired.el` and its `-utils`, `-sort-by`, `-settings` and `-variables` files, with what they use of `casual-lib.el`.
- The menu shows every entry Casual's does, but E8 does not have all the commands behind them yet. These say "No such command" when chosen: inserted subdirectories (`i`, `$`, `[`, `]`, `M-j`), filtering by name (`f`, which needs `find-lisp-find-dired`), `ls` sorting (`dired-sort-other`, so the "Sort By" menu's sorts), isearch in file names and in marked files, `dired-do-search`, finding and replacing by regexp in marked files, `rgrep`, `ibuffer`, adding a bookmark without overwriting, browsing a file's URL, image-dired, and the Emacs Lisp menu's byte-compiling, loading and checkdoc.
- E8 has no Customize: the settings menu's entries describe the variable instead of opening it to change.
- `casual-dired-use-unicode-symbols`, which Casual keeps for older configurations, is not defined: use `casual-lib-use-unicode`.
- Casual is built on transient.el; this port is built on the transient E8 ships, which has the core of transient 0.10 but cannot save a menu's values, and has no `?` help.

## Credit

Casual 2.9.0 is copyright Charles Y. Choi and distributed in MELPA, under the GNU General Public License version 3 or later. This port is not the upstream authors' work as published, and they do not endorse it: report problems with the port here, not upstream.

## Developing

With an E8 on your PATH (a [release](https://github.com/e8-editor/e8/releases), or built from source) and TypeScript 5.8 or newer:

```bash
make test
make types
```

The tests in `test/casual-tests.ts` check that requiring `casual` gives the Dired menu; that the menu shows character for character as Casual 2.9.0's does in Emacs 30 with transient 0.10; that a sub-menu goes back with `C-g` and `C-q` leaves them all, giving Dired its keys back; that a suffix that stays runs and the menu shows its effect; that a key the menu does not have is refused; and, with a small menu of their own, that switches and options are the arguments a suffix reads.

## Licence

GPL-3.0-or-later: see `LICENSE`.
