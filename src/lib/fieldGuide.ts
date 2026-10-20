export interface GuideGroup {
  title: string;
  rows: [command: string, meaning: string][];
}

export const fieldGuide: GuideGroup[] = [
  {
    title: "Get your bearings",
    rows: [
      ["pwd", "Print the working directory"],
      ["ls [-a] [-l] [path]", "List files; -a includes hidden files, -l shows details"],
      ["cd [path]", "Change directory; cd .. goes up, cd ~ goes home"],
      ["whoami", "Print your current username"],
    ],
  },
  {
    title: "Make yourself at home",
    rows: [
      ["mkdir [-p] path", "Create a directory; -p creates missing parents"],
      ["touch file", "Create an empty file"],
      ["cp source target", "Copy a file"],
      ["mv source target", "Move or rename a file or directory"],
      ["rm file", "Remove a file"],
      ["rmdir directory", "Remove an empty directory"],
    ],
  },
  {
    title: "Read, write, and explore",
    rows: [
      ['echo "text"', "Print a message; -n omits the final newline"],
      ['echo "text" > file', "Write a message to a file, replacing its contents"],
      ['echo "text" >> file', "Append a message to a file"],
      ["cat file", "Print file contents"],
      ["head [-n 5] file", "Read the first lines of a file"],
      ["tail [-n 5] file", "Read the last lines of a file"],
      ["grep [-i] pattern file", "Find matching lines; -i ignores letter case"],
      ["wc [-l] file", "Count lines, words, bytes; -l shows only lines"],
      ['find . -name "*.txt"', "Find paths by name; * matches any characters"],
      ["chmod 755 file", "Change permissions; +x adds execute permission"],
      ["clear", "Clear terminal output"],
      ["help", "Show available commands"],
    ],
  },
];
