// SPDX-License-Identifier: GPL-3.0-or-later
//
// Casual's tests, with ERT: Casual's Dired menu shows character for
// character as Casual 2.9.0's casual-dired-tmenu does in Emacs 30 with
// transient 0.10, its sub-menus go back with C-g and C-q leaves them all, a
// suffix that stays runs and the menu shows its effect, and a key no suffix
// has is refused. `make test` runs them in e8 --batch, as CI does.

import { ertDeftest, should, shouldEqual } from "ert";
import { transientArgs, transientDefinePrefix } from "transient";

const MENU = " *transient*";

/** A Dired buffer on a new directory holding a.txt and b.txt, with Casual loaded. */
function setup(): string {
  e8.require("casual");
  const dir = e8.makeTempFile("casual-tests", { dir: true });
  for (const f of ["a.txt", "b.txt"]) e8.writeRegion("", null, e8.fileNameConcat(dir, f), { quiet: true });
  e8.call("dired", dir);
  // As on a Mac with GNU ls, where Emacs shows the Sort By menu.
  e8.setVariable("dired-use-ls-dired", true);
  return dir;
}

/** Leaves the menus, if any are still open, and deletes the directory. */
function teardown(dir: string): void {
  if (e8.getBuffer(MENU) !== undefined) e8.executeKbdMacro("C-q");
  const dired = e8.bufferName();
  if (e8.derivedModeP("dired-mode")) e8.call("kill-buffer", dired);
  e8.deleteDirectory(dir, { recursive: true });
}

/** Runs `body` on a Dired buffer, cleaning up after it even when it fails. */
function inDired(body: (dir: string) => void): void {
  const dir = setup();
  try {
    body(dir);
  } finally {
    teardown(dir);
  }
}

/** The menu's text, as its buffer holds it, or undefined when no menu is shown. */
function menu(): string | undefined {
  if (e8.getBuffer(MENU) === undefined) return undefined;
  return e8.withCurrentBuffer(MENU, () => e8.bufferSubstringNoProperties(e8.pointMin(), e8.pointMax()));
}

const lastMessage = (): string | undefined => e8.messages().at(-1);

// casual-dired-tmenu as Emacs 30 shows it, with transient 0.10 and Casual 2.9.0.
// The \u0020s are spaces Emacs leaves at the ends of those lines.
const MAIN = `\
File           Directory               Mark                  Navigation
 o Open Other   s Sort By›              m Mark                ^   .. Dir
 v View         h [ ] Hide Details      u Unmark              p   Up File
 C Copy to…     O [ ] Omit Mode         U Unmark All          n   Down File
 R Rename…      i Insert Subdir         t Toggle Marks        M-p Up Dir
 D Delete…      $ Hide/Unhide Subdir    ~ Flag Backups        M-n Down Dir
 l Link›        k Kill (Hide) Line(s)   x Delete Flagged      [   Up Subdir
 c Change›      g Revert                r Regexp›             ]   Down Subdir
 y Type         f Filter by name…       # Utils›              j   Goto File…
 w Copy Name    E Edit (wdired)         / Search & Replace›   M-j Goto Subdir…
 ! Shell…       d Dired…
 & Shell &…\u0020
 W Browse

Quick                 Search                       New
 J Jump to Bookmark…   C-s I-Search…                + Directory
 B Add Bookmark…       M-s I-Search Regexp…         F File
 b List Buffers        M-f Find in files (rgrep)…

 C-g Dismiss    RET Open    , Settings›    q Quit Dired\u0020\u0020\u0020
`;

// casual-dired-link-tmenu, opened from the menu above, as Emacs shows it.
const LINK = `\
Link
Symbolic             Relative             Hard
 s Absolute…          r Relative…          h Hard…
 S Absolute regexp…   R Relative regexp…   H Hard regexp…

 C-g ‹Back    C-q Dismiss\u0020\u0020\u0020
`;

