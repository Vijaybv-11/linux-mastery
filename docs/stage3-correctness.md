# Stage 3 — Pipes & text: why each lesson is correct

This is the "trust but verify" companion to Stage 3, in the same spirit as the
[Stage 2 notes](./stage2-correctness.md). Every command output in this stage is also checked
automatically: [`src/test/gnu-parity.test.ts`](../src/test/gnu-parity.test.ts) runs the same
commands through bash and GNU coreutils (in the C locale) and requires byte-identical output. If
the game and a real shell ever disagree, that test fails and the real shell wins.

The one mental model the whole stage rests on:

Every command has an **input** (stdin) and an **output** (stdout). Normally stdout goes to your
terminal. The pipe `|` connects the stdout of the command on its left to the stdin of the command
on its right, so small single-purpose tools can be chained into one pipeline. Filters such as
`grep`, `cut`, `sort`, `uniq`, `head` and `wc` read stdin whenever you don't give them a file name.

---

## Lesson 18 — "Your first pipe" (`cat access.log | wc -l`)

`cat` prints the file to stdout, and the pipe hands that text to `wc -l`, which counts newline
characters. When `wc` reads stdin instead of a named file, it prints the number **without** a file
name (`14`, not `14 access.log`). That is real `wc` behaviour, and it's why counts from pipelines are
easy to use in scripts. (Experienced users often write `wc -l < access.log` or `wc -l access.log`;
this lesson uses `cat` to make the flow of data visible.)

## Lesson 19 — "Filter, then count" (`grep 404 access.log | wc -l`)

`grep` prints only the lines that match its pattern, so the pipeline counts matching lines. The
pattern `404` matches anywhere in the line; the log was written so that only the status field
contains `404`. On real logs, a tighter pattern like `' 404 '` avoids false matches (a 4040-byte
response, say). `grep -v` inverts the match, and `grep -c` would also count, but the lesson is about
combining tools.

**Basic regular expressions.** `grep` patterns are *basic* regular expressions (BRE). In a BRE,
`|`, `+`, `?`, `(`, `)`, `{` and `}` are ordinary characters, so `grep 'GET|POST'` looks for the
literal text `GET|POST`. GNU grep makes them special when backslashed (`'GET\|POST'`), and
`grep -E` switches to extended regexes where they're special by default. The practice shell follows
the BRE rules.

## Lesson 20 — "Slice out a column" (`cut -d " " -f 1 access.log`)

`cut -d` sets a single-character delimiter, and `-f` picks fields numbered from 1. The space must be
quoted (`" "` or `' '`) or the shell would treat it as the gap between arguments. Field lists can be
`1,3` (those fields), `2-4` (a range), `3-` (from 3 to the end), or `-2` (up to 2), and fields are
always printed in their original order. A line that contains no delimiter at all is printed
unchanged; that's GNU `cut`'s default (`-s` would suppress it). Without `-d`, the delimiter is a TAB.

## Lesson 21 — "Sort and squash" (`… | sort | uniq -c`)

`uniq` only compares each line with the one **directly before it**, so it collapses runs of
identical lines rather than all duplicates. That's why you `sort` first: sorting puts identical
lines next to each other. `uniq -c` prefixes each line with its count, right-aligned in a 7-character
column (`      6 203.0.113.9`), exactly as GNU `uniq` does.

**Sort order.** The practice shell sorts by byte value, like `LC_ALL=C sort`: digits come before
uppercase letters, which come before lowercase. Your own machine may use a language-aware locale
that orders some punctuation and letter case differently. For this lesson's IP addresses the result
is the same.

## Lesson 22 — "Find the top talker" (`… | sort -rn | head -n 1`)

`sort -n` compares the leading number on each line (leading blanks allowed), so `10` sorts after
`9`. A plain `sort` compares text, which would put `10` before `9`. Lines with no leading number
count as 0. When two lines have the same number, GNU sort falls back to comparing the whole line,
and `-r` reverses that fallback too. The practice shell follows the same rule, so ties come out in
the same order as on Linux. `head -n 1` (or the older `head -1`) keeps the first line. With
`sort -u`, GNU skips the whole-line fallback and keeps the **first** input line of each group of equal
keys, and the shell does the same.

## Lesson 23 — "File the report" (`grep ERROR app.log | sort | uniq -c > ~/server/report.txt`)

A redirect applies to the command it's attached to, which in a pipeline is the last one. So the
finished summary goes into the file and nothing is printed. `>>` would append instead. The
mission accepts the summary in any line order, so adding `| sort -rn` before the redirect is fine.

---

## Where the practice shell is simpler than bash

- **Subshells.** Each command in a real pipeline runs in its own subshell, so `cd dir | cat` doesn't
  change your directory and `umask 077 | cat` doesn't change your umask. The practice shell does the
  same. File changes such as `touch` still happen, as they do in bash.
- **Errors.** If any command in a pipeline fails (a missing file, an unknown option), the practice
  shell reports the error and undoes the whole line. Bash would print the error and keep running the
  other commands with empty input.
- **Not yet supported:** `<`, `2>`, `2>&1`, `;`, `&&`, `||`, `tr`, `sed`, `awk`, `grep -E`, and
  `sort -k`. These are planned for later stages.
- **Quoting.** Inside double quotes a backslash only escapes `$`, `` ` ``, `"`, and `\`, so
  `"GET\|POST"` reaches grep as `GET\|POST`, as in bash.
