# 🗺️ Roadmap

Linux Mastery has twenty-three missions across five stages today, split into difficulty tiers:
**Beginner** (*Find your way*, *Make it yours*, *Work with files*) and **Intermediate** (*Lock it
down*, *Pipes & text*). This is where the project is headed next.

## Status

| Status     | Item                                                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------------------ |
| ✅ Shipped  | **Pipes & text** stage — six missions chaining `\|` with `grep`, `cut`, `sort`, `uniq`, `wc`, and `head`       |
| ✅ Shipped  | **Difficulty tiers** — a Beginner / Intermediate / Advanced split so the path scales with you, like GitMastery |
| 🔜 Next     | **Advanced tier: Streams & scripts** — `<`, `2>`, `2>&1`, `sed`, `awk`, and chaining with `;` / `&&`          |
| 🃏 Planned  | **Concept visualization cards** — interactive cards that show how each command reshapes the filesystem and permissions |
| 🌐 Planned  | **Live hosting** — a temporary preview first, then a permanent home once traffic justifies it                |

## Notes

- **Pipes & text** — Maya's shared server gets busy, and you work through its logs: count requests,
  filter 404s, cut out IP addresses, tally them with `sort | uniq -c`, find the top visitor with
  `sort -rn | head`, and save an error summary with `>`. Output is checked byte-for-byte against GNU
  coreutils (see [docs/stage3-correctness.md](./docs/stage3-correctness.md)). `tr` is now available
  in pipelines (translate, `-d` delete, `-s` squeeze, ranges and `[:lower:]`/`[:upper:]` classes), also
  checked against GNU coreutils. Still to come for text processing: `<`, `2>`, `2>&1`, `sed`, and `awk`.

- **Difficulty tiers** — like GitMastery, the path is split into Beginner / Intermediate / Advanced.
  Pick a tier on the home page; the journey, the "Continue" button and the next-mission pointer follow
  it, and the choice is remembered in the browser. Beginner is missions 1–10, Intermediate is 11–23,
  and Advanced is shown as *coming soon*. The first mission of every tier is always open, so players
  who know the basics can skip ahead; missions inside a tier still unlock one at a time.
- **Advanced tier: Streams & scripts** — the next stage: input and error redirection (`<`, `2>`,
  `2>&1`), `sed` and `awk`, and command lists with `;`, `&&`, and `||`.
- **Concept visualization cards** — GitMastery pairs each concept with an interactive card that
  visualizes what the command does. The Linux equivalent would animate how a command reshapes the
  filesystem tree or a file's permission bits.

Ideas and new missions are welcome — see [Contributing](./README.md#contributing).
