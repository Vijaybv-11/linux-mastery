import { describe, expect, test } from "vitest";
import { HOME, initialState, permission, runCommand, type FsNode } from "~/lib/shell";

describe("ls -l owner and group", () => {
  test("renders the node's real owner and group", () => {
    const state = initialState();
    state.fs[HOME + "/team.txt"] = {
      type: "file",
      mode: "644",
      owner: "maya",
      group: "developers",
      content: "shared\n",
    } as FsNode;
    const line = runCommand(state, "ls -l team.txt").output;
    expect(line).toContain("maya developers");
  });

  test("falls back to explorer explorer when ownership is missing", () => {
    const state = initialState();
    const line = runCommand(state, "ls -l Documents/welcome.txt").output;
    expect(line).toContain("explorer explorer");
  });

  test("ls records the option letters used", () => {
    const r = runCommand(initialState(), "ls -al");
    expect(r.event.options).toContain("a");
    expect(r.event.options).toContain("l");
  });
});

describe("permission() special bits", () => {
  test("setuid shows s when owner-exec is set, S when not", () => {
    // 4755: setuid, owner rwx → s
    expect(permission("4755")).toBe("rwsr-xr-x");
    // 4655: setuid, owner rw (no x) → S
    expect(permission("4655")).toBe("rwSr-xr-x");
  });

  test("setgid shows s/S in the group execute slot", () => {
    expect(permission("2755")).toBe("rwxr-sr-x"); // group has x → s
    expect(permission("2745")).toBe("rwxr-Sr-x"); // group rw-? 4=r, no x → S
  });

  test("sticky shows t/T in the others execute slot", () => {
    expect(permission("1777")).toBe("rwxrwxrwt"); // others x → t
    expect(permission("1776")).toBe("rwxrwxrwT"); // others rw, no x → T
  });

  test("three-digit modes render plain rwx", () => {
    expect(permission("644")).toBe("rw-r--r--");
    expect(permission("755")).toBe("rwxr-xr-x");
  });
});

const chmodMode = (startMode: string, spec: string): string => {
  const state = initialState();
  state.fs[HOME + "/f"] = { type: "file", mode: startMode, content: "x\n" } as FsNode;
  const r = runCommand(state, "chmod " + spec + " f");
  expect(r.ok, r.output).toBe(true);
  return r.state.fs[HOME + "/f"]!.mode;
};

describe("chmod symbolic", () => {
  test("u+x sets owner execute only", () => {
    expect(chmodMode("644", "u+x")).toBe("744");
  });
  test("g-w clears group write", () => {
    expect(chmodMode("664", "g-w")).toBe("644");
  });
  test("a=r sets exactly r--r--r--", () => {
    expect(chmodMode("755", "a=r")).toBe("444");
    expect(permission(chmodMode("755", "a=r"))).toBe("r--r--r--");
  });
  test("comma-separated clauses apply left to right", () => {
    // u+rw,g+r,o-rwx from 000 → u rw (6), g r (4), o 0
    expect(chmodMode("000", "u+rw,g+r,o-rwx")).toBe("640");
  });
  test("go-rwx clears group and others", () => {
    expect(chmodMode("777", "go-rwx")).toBe("700");
  });
  test("+x shortcut still works (equivalent to a+x)", () => {
    expect(chmodMode("644", "+x")).toBe("755");
  });
  test("invalid symbolic input errors", () => {
    const state = initialState();
    state.fs[HOME + "/f"] = { type: "file", mode: "644", content: "x\n" } as FsNode;
    const r = runCommand(state, "chmod u+z f");
    expect(r.ok).toBe(false);
    expect(r.output).toContain("invalid mode");
  });
});

describe("chmod octal and special nibble", () => {
  test("640 sets exact three-digit mode", () => {
    expect(chmodMode("755", "640")).toBe("640");
  });
  test("a three-digit mode clears any special nibble", () => {
    expect(chmodMode("1777", "755")).toBe("755");
  });
  test("1777 yields a 4-digit mode with the sticky nibble", () => {
    const mode = chmodMode("755", "1777");
    expect(mode).toBe("1777");
    expect(mode.length).toBe(4);
    expect(Number(mode[0]) & 1).toBe(1);
  });
  test("+t sets the sticky nibble", () => {
    const mode = chmodMode("755", "+t");
    expect(mode.length).toBe(4);
    expect(Number(mode[0]) & 1).toBe(1);
  });
  test("u+s and g+s set the special nibble", () => {
    expect(Number(chmodMode("755", "u+s")[0]) & 4).toBe(4);
    expect(Number(chmodMode("755", "g+s")[0]) & 2).toBe(2);
  });
  test("-t clears the sticky nibble", () => {
    expect(chmodMode("1777", "-t")).toBe("777");
  });
});