ertDeftest("casual-requiring-casual-gives-the-dired-menu", () => {
  e8.require("casual");
  should(e8.commandExists("casual-dired-tmenu"), "casual-dired-tmenu is a command");
  for (const v of ["casual-lib-use-unicode", "casual-lib-hide-navigation", "casual-dired-listing-switches"])
    should(e8.variableDocumentation(v) !== undefined, `${v} is defined`);
});

ertDeftest("casual-the-dired-menu-shows-as-in-emacs", () => {
  inDired(() => {
    const dired = e8.bufferName();
    e8.call("casual-dired-tmenu" as e8.CommandName);
    shouldEqual(menu(), MAIN);
    // The menu's window is below; the Dired window stays selected.
    shouldEqual(e8.bufferName(), dired);
    should(e8.windowList().some((w) => e8.windowBuffer(w) === MENU), "the menu is in a window");
  });
});

ertDeftest("casual-a-sub-menu-goes-back-with-c-g-and-c-q-leaves-them-all", () => {
  inDired(() => {
    e8.call("casual-dired-tmenu" as e8.CommandName);
    e8.executeKbdMacro("l");
    shouldEqual(menu(), LINK);
    e8.executeKbdMacro("C-g");
    shouldEqual(menu(), MAIN);
    e8.executeKbdMacro("l C-q");
    shouldEqual(menu(), undefined);
    // The keys are Dired's again: n moves to the next line, saying nothing.
    const line = e8.lineOf(e8.point());
    const said = e8.messages().length;
    e8.executeKbdMacro("n");
    shouldEqual(e8.lineOf(e8.point()), line + 1);
    shouldEqual(e8.messages().length, said);
  });
});

ertDeftest("casual-a-suffix-that-stays-runs-and-the-menu-shows-its-effect", () => {
  inDired(() => {
    e8.call("casual-dired-tmenu" as e8.CommandName);
    // m marks the file and stays.
    e8.executeKbdMacro("n m");
    should(e8.bufferSubstringNoProperties(e8.pointMin(), e8.pointMax()).includes("\n* "), "a file is marked");
    should(menu() !== undefined, "the menu stays");
    // The description of h follows the mode.
    e8.executeKbdMacro("h");
    should(menu()!.includes(" h [x] Hide Details"), "h shows the mode on");
    e8.executeKbdMacro("C-g");
    shouldEqual(menu(), undefined);
  });
});

ertDeftest("casual-a-key-no-suffix-has-is-refused", () => {
  inDired(() => {
    e8.call("casual-dired-tmenu" as e8.CommandName);
    e8.executeKbdMacro("z");
    shouldEqual(lastMessage(), "Unbound suffix: `z' (Use `C-g' to abort, `?' for help)");
    shouldEqual(menu(), MAIN);
  });
});

// A small menu of switches and an option of its own, as a package would define it.
function defineArgsMenu(): void {
  const show = e8.defineCommand({ name: "show-args", run: () => e8.message(JSON.stringify(transientArgs("args-menu"))) });
  transientDefinePrefix("args-menu", {
    value: ["--all"],
    groups: [
      { description: "Arguments", items: [["-a", "All", "--all"], ["-v", "Verbose", "--verbose"], ["=a", "Author", "--author="]] },
      { description: "Actions", items: [["s", "Show", show]] },
    ],
  });
}

ertDeftest("casual-switches-and-options-are-the-arguments-a-suffix-reads", () => {
  inDired(() => {
    defineArgsMenu();
    e8.call("args-menu" as e8.CommandName);
    shouldEqual(menu(), "Arguments\n -a All (--all)\n -v Verbose (--verbose)\n =a Author (--author=)\n\nActions\n s Show\n");
    e8.executeKbdMacro("- v - a = a M i n a RET s");
    shouldEqual(lastMessage(), '["--verbose","--author=Mina"]');
    shouldEqual(menu(), undefined);
  });
});
