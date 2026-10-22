# Stage 2 — Permissions & Ownership: why each lesson is correct

This is the "trust but verify" companion to Stage 2. You're learning
permissions precisely because you don't know them yet, so for every lesson
here is a plain-language note explaining *why* the behaviour the game teaches
is the real, standard Linux behaviour — grounded in how `chmod`, `chown`,
`chgrp`, and the sticky bit actually work (man-page level facts, not the
simulator's opinion). If the game ever disagrees with a real shell, the real
shell wins — but on everything below they agree.

First, the one mental model the whole stage rests on:

Every file and directory carries **three permission sets** — for the **owner**
(the user who owns it, "u"), the **group** that owns it ("g"), and **everyone
else** ("o", "others"). Each set has three bits: **read (r)**, **write (w)**,
and **execute (x)**. So a file's permissions are nine bits in a fixed order:
`rwx` for owner, then `rwx` for group, then `rwx` for others. That ordering —
owner, group, others, each r-w-x — is what makes the rest predictable.

---

## Lesson 10 — "Read the permissions" (`ls -l ~/server`)

**Objective:** List the files in `~/server` with full details.

`ls -l` ("long format") prints one line per entry, and the first ten
characters of that line are the permission string. Reading them left to right:

- **Character 1** is the *type*: `-` for a regular file, `d` for a directory,
  `l` for a symlink.
- **Characters 2–4** are the **owner's** r/w/x.
- **Characters 5–7** are the **group's** r/w/x.
- **Characters 8–10** are **others'** r/w/x.

A letter means the bit is on; a dash means it's off. So `-rw-r--r--` is a
regular file the owner can read and write, while the group and everyone else
can only read. After the permission string, `ls -l` also shows the link count,
the **owner name**, the **group name**, size, modification time, and name —
which is why this lesson comes first: you can't change ownership or permissions
sensibly until you can read the current state. This is exactly what real
`ls -l` prints, in exactly this column order.

---

## Lesson 11 — "Make it executable" (`chmod u+x ~/server/backup.sh`)

**Objective:** Give the owner execute permission on `~/server/backup.sh`.

This is `chmod`'s **symbolic mode**, which changes bits *relative* to what's
already there. The argument `u+x` has three parts:

- **`u`** — *who*: the user/owner. (The others are `g` group, `o` others,
  `a` all.)
- **`+`** — *how*: add this permission. (`-` removes, `=` sets exactly.)
- **`x`** — *which*: the execute bit.

So `u+x` means "turn on the owner's execute bit, leave every other bit
untouched." That last part is the key correctness point: `+` is additive, so
the group and others sets are unchanged. A shell script doesn't run with
`./backup.sh` until the execute bit is set — the file can be perfectly valid
and still refuse to run without it, which is the single most common "why won't
my script run?" gotcha. `chmod u+x script.sh` is the standard fix, and that's
what the lesson teaches.

---

## Lesson 12 — "Lock it down" (`chmod 640 ~/server/secrets.env`)

**Objective:** Set `~/server/secrets.env` to owner read/write, group read,
others none (640).

This is `chmod`'s **octal (numeric) mode**, which sets all nine bits at once
rather than nudging them. Each of the three digits describes one set — owner,
group, others — and each digit is the sum of its bits:

- **read = 4**, **write = 2**, **execute = 1**.

Add them up per set: `6 = 4+2` = read + write; `4` = read only; `0` = nothing.
So **`640`** = owner read+write, group read, others nothing — written out,
`rw-r-----`. Because octal mode is absolute, it *replaces* the whole
permission set — any bit not included is cleared, which is exactly why it's the
right tool for "lock it down": you don't have to know the current state, you
just declare the final state. `640` is the classic mode for a secrets/config
file: the owner can edit it, the owner's group can read it, and no one else can
touch it at all. The game computes these bits the same way a real kernel does.

---

## Lesson 13 — "Hand over ownership" (`chown maya ~/server/handover.md`)

**Objective:** Make `maya` the owner of `~/server/handover.md`.

`chown <user> <file>` changes **which user owns** the file. Ownership matters
because the owner is the "u" in every permission check — the owner's `rwx` set
is the one that applies to that user, independent of the group and others sets.
So transferring ownership to `maya` means maya is now governed by the owner
permissions, not the (usually more limited) others permissions. One real-world
caveat worth knowing: on a real system only **root** can give a file *away* to
another user (a normal user can't `chown` their file to someone else), because
otherwise you could dodge disk quotas or plant files under another identity.
The command form `chown maya handover.md` is exactly correct; the game lets you
run it to teach the concept. `chown` can also set the group at the same time
with `chown user:group file` — which is a natural bridge to the next lesson.

---

## Lesson 14 — "Share with the team" (`chgrp developers ~/server/project`)

**Objective:** Change the group of `~/server/project` to `developers`.

`chgrp <group> <path>` changes the **group that owns** the file or directory.
This is the backbone of team collaboration on Linux: put a shared folder under
a common group (here, `developers`), and everyone in that group is governed by
the **group** permission set rather than the "others" set. Combined with a
group-readable/writable mode, that's how a team shares files without making them
world-accessible. The command is correct as written, and it mirrors `chown`:
same idea, but it touches the group field instead of the owner field. (Under
the hood `chgrp developers project` is equivalent to `chown :developers
project`.) The lesson targets a directory on purpose — group ownership on a
shared directory is where this actually earns its keep.

---

## Lesson 15 — "The shared drop box" (`chmod +t ~/server/uploads`)

**Objective:** Add the sticky bit to `~/server/uploads`.

The **sticky bit** is a special permission that only matters on **directories**,
and it fixes a specific problem. Normally, whether you can delete a file
depends on your **write permission on the directory it lives in**, *not* on the
file itself. So in a world-writable shared folder, anyone who can add files can
also delete *everyone else's* files — exactly what you don't want in a drop box.

The sticky bit changes that rule: in a sticky directory, you can only delete or
rename a file if you **own that file** (or own the directory, or are root).
Everyone can still drop their own files in; nobody can clobber someone else's.
`chmod +t` sets it, and in `ls -l` it shows up as a **`t`** in the others'
execute position — e.g. `drwxrwxrwt`. The textbook real-world example is
`/tmp`, which is sticky for exactly this reason. The game renders the `t` in the
right spot and enforces the "add the bit" behaviour, matching real `chmod +t`.

---

### How to double-check any of this yourself

On any Linux machine (or this game's own shell), the fastest sanity check is:
run the command, then run `ls -l` and read the permission string against the
owner/group/others × r/w/x model at the top of this doc. If the ten characters
say what you expect, the behaviour is correct — and for the six lessons above,
they will.
