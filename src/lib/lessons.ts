import { HOME, type ShellEvent, type ShellState } from "./shell";

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
    hints: ["Try adding the “all” option to ls.", "Run ls -a while you are in ~."],
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
    hints: ["Documents is right inside your current directory.", "Try cd Documents. An absolute path works too."],
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
    hints: ["Use the make-directory command with the new folder’s name.", "From ~, run mkdir projects."],
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
      "From ~, run touch projects/hello.txt.",
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
      'Run echo "Hello Linux" > projects/hello.txt.',
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
      "From ~, run cat Documents/welcome.txt.",
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
      "Run cp Documents/welcome.txt projects/guide.txt.",
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
    hints: ["Use the same source-then-destination pattern as cp.", "Run mv projects/draft.txt projects/launch.txt."],
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
    hints: ["Give rm the exact path of the temporary file.", "Run rm Downloads/old.tmp."],
    xp: 125,
    check: (s) =>
      !s.fs[HOME + "/Downloads/old.tmp"] &&
      !!s.fs[HOME + "/Documents/welcome.txt"] &&
      !!s.fs[HOME + "/Documents/notes.txt"],
    success:
      "You cleared the clutter and completed the beginner path. You’re finding your feet in Linux.",
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
    title: "Connect the dots",
    description: "Pipes, searching, and permissions. Your next chapter is on the way.",
    lessons: [],
    locked: true,
  },
];

export const pad2 = (n: number) => String(n).padStart(2, "0");
