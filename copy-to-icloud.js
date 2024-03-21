import chokidar from "chokidar";
import { exec } from "child_process";

chokidar.watch("reminders.js").on("change", (path) => {
  console.log(`file changed: ${path}`);
  exec(
    "cp reminders.js ~/Library/Mobile\\ Documents/iCloud\\~dk\\~simonbs\\~Scriptable/Documents/reminders.js",
    (error, stdout, stderr) => {
      if (error) {
        console.log(`error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
      }
      console.log(`reminders.js copied to iCloud`);
    }
  );
});
