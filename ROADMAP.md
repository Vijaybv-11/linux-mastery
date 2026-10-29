# 🗺️ Roadmap

Linux Mastery has twenty-three missions across five stages today (*Find your way*, *Make it
yours*, *Work with files*, *Lock it down*, *Pipes & text*). This is where the project is headed next.

## Status

| Status     | Item                                                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------------------ |
| ✅ Shipped  | **Pipes & text** stage — six missions chaining `\|` with `grep`, `cut`, `sort`, `uniq`, `wc`, and `head`       |
| 🔜 Next     | **Difficulty tiers** — a Beginner / Intermediate / Advanced split so the path scales with you, like GitMastery |
| 🃏 Planned  | **Concept visualization cards** — interactive cards that show how each command reshapes the filesystem and permissions |
| 🌐 Planned  | **Live hosting** — a temporary preview first, then a permanent home once traffic justifies it                |

## Notes

- **Pipes & text** — Maya's shared server gets busy, and you work through its logs: count requests,
  filter 404s, cut out IP addresses, tally them with `sort | uniq -c`, find the top visitor with
  `sort -rn | head`, and save an error summary with `>`. Output is checked byte-for-byte against GNU
  coreutils (see [docs/stage3-correctness.md](./docs/stage3-correctness.md)). Still to come for text
  processing: `<`, `2>`, `2>&1`, `tr`, `sed`, and `awk`.

- **Difficulty tiers** — GitMastery splits its path into Beginner / Intermediate / Advanced. We're
  in the Beginner tier now; the split lets later tiers assume prior commands and move faster.
- **Concept visualization cards** — GitMastery pairs each concept with an interactive card that
  visualizes what the command does. The Linux equivalent would animate how a command reshapes the
  filesystem tree or a file's permission bits.

Ideas and new missions are welcome — see [Contributing](./README.md#contributing).
