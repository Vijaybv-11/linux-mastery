# 🗺️ Linux Mastery Roadmap

The full learning path, from your first `pwd` to compiling your own software. There are four tiers and fifteen stages, and Maya's story continues through all of them.

| Legend | Meaning |
| ------ | ------- |
| ✅ | Shipped |
| 🛠️ | Planned |
| `~N` | Estimated number of missions |

---

## 🟢 Beginner

### Stage 1: Navigation & Files ✅ (10 missions)

`pwd` · `ls` · `cd` · `mkdir` · `touch` · `echo` · `>` / `>>` · `cat` · `cp` · `mv` · `rm` · `rmdir` · `head` · `tail` · `wc` · `grep` · `find` · `chmod` (intro)

**Story:** your first day on the team. Maya shows you around the machine.

---

## 🟡 Intermediate

> **Maya's arc: "The Shared Server"**
> Maya is setting up a shared project server for the team. You help her lock down permissions, wire up log processing, keep long jobs running, install the team's tooling, and archive the old project before migration day.

### Stage 2: Permissions & Ownership 🛠️ (~4–5 missions)
`chmod` (symbolic and octal) · `chown` · `chgrp` · `umask` · sticky bit · SUID / SGID

### Stage 3: Pipes, Redirects & Text Processing 🛠️ (~5–6 missions)
`|` · `>` · `>>` · `<` · `2>` · `2>&1` · `grep` · `sed` · `awk` · `sort` · `uniq` · `cut` · `wc` · `tr` · `head` · `tail`

### Stage 4: Process Management 🛠️ (~4–5 missions)
`ps` · `top` · `htop` · `kill` · `killall` · `jobs` · `bg` · `fg` · `nohup` · `&` · signals (`SIGTERM`, `SIGKILL`, `SIGHUP`, `SIGINT`)

### Stage 5: Package Management & Environment 🛠️ (~3–4 missions)
`apt` / `dnf` / `yum` / `pacman` / `zypper` · `.bashrc` · `.profile` · `export` · `PATH` · `alias` · `source` · `env`

> First use of `sudo`: installing packages needs root, so this stage introduces `sudo apt install …`. The full treatment of `sudo` is in Stage 9.

### Stage 6: Finding & Archiving 🛠️ (~3–4 missions)
`find` (advanced) · `locate` · `which` · `whereis` · `xargs` · `tar` · `gzip` · `zip` / `unzip` · `rsync`

---

## 🔵 Advanced

> **Maya's arc: "Under Attack"**
> Someone is hammering Maya's server. You trace connections across the network, write scripts that detect and block the attacker, harden user accounts, and schedule cron jobs that watch for a second wave.

### Stage 7: Shell Scripting 🛠️ (~6–8 missions)
Variables · quoting · `if` / `else` · `case` · `for` / `while` · functions · exit codes · `$?` · arrays · `getopts` · `set -euo pipefail`

### Stage 8: Networking 🛠️ (~5–6 missions)
`ssh` · `scp` · `curl` · `wget` · `ip` · `ss` · `ping` · `traceroute` · `dig` · `nc` (netcat)

### Stage 9: System Administration 🛠️ (~5–6 missions)
**`sudo`** · `su` · `useradd` · `usermod` · `userdel` · `passwd` · `groups` · `systemctl` · `journalctl` · `cron` / `crontab`

> ### 🔑 `sudo` coverage
> `sudo` appears throughout the path, building up step by step:
> 1. **Stage 5:** first contact. Why `apt install` fails without root, and how `sudo` fixes it.
> 2. **Stage 9 (dedicated mission):** `sudo` vs `su`, `sudo -i` / `sudo -u <user>`, the `sudo` / `wheel` groups, reading `/etc/sudoers` safely with `visudo`, and auditing who ran what in the auth log.
> 3. **Stage 12:** `sudo` hardening. Least-privilege rules in `/etc/sudoers.d/`, `NOPASSWD` pitfalls, command allow-lists, and logging.
>
> The simulator never needs a real root password. Missions model privilege errors (`Permission denied`) and their fixes in a sandbox.

### Stage 10: Disk & Storage 🛠️ (~4–5 missions)
`df` · `du` · `mount` / `umount` · `lsblk` · `fdisk` · `mkfs` · `/etc/fstab` · swap · LVM basics (`pvcreate`, `vgcreate`, `lvcreate`)

---

## 🔴 Expert

