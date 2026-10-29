import { HOME, type ShellEvent, type ShellState } from "./shell";

/** Compare command output loosely: trim each line and collapse runs of spaces (uniq -c pads its counts). */
const tidy = (text = "") =>
  text
    .trim()
    .split("\n")
    .map((l) => l.trim().replace(/\s+/g, " "))
    .join("\n");
const piped = (e: ShellEvent, ...commands: string[]) =>
  (e.pipeline?.length ?? 0) > 1 && commands.every((c) => e.pipeline!.includes(c));

const VISITOR_IPS = [
  "10.0.0.5", "203.0.113.9", "198.51.100.4", "203.0.113.9", "10.0.0.5", "203.0.113.9", "192.0.2.17",
  "203.0.113.9", "198.51.100.4", "203.0.113.9", "10.0.0.5", "203.0.113.9", "192.0.2.17", "198.51.100.4",
].join("\n");
const VISITS_PER_IP = "3 10.0.0.5\n2 192.0.2.17\n3 198.51.100.4\n6 203.0.113.9";
const ERROR_REPORT = [
  "3 ERROR db: connection refused",
  "1 ERROR disk: quota exceeded",
  "2 ERROR login: too many attempts from 203.0.113.9",
];

export interface Scenario {
  title: string;
  setting: string;
  story: string;
  useCase: string;
}
export interface Lesson {
  scenario: Scenario;
  title: string;
  short: string;
  command: string;
  description: string;
  objective: string;
  /** Trusted HTML (only <code> tags) authored in this file. */
  concept: string;
  hints: [string, string];
  xp: number;
  check: (state: ShellState, event: ShellEvent) => boolean;
  success: string;
}