describe("chown", () => {
  const withFile = () => {
    const state = initialState();
    state.fs[HOME + "/f"] = { type: "file", mode: "644", content: "x\n" } as FsNode;
    return state;
  };
  test("chown user sets the owner", () => {
    const r = runCommand(withFile(), "chown maya f");
    expect(r.ok).toBe(true);
    expect(r.state.fs[HOME + "/f"]!.owner).toBe("maya");
  });
  test("chown user:group sets both", () => {
    const r = runCommand(withFile(), "chown explorer:developers f");
    expect(r.ok).toBe(true);
    expect(r.state.fs[HOME + "/f"]!.owner).toBe("explorer");
    expect(r.state.fs[HOME + "/f"]!.group).toBe("developers");
  });
  test("chown :group sets only the group", () => {
    const r = runCommand(withFile(), "chown :developers f");
    expect(r.ok).toBe(true);
    expect(r.state.fs[HOME + "/f"]!.group).toBe("developers");
    expect(r.state.fs[HOME + "/f"]!.owner).toBeUndefined();
  });
  test("invalid user errors", () => {
    const r = runCommand(withFile(), "chown nobody f");
    expect(r.ok).toBe(false);
    expect(r.output).toContain("invalid user");
  });
  test("invalid group errors", () => {
    const r = runCommand(withFile(), "chown maya:nogroup f");
    expect(r.ok).toBe(false);
    expect(r.output).toContain("invalid group");
  });
});

describe("chgrp", () => {
  const withFile = () => {
    const state = initialState();
    state.fs[HOME + "/f"] = { type: "file", mode: "644", content: "x\n" } as FsNode;
    return state;
  };
  test("chgrp group sets the group", () => {
    const r = runCommand(withFile(), "chgrp developers f");
    expect(r.ok).toBe(true);
    expect(r.state.fs[HOME + "/f"]!.group).toBe("developers");
  });
  test("invalid group errors", () => {
    const r = runCommand(withFile(), "chgrp nogroup f");
    expect(r.ok).toBe(false);
    expect(r.output).toContain("invalid group");
  });
});

describe("umask", () => {
  /** Set the mask, then create a file and a dir and return their resulting modes. */
  const modesAfter = (maskCmd: string) => {
    let state = initialState();
    const r = runCommand(state, maskCmd);
    expect(r.ok, r.output).toBe(true);
    state = r.state;
    const touched = runCommand(state, "touch new.txt");
    expect(touched.ok, touched.output).toBe(true);
    const made = runCommand(touched.state, "mkdir newdir");
    expect(made.ok, made.output).toBe(true);
    return {
      state: made.state,
      file: made.state.fs[HOME + "/new.txt"]!.mode,
      dir: made.state.fs[HOME + "/newdir"]!.mode,
    };
  };

  test("default (022) yields 644 files and 755 dirs", () => {
    // No umask set — the implicit default is 022.
    const r = modesAfter("umask 022");
    expect(r.file).toBe("644");
    expect(r.dir).toBe("755");
  });

  test("the implicit default with no umask command is also 644/755", () => {
    const state = initialState();
    const touched = runCommand(state, "touch a.txt");
    const made = runCommand(touched.state, "mkdir d");
    expect(made.state.fs[HOME + "/a.txt"]!.mode).toBe("644");
    expect(made.state.fs[HOME + "/d"]!.mode).toBe("755");
  });

  test("umask 077 yields 600 files and 700 dirs", () => {
    const r = modesAfter("umask 077");
    expect(r.file).toBe("600");
    expect(r.dir).toBe("700");
  });

  test("umask 027 yields 640 files and 750 dirs", () => {
    const r = modesAfter("umask 027");
    expect(r.file).toBe("640");
    expect(r.dir).toBe("750");
    expect(r.state.umask).toBe("027");
  });

  test("umask applies to echo-redirected new files too", () => {
    const set = runCommand(initialState(), "umask 027");
    const written = runCommand(set.state, 'echo "hi" > fresh.txt');
    expect(written.ok, written.output).toBe(true);
    expect(written.state.fs[HOME + "/fresh.txt"]!.mode).toBe("640");
  });

  test("umask with no argument reports the current mask (4 digits)", () => {
    expect(runCommand(initialState(), "umask").output).toBe("0022\n");
    const set = runCommand(initialState(), "umask 027");
    expect(runCommand(set.state, "umask").output).toBe("0027\n");
  });

  test("a leading-zero mask (0027) normalizes to 027", () => {
    const r = runCommand(initialState(), "umask 0027");
    expect(r.ok).toBe(true);
    expect(r.state.umask).toBe("027");
  });

  test("an invalid mask errors", () => {
    const r = runCommand(initialState(), "umask 8");
    expect(r.ok).toBe(false);
    expect(r.output).toContain("invalid mask");
  });
});