> **Maya's arc: "The 3 a.m. Outage"**
> Production is down and Maya is paged. You read kernel logs, profile the runaway process, dig through `/proc`, rebuild the broken component from source, and ship the fix in a container.

### Stage 11: Regex & Advanced Text 🛠️ (~4–5 missions)
Extended regex (`grep -E`) · PCRE and lookahead (`grep -P`) · multi-line `sed` · `awk` programs · `jq` for JSON

### Stage 12: Security & Hardening 🛠️ (~5–6 missions)
`iptables` / `nftables` · `ufw` / `firewalld` · SSH keys and `sshd_config` · `fail2ban` · SELinux / AppArmor · `gpg` · **`sudo` hardening**

### Stage 13: Performance & Debugging 🛠️ (~4–5 missions)
`strace` · `ltrace` · `perf` · `vmstat` · `iostat` · `sar` · `/proc` · `/sys`

### Stage 14: Kernel & Containers 🛠️ (~5–6 missions)
`dmesg` · `sysctl` · `modprobe` / `lsmod` · namespaces (`unshare`) · cgroups · `chroot` · Docker basics

### Stage 15: Building & Compiling 🛠️ (~3–4 missions)
`gcc` · `make` / Makefiles · `./configure` · `pkg-config` · shared libraries (`ldd`, `ldconfig`) · `LD_LIBRARY_PATH`

---

## 🐧 Distro differences

Linux comes in many flavors. The core commands (`ls`, `grep`, `chmod`, `ssh`…) are the same everywhere, but some areas differ by distribution.

| Area | Debian / Ubuntu | Arch | Fedora / RHEL | openSUSE |
| ---- | --------------- | ---- | ------------- | -------- |
| Install a package | `sudo apt install htop` | `sudo pacman -S htop` | `sudo dnf install htop` | `sudo zypper install htop` |
| Update everything | `sudo apt update && sudo apt upgrade` | `sudo pacman -Syu` | `sudo dnf upgrade` | `sudo zypper update` |
| Remove a package | `sudo apt remove htop` | `sudo pacman -R htop` | `sudo dnf remove htop` | `sudo zypper remove htop` |
| Search packages | `apt search htop` | `pacman -Ss htop` | `dnf search htop` | `zypper search htop` |
| Low-level package tool | `dpkg` | `pacman` | `rpm` | `rpm` |
| Admin group for `sudo` | `sudo` | `wheel` | `wheel` | `wheel` |
| Firewall front-end | `ufw` | `nftables` / `ufw` | `firewalld` | `firewalld` |
| Mandatory access control | AppArmor | none by default | SELinux | AppArmor |

**Service managers.** Most modern distros use **systemd** (`systemctl`, `journalctl`). Some, such as Alpine, Gentoo and Artix, use **OpenRC** (`rc-service`, `rc-update`). Stage 9 teaches systemd first and adds an OpenRC side-note.

**Config locations can vary.** Examples: network config (`/etc/netplan/` on Ubuntu, NetworkManager on Fedora and Arch), default shell rc files, and where `sudoers` drop-ins and repositories live (`/etc/apt/sources.list.d/` vs `/etc/yum.repos.d/` vs `/etc/pacman.conf`).

### How the platform handles it

- **Distro callouts in missions.** Whenever a command differs between distros, the mission shows a callout box:
  > 🟠 **On Ubuntu:** `sudo apt install nginx`
  > 🔵 **On Arch:** `sudo pacman -S nginx`
  > 🔴 **On Fedora:** `sudo dnf install nginx`
- **Distro selector (planned).** A setting in the header lets you choose Ubuntu, Arch or Fedora. The simulator then accepts that distro's commands, and the hints and the Field Guide show them first.
- **Side-by-side Field Guide.** Package-manager, service and firewall entries list the equivalents for each distro.
- **Neutral by default.** Mission checks accept any valid distro variant, so `apt install` and `pacman -S` both complete a "install htop" objective.

---

## 📊 At a glance

| Tier | Stages | Est. missions | Maya's arc |
| ---- | ------ | ------------- | ---------- |
| 🟢 Beginner | 1 | 10 ✅ | First day on the team |
| 🟡 Intermediate | 2–6 | ~19–24 | The Shared Server |
| 🔵 Advanced | 7–10 | ~20–25 | Under Attack |
| 🔴 Expert | 11–15 | ~21–26 | The 3 a.m. Outage |
| **Total** | **15** | **~70–85** | |

Want to help build a stage? See [Adding a mission](./README.md#adding-a-mission) in the README.