export const lessons: Lesson[] = [
  {
    scenario: {
      title: "Your first day at the prompt",
      setting: "Opening a terminal or joining a server",
      story:
        "You’ve joined a small team moving a community project to Linux. Maya, your teammate, hands you a terminal: “Before we change anything, tell me exactly where you are.” Your first job is to get your bearings.",
      useCase:
        "Check your working directory before editing, copying, or deleting files. This is especially useful when you open a new terminal or connect to a remote server.",
    },
    title: "You are here",
    short: "You are here",
    command: "pwd",
    description: "A blinking cursor. A world of possibilities. Let’s start by finding out where you are.",
    objective: "Print the full path of your current directory.",
    concept:
      "<code>pwd</code> means “print working directory.” Your working directory is the place your commands act on.",
    hints: [
      "There’s a command that tells you exactly where you are. Its name is three letters.",
      "Type pwd and press Enter.",
    ],
    xp: 50,
    check: (_s, e) => e.command === "pwd" && e.path === HOME,
    success: "You found your home directory. Every journey needs a starting point.",
  },
  {
    scenario: {
      title: "The note that went missing",
      setting: "Finding hidden configuration files",
      story:
        "Maya left a note named .welcome in your home directory, but it doesn’t appear in the usual file listing. “It’s still there,” she says. “Some files keep a low profile.” Find it without changing anything.",
      useCase:
        "Linux uses dotfiles for settings and project metadata. An ordinary directory listing hides files such as .bashrc and .gitignore, so you need a way to include them.",
    },
    title: "Look a little closer",
    short: "Look around",
    command: "ls -a",
    description:
      "A directory is a little neighborhood of files and folders. Some of its residents are hidden.",
    objective: "List your home directory, including its hidden files.",
    concept:
      "<code>ls</code> lists directory contents. An option changes a command’s behavior: <code>-a</code> includes names beginning with a dot.",
    hints: ["Try adding the “all” option to ls.", "Run ls -a ~ to list your home from anywhere."],
    xp: 50,
    check: (_s, e) => e.command === "ls" && e.path === HOME && !!e.listed?.includes(HOME + "/.welcome"),
    success: "You spotted the hidden file. Dotfiles often hold configuration on Linux.",
  },
  {
    scenario: {
      title: "Follow the handover",
      setting: "Working inside a project directory",
      story:
        "The team keeps its handover notes in Documents. Maya asks you to head into that directory before working with the files: “Think of it as walking into the right room before looking for something.”",
      useCase:
        "Move into a project, documents folder, or logs directory so relative paths refer to the files you intend to work on.",
    },
    title: "A change of scenery",
    short: "Take a step",
    command: "cd",
    description: "You know where you are. Now let’s head somewhere new.",
    objective: "Move into the Documents directory inside your home directory.",
    concept:
      "<code>cd</code> changes your working directory. Use a folder name for a relative path, or a path starting with <code>/</code> for an absolute one.",
    hints: ["Documents sits inside your home directory; cd ~ returns home if you have wandered.", "Run cd ~/Documents. It works from anywhere."],
    xp: 50,
    check: (s) => s.cwd === HOME + "/Documents",
    success: "You made your first move. Try cd .. whenever you want to go up a directory.",
  },
  {
    scenario: {
      title: "Give the project a home",
      setting: "Setting up a new workspace",
      story:
        "Your first small project is ready to begin, but the team doesn’t want its files mixed in with downloads and notes. Maya asks you to make a dedicated projects directory in your home folder.",
      useCase:
        "Create a clear directory structure when starting a project, organizing scripts, or preparing a place for reports and backups.",
    },
    title: "Make a little space",
    short: "Make space",
    command: "mkdir",
    description: "Every good project needs somewhere to live. Let’s give yours a home.",
    objective: "Create a directory named projects inside your home directory.",
    concept:
      "<code>mkdir</code> makes a directory. Names are case-sensitive: <code>projects</code> and <code>Projects</code> are different names.",
    hints: ["Use the make-directory command with the new folder’s name.", "Run mkdir ~/projects. It works from anywhere."],
    xp: 75,
    check: (s) => s.fs[HOME + "/projects"]?.type === "dir",
    success: "Your own corner of the filesystem. That’s where the interesting things begin.",
  },
  {
    scenario: {
      title: "Put a blank page on the desk",
      setting: "Preparing a file for later work",
      story:
        "The projects folder is prepared for this mission. Maya’s checklist calls for an empty hello.txt inside it: “Let’s agree on where our first message will live before we write it.” Create that placeholder.",
      useCase:
        "Create an empty file when preparing a project structure or reserving a filename. Creating a file and writing its contents are separate steps.",
    },
    title: "Hello, little file",
    short: "Your first file",
    command: "touch",
    description: "Your projects directory is ready. It’s time to put something inside it.",
    objective: "Create an empty file named hello.txt in the projects directory.",
    concept:
      "<code>touch</code> creates a file when it doesn’t exist. You can reach a file through its path without changing directories.",
    hints: [
      "You can use projects/hello.txt as the path, or cd into projects first.",
      "Run touch ~/projects/hello.txt. It works from anywhere.",
    ],
    xp: 75,
    check: (s) =>
      s.fs[HOME + "/projects/hello.txt"]?.type === "file" && s.fs[HOME + "/projects/hello.txt"]?.content === "",
    success: "A blank page, made with a command. You can see it in your live file tree.",
  },
  {
    scenario: {
      title: "Leave a sign that it worked",
      setting: "Saving command output to a file",
      story:
        "Maya wants a small greeting that the next teammate can read. Put Hello Linux into projects/hello.txt. “We should be able to close the terminal and still have the message,” she says.",
      useCase:
        "Redirect command output into a file to save a report, write a short note, or keep the output of a command for later. Replacing and appending are different operations.",
    },
    title: "Leave yourself a note",
    short: "Say something",
    command: "echo >",
    description: "Files can hold ideas, configuration, or your first small message to the world.",
    objective: "Write a message containing Hello Linux to projects/hello.txt.",
    concept:
      "<code>echo</code> prints text. <code>></code> sends that output into a file, replacing its contents. <code>>></code> appends instead.",
    hints: [
      "Put your message in quotes, then redirect it to the file.",
      'Run echo "Hello Linux" > ~/projects/hello.txt.',
    ],
    xp: 100,
    check: (s) => !!s.fs[HOME + "/projects/hello.txt"]?.content?.includes("Hello Linux"),
    success: "You redirected output into a file. This small idea is a big part of working in a shell.",
  },
  {
    scenario: {
      title: "Read the handover before you act",
      setting: "Checking notes without opening an editor",
      story:
        "Before the next task, Maya points you to Documents/welcome.txt. “Read this first; it explains the setup.” Bring the note into your terminal so you can review it without changing the file.",
      useCase:
        "Quickly inspect a short README, configuration file, or handover note from the terminal without opening an editor or accidentally changing its contents.",
    },
    title: "Read between the lines",
    short: "Read the story",
    command: "cat",
    description: "There’s a welcome note waiting in Documents. Let’s hear what it has to say.",
    objective: "Print the contents of Documents/welcome.txt in the terminal.",
    concept:
      "<code>cat</code> reads files and prints their contents. You can also give it several file paths to read them together.",
    hints: [
      "Use the command for printing a file, followed by the note’s path.",
      "Run cat ~/Documents/welcome.txt. It works from anywhere.",
    ],
    xp: 75,
    check: (_s, e) =>
      e.command === "cat" && !!e.read?.includes(HOME + "/Documents/welcome.txt") && !e.written,
    success: "A file you can read without leaving the terminal. Keep that curiosity going.",
  },
  {
    scenario: {
      title: "Work from a copy",
      setting: "Keeping an original document intact",
      story:
        "Your project needs its own guide, based on the team’s welcome note. Another teammate still uses the original, so Maya asks you to copy Documents/welcome.txt to projects/guide.txt and leave the source in place.",
      useCase:
        "Make a working copy of a document or a spare copy of a file before editing it. The original remains available while you work on the new version.",
    },
    title: "Keep a spare",
    short: "Make a copy",
    command: "cp",
    description: "Some things are worth keeping twice. Make a copy of the welcome note for your project.",
    objective: "Copy Documents/welcome.txt to projects/guide.txt. Keep the original file.",
    concept:
      "<code>cp</code> takes a source and a destination, in that order. The destination may have a new filename.",
    hints: [
      "You need the original note’s path first and your new file’s path second.",
      "Run cp ~/Documents/welcome.txt ~/projects/guide.txt.",
    ],
    xp: 100,
    check: (s) =>
      s.fs[HOME + "/projects/guide.txt"]?.type === "file" &&
      !!s.fs[HOME + "/Documents/welcome.txt"] &&
      s.fs[HOME + "/projects/guide.txt"]?.content === s.fs[HOME + "/Documents/welcome.txt"]?.content,
    success: "An original and a copy. You chose a new name for the copy, too.",
  },
  {
    scenario: {
      title: "The draft is ready to launch",
      setting: "Renaming a file without rewriting it",
      story:
        "Maya has approved projects/draft.txt. “Let’s call it launch.txt so everyone knows which version is ready.” Give the file its new name while keeping the contents exactly as they are.",
      useCase:
        "Rename a draft, correct a filename, or move a file into a better location. Changing its path doesn’t require opening and rewriting its contents.",
    },
    title: "Ready for launch",
    short: "A fresh name",
    command: "mv",
    description: "The draft is ready. Give it a filename that says so.",
    objective: "Rename projects/draft.txt to projects/launch.txt, preserving its contents.",
    concept:
      "<code>mv</code> moves a file. When the destination is a different name in the same directory, it renames it.",
    hints: ["Use the same source-then-destination pattern as cp.", "Run mv ~/projects/draft.txt ~/projects/launch.txt."],
    xp: 100,
    check: (s) =>
      !s.fs[HOME + "/projects/draft.txt"] &&
      s.fs[HOME + "/projects/launch.txt"]?.content === "A small command. A new possibility.\n",
    success: "Same file, fresh name. Moving and renaming use the same command.",
  },
  {
    scenario: {
      title: "Leave the workspace ready for the next person",
      setting: "Removing an obsolete temporary file",
      story:
        "The handover is nearly finished. Downloads/old.tmp is an obsolete temporary file, but the documents are still needed. Maya asks you to remove just the temporary file and leave both notes in Documents untouched.",
      useCase:
        "Clean up a specific obsolete file using its exact path. Check the target carefully: a normal shell does not automatically send removed files to a recoverable trash folder.",
    },
    title: "A little spring cleaning",
    short: "Clear the clutter",
    command: "rm",
    description: "One last task: clear away a temporary file and leave the important things in place.",
    objective: "Remove Downloads/old.tmp. Keep both files in Documents.",
    concept:
      "<code>rm</code> removes files. A normal Linux shell has no automatic undo for this command. Here, you can reset your practice workspace whenever you need.",
    hints: ["Give rm the exact path of the temporary file.", "Run rm ~/Downloads/old.tmp."],
    xp: 125,
    check: (s) =>
      !s.fs[HOME + "/Downloads/old.tmp"] &&
      !!s.fs[HOME + "/Documents/welcome.txt"] &&
      !!s.fs[HOME + "/Documents/notes.txt"],
    success:
      "You cleared the clutter and completed the beginner path. You’re finding your feet in Linux.",
  },
  {
    scenario: {
      title: "Who can touch what",
      setting: "Auditing a shared server's files",
      story:
        'Maya just gave you access to the team\'s new server. "Before we change anything, let\'s see who can read, write, and run what." The files are in ~/server. Take a proper look.',
      useCase:
        'Before changing permissions, read them. ls -l shows a permission string plus the owner and group for every file — the first thing you check when something "won\'t run" or "won\'t open."',
    },
    title: "Read the permissions",
    short: "Read perms",
    command: "ls -l",
    description: "Every file carries a little label saying who may read, write, and run it. Let's learn to read it.",
    objective: "List the files in ~/server with full details.",
    concept:
      "<code>ls -l</code> shows a 10-character string like <code>-rwxr-xr--</code>. The first character is the type (<code>-</code> file, <code>d</code> directory). The next nine are three groups of <code>rwx</code> for the <b>owner</b>, the <b>group</b>, and <b>others</b>. A letter means allowed; a <code>-</code> means denied.",
    hints: ['Add the "long" option to ls.', "From ~/server, run ls -l."],
    xp: 75,
    check: (_s, e) => e.command === "ls" && !!e.options?.includes("l") && e.path === HOME + "/server",
    success: "Now you can read any file's permissions at a glance. That's the foundation for everything in this stage.",
  },
  {
    scenario: {
      title: "The script that won't run",
      setting: "Making a program executable",
      story:
        '"I wrote a backup script but the server won\'t run it," Maya says, pointing at ~/server/backup.sh. It\'s missing its execute permission. Give the owner the right to run it.',
      useCase:
        "A freshly created script has no execute permission. You add it so the file can run as a program instead of only being read as text.",
    },
    title: "Make it executable",
    short: "Make runnable",
    command: "chmod u+x",
    description: "A script is just a text file until you give it permission to run.",
    objective: "Give the owner execute permission on ~/server/backup.sh.",
    concept:
      "<code>chmod</code> changes permissions. The <b>symbolic</b> form names a class — <code>u</code> owner, <code>g</code> group, <code>o</code> others, <code>a</code> all — then <code>+</code> to add, <code>-</code> to remove, or <code>=</code> to set exactly, followed by the letters <code>r</code>, <code>w</code>, <code>x</code>. So <code>chmod u+x file</code> adds execute for the owner.",
    hints: ["Target the owner class (u) and add (+) execute (x).", "Run chmod u+x backup.sh."],
    xp: 100,
    check: (s) => {
      const n = s.fs[HOME + "/server/backup.sh"];
      return !!n && (Number(n.mode[n.mode.length - 3]) & 1) === 1;
    },
    success: "The owner can run it now. chmod u+x is how almost every script becomes a program.",
  },
  {
    scenario: {
      title: "Secrets in the open",
      setting: "Restricting a sensitive file",
      story:
        'Maya spots ~/server/secrets.env — it holds an API key, and right now anyone can read it. "Owner read and write, the group read-only, everyone else nothing." Set it precisely.',
      useCase:
        "Lock down a credentials or config file so only its owner can change it and outsiders can't read it at all. Octal mode sets all three classes at once.",
    },
    title: "Lock it down",
    short: "Octal mode",
    command: "chmod 640",
    description: "Sometimes you want to set every permission at once, exactly. That's what octal mode is for.",
    objective: "Set ~/server/secrets.env to owner read/write, group read, others none (640).",
    concept:
      "The <b>octal</b> form sets all three classes with three digits. Each digit adds <code>r</code>=4, <code>w</code>=2, <code>x</code>=1. So owner <code>rw</code>=6, group <code>r</code>=4, others <code>0</code> → <code>chmod 640</code>, which matches <code>rw-r-----</code>.",
    hints: ["Add the numbers: read 4 + write 2 = 6 for the owner.", "Run chmod 640 secrets.env."],
    xp: 100,
    check: (s) => s.fs[HOME + "/server/secrets.env"]?.mode === "640",
    success: "Exactly rw-r-----. Octal is the fastest way to set a known permission.",
  },
  {
    scenario: {
      title: "Handing over the keys",
      setting: "Transferring file ownership",
      story:
        'The handover doc ~/server/handover.md belongs to you, but Maya is taking it over. "Make me the owner so I can manage it." Change who owns the file.',
      useCase:
        "When a file moves to a new owner — a teammate takes over a service, or you fix a file created by the wrong user — you reassign ownership.",
    },
    title: "Hand over ownership",
    short: "Change owner",
    command: "chown",
    description: "Files remember who owns them. Sometimes ownership needs to change hands.",
    objective: "Make maya the owner of ~/server/handover.md.",
    concept:
      "<code>chown user file</code> changes a file's owner, and <code>chown user:group file</code> sets both at once. On a real system, changing another file's owner needs <code>sudo</code> (root); the practice shell lets you do it directly so you can learn the command.",
    hints: ["The command is chown, then the new owner, then the file.", "Run chown maya handover.md."],
    xp: 125,
    check: (s) => s.fs[HOME + "/server/handover.md"]?.owner === "maya",
    success: "Maya owns it now — note that in the real world this one needs root.",
  },
  {
    scenario: {
      title: "A folder for the team",
      setting: "Sharing files with a group",
      story:
        'The ~/server/project folder should belong to the whole dev team, not just you. "Set its group to developers so everyone on the team can work in it." Change the group.',
      useCase:
        "Put a shared directory under a team's group so every member gets the group's access — the basis of collaborative directories on a server.",
    },
    title: "Share with the team",
    short: "Change group",
    command: "chgrp",
    description: "Groups let a whole team share access. Let's hand this folder to the developers.",
    objective: "Change the group of ~/server/project to developers.",
    concept:
      "<code>chgrp group file</code> changes which group a file belongs to; the group's three permission bits then apply to every member of that group. (<code>chown :group file</code> does the same thing.)",
    hints: ["Use chgrp, then the group name, then the folder.", "Run chgrp developers project."],
    xp: 125,
    check: (s) => s.fs[HOME + "/server/project"]?.group === "developers",
    success: "The whole developers group shares this folder now. That's how teams collaborate on a server.",
  },
  {
    scenario: {
      title: "The shared drop box",
      setting: "A directory everyone can add to",
      story:
        'Last job: ~/server/uploads is where everyone drops files. "People keep deleting each other\'s uploads," Maya sighs. "Make it so anyone can add files, but only the person who made a file can remove it." That is exactly what the sticky bit does — it\'s how /tmp works.',
      useCase:
        "On a world-writable shared directory (like /tmp or an uploads folder), the sticky bit stops users from deleting files they don't own, while still letting everyone add their own.",
    },
    title: "The shared drop box",
    short: "Sticky bit",
    command: "chmod +t",
    description: "One special permission makes a shared folder safe for everyone to use.",
    objective: "Add the sticky bit to ~/server/uploads.",
    concept:
      'The <b>sticky bit</b> on a directory means only a file\'s owner (or root) can delete or rename files inside it, even when others can write to the folder. Add it with <code>chmod +t dir</code>, or in octal as a leading digit: <code>chmod 1777 dir</code>. In <code>ls -l</code> it appears as a <code>t</code> in the "others" execute slot: <code>drwxrwxrwt</code>.',
    hints: ["Symbolic: add (+) the sticky (t) bit. Octal: a leading 1.", "Run chmod +t uploads (or chmod 1777 uploads)."],
    xp: 150,
    check: (s) => {
      const n = s.fs[HOME + "/server/uploads"];
      return !!n && n.mode.length === 4 && (Number(n.mode[0]) & 1) === 1;
    },
    success: "Now uploads behaves like /tmp — shared, but safe.",
  },
  {
    scenario: {
      title: "Set the tone for everything new",
      setting: "Choosing default permissions before you create files",
      story:
        'Maya has one more habit to pass on. "Every file we just fixed by hand — what if new ones started out safe? On this shared box I don\'t want fresh files readable by the whole world." She means the umask: set it once, and everything you create afterward inherits sensible permissions.',
      useCase:
        "Set your umask at the start of a session (or in your shell profile) so every file and directory you create lands with safe permissions — no need to chmod each one by hand.",
    },
    title: "Default to safe",
    short: "Set the umask",
    command: "umask",
    description: "Instead of fixing each file after the fact, decide once how new files should start.",
    objective: "Set the umask to 027 so new files are closed to others (new files become 640, new directories 750).",
    concept:
      "<code>umask</code> sets the <b>default</b> permissions for things you create next. It's a mask of bits to <i>remove</i> from the base mode — <code>666</code> for files, <code>777</code> for directories. So <code>umask 027</code> removes write from the group (2) and everything from others (7): new files become <code>640</code> and new directories <code>750</code>. Run <code>umask</code> with no argument to see the current mask.",
    hints: [
      "The mask is what gets taken away: group write and all of others is 027.",
      "Run umask 027.",
    ],
    xp: 125,
    check: (s) => s.umask === "027",
    success: "Set and forget — everything you create now starts safe. That completes the permissions stage.",
  },
  {
    scenario: {
      title: "How busy was the morning?",
      setting: "Counting lines in a server log",
      story:
        'The shared server has felt sluggish since nine o\'clock. "Before we blame anyone, let\'s look at the traffic," Maya says, opening ~/server/logs. Every line of access.log is one request. She wants a single number, not the whole log scrolling past.',
      useCase:
        "Logs are long. Piping a file into a counter tells you how many requests, errors, or users there were, without reading every line yourself.",
    },
    title: "Your first pipe",
    short: "First pipe",
    command: "cat | wc -l",
    description: "One command's output can become the next command's input. That's what the pipe is for.",
    objective: "Pipe access.log into wc -l to count how many requests it holds.",
    concept:
      "The pipe <code>|</code> connects two commands: everything the left command prints is fed to the right command as its input. <code>cat access.log | wc -l</code> prints the log, and <code>wc -l</code> counts the lines it receives. When <code>wc</code> reads from a pipe, it prints just the number, with no file name.",
    hints: [
      "Print the log with cat, then add | and the line-counting command.",
      "Run cat ~/server/logs/access.log | wc -l.",
    ],
    xp: 100,
    check: (_s, e) => piped(e) && e.pipeline!.at(-1) === "wc" && tidy(e.stdout) === "14",
    success: "Fourteen requests, counted by two small commands working together. That is the Unix way.",
  },
  {
    scenario: {
      title: "Knocking on doors that don't exist",
      setting: "Filtering a log before counting",
      story:
        'Fourteen requests is not much. "So why is the server complaining?" Maya scrolls the log and frowns: several requests ended in 404, meaning the page doesn\'t exist. "Count just those."',
      useCase:
        "Filter first, count second. grep keeps only the lines you care about (404s, a username, an error code), and wc -l turns them into a number you can watch over time.",
    },
    title: "Filter, then count",
    short: "Filter & count",
    command: "grep | wc -l",
    description: "A pipeline can grow: narrow the lines down, then measure what's left.",
    objective: "Count how many requests in access.log returned 404.",
    concept:
      "<code>grep 404 access.log</code> keeps only the lines containing <code>404</code>. Pipe that into <code>wc -l</code> and you get a count instead of a list. Each command does one small job, and the pipe joins them. Add <code>-v</code> to grep to keep the lines that <i>don't</i> match.",
    hints: [
      "grep the log for 404, then pipe the result into wc -l.",
      "Run grep 404 ~/server/logs/access.log | wc -l.",
    ],
    xp: 125,
    check: (_s, e) => piped(e, "grep") && e.pipeline!.at(-1) === "wc" && tidy(e.stdout) === "5",
    success: "Five missing pages in fourteen requests. Someone is guessing URLs.",
  },
  {
    scenario: {
      title: "Who was knocking?",
      setting: "Extracting one column from structured text",
      story:
        '"Someone is probing for /wp-login.php and /.env," Maya says. "Those aren\'t our pages." Each log line starts with the visitor\'s IP address, followed by a space. Pull out just that first column so you can see who is visiting.',
      useCase:
        "Logs, CSV exports, and /etc/passwd are made of fields split by a delimiter. cut extracts the columns you need, ready to sort or count.",
    },
    title: "Slice out a column",
    short: "Cut a column",
    command: "cut -d -f",
    description: "Text with a consistent shape can be sliced like a table.",
    objective: "Print only the IP address (the first space-separated field) of every line in access.log.",
    concept:
      '<code>cut</code> splits each line on a delimiter and keeps the fields you ask for. <code>-d " "</code> sets the delimiter to a space (quoted, so the shell keeps it), and <code>-f 1</code> keeps field 1. You can ask for several fields with <code>-f 1,3</code> or a range with <code>-f 2-4</code>.',
    hints: [
      'Use cut with a space as the delimiter (-d " ") and field 1 (-f 1).',
      'Run cut -d " " -f 1 ~/server/logs/access.log.',
    ],
    xp: 125,
    check: (_s, e) => !!e.pipeline?.includes("cut") && tidy(e.stdout) === VISITOR_IPS,
    success: "A clean list of visitors, one per request. Now you can count them.",
  },
  {
    scenario: {
      title: "Count every visitor",
      setting: "Tallying repeated values",
      story:
        'The list of IPs is long and repetitive. "Give me one line per visitor with a count next to it," Maya says. "Careful: uniq only notices duplicates that sit next to each other. Line them up first."',
      useCase:
        "sort | uniq -c is the classic tally: how many requests per IP, logins per user, or errors per type. It turns a pile of repeated lines into a frequency table.",
    },
    title: "Sort and squash",
    short: "Sort & tally",
    command: "sort | uniq -c",
    description: "Group the duplicates together, then collapse each group into one counted line.",
    objective: "Show how many requests each IP address made, one line per IP with its count.",
    concept:
      "<code>uniq</code> collapses <i>adjacent</i> repeated lines into one, and <code>-c</code> prefixes each with how many there were. Because only neighbours are compared, you <code>sort</code> first so identical lines end up together. Try <code>uniq -c</code> without <code>sort</code> to see the difference.",
    hints: [
      "Start with your cut command from the last mission, then pipe it through sort and then uniq -c.",
      'Run cut -d " " -f 1 ~/server/logs/access.log | sort | uniq -c.',
    ],
    xp: 150,
    check: (_s, e) => piped(e, "uniq") && tidy(e.stdout) === VISITS_PER_IP,
    success: "One line per visitor, with a count. One of those numbers is much bigger than the rest.",
  },
  {
    scenario: {
      title: "Name the busiest visitor",
      setting: "Ranking results and keeping the top one",
      story:
        '"I don\'t want to read a table during an incident," Maya says. "I want one line: the visitor with the most requests, and how many." Rank the tally from biggest to smallest and keep only the top.',
      useCase:
        "Top-N questions come up constantly: the biggest directories, the noisiest IPs, the most frequent errors. sort -rn | head answers all of them.",
    },
    title: "Find the top talker",
    short: "Top talker",
    command: "sort -rn | head",
    description: "Put the biggest number first, then keep just the first line.",
    objective: "Print a single line: the request count and IP of the busiest visitor.",
    concept:
      "<code>sort -n</code> sorts by numeric value, so 10 comes after 9 instead of before 2. <code>-r</code> reverses the order, putting the biggest first. Then <code>head -n 1</code> keeps the top line. Five commands, each doing one thing, answer a real question.",
    hints: [
      "Take the tally from the last mission and pipe it through sort -rn, then head -n 1.",
      'Run cut -d " " -f 1 ~/server/logs/access.log | sort | uniq -c | sort -rn | head -n 1.',
    ],
    xp: 150,
    check: (_s, e) => piped(e, "uniq") && tidy(e.stdout) === "6 203.0.113.9",
    success: "203.0.113.9 made six requests, and most of them probed pages that don't exist. Maya has a name to follow up on.",
  },
  {
    scenario: {
      title: "Write it up for the team",
      setting: "Saving a pipeline's output to a file",
      story:
        'Last step. The application log, app.log, shows what the server itself complained about. "Summarise the ERROR lines, one per kind with a count, and save it as ~/server/report.txt," Maya says. "The others will read it in the morning."',
      useCase:
        "Put > at the end of a pipeline to save its final output as a report, a list for another tool, or a snapshot to compare with tomorrow.",
    },
    title: "File the report",
    short: "Save a report",
    command: "uniq -c >",
    description: "Pipes and redirects combine: the last command's output can go into a file.",
    objective: "Count each distinct ERROR line in app.log and save the result to ~/server/report.txt.",
    concept:
      "A redirect at the end of a pipeline applies to the <b>last</b> command, so <code>grep ERROR app.log | sort | uniq -c > report.txt</code> saves the finished summary and prints nothing. Use <code>>></code> to append to an existing report instead of replacing it.",
    hints: [
      "Filter app.log for ERROR, tally the lines with sort and uniq -c, then redirect into the report file.",
      "Run grep ERROR ~/server/logs/app.log | sort | uniq -c > ~/server/report.txt.",
    ],
    xp: 175,
    check: (s) => {
      const report = s.fs[HOME + "/server/report.txt"]?.content;
      return !!report && tidy(report).split("\n").sort().join("\n") === [...ERROR_REPORT].sort().join("\n");
    },
    success: "Report filed. You can chain commands, reshape text, and save the result. That completes the pipes stage.",
  },
];

export const MAX_XP = lessons.reduce((sum, l) => sum + l.xp, 0);

export interface LessonGroup {
  title: string;
  description: string;
  lessons: number[];
  locked?: boolean;
}

export const groups: LessonGroup[] = [
  {
    title: "Find your way",
    description: "Get your bearings. Learn to look around and move with confidence.",
    lessons: [0, 1, 2],
  },
  { title: "Make it yours", description: "Create folders, make files, and leave your first message.", lessons: [3, 4, 5] },
  { title: "Work with files", description: "Read, copy, rename, and clear a little space.", lessons: [6, 7, 8, 9] },
  {
    title: "Lock it down",
    description: "Read permissions, then set them: who can read, write, run, and own the team's files.",
    lessons: [10, 11, 12, 13, 14, 15, 16],
  },
  {
    title: "Pipes & text",
    description: "Chain commands with pipes and work through a server log with grep, cut, sort, and uniq.",
    lessons: [17, 18, 19, 20, 21, 22],
  },
];

export const pad2 = (n: number) => String(n).padStart(2, "0");
