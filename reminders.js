const numWords = importModule('num-words');

const REMINDER_URL = 'x-apple-reminderkit://'; // URL for reminders

// Function to capitalize the first letter of a string
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Function to handle reminders notification
async function remindersNotify(todayTasks, n) {
    // If no urgent tasks for today, skip notification
    if (n === 0) {
        log('No urgent tasks for today. Skipping notification.');
        return;
    }

    // Determine notification title based on the number of tasks
    const numberOfNotificationsText = capitalizeFirstLetter(numWords(n));
    const notificationTitle = (n === 1) ? `${numberOfNotificationsText} urgent task for today` : `${numberOfNotificationsText} urgent tasks for today`;

    // Create and schedule notification
    const notification = new Notification();
    notification.title = notificationTitle;
    notification.body = todayTasks;

    // Determine the sound based on the current time
    const currentTime = new Date().getHours();
    notification.sound = currentTime < 17 ? 'event' : 'failure';

    notification.openURL = REMINDER_URL;
    notification.schedule();
    log(`Notification scheduled for ${n} urgent tasks.`);
}

// Function to fetch urgent tasks for today
async function getTodayTasks() {
    // Fetch all incomplete reminders
    const allIncomplete = await Reminder.allIncomplete();
    const currentDate = new Date();

    // Sort reminders by priority (descending order)
    allIncomplete.sort((a, b) => {
        const priorityA = a.priority === 0 ? 1000 : a.priority;
        const priorityB = b.priority === 0 ? 1000 : b.priority;
        return priorityA - priorityB;
    });

    // Filter reminders due for today or overdue
    const todayReminders = [];
    for (const reminder of allIncomplete) {
        if (reminder.dueDate != null && reminder.dueDate <= currentDate) {
            const prioritySymbol = (reminder.priority != 0) ? "! " : "";
            const bulletSymbol = '\u2023';
            todayReminders.push(`${bulletSymbol} ${prioritySymbol}${reminder.title}`);
        }
    }

    // Return today's urgent tasks and their count
    return {
        todayTasks: todayReminders.join('\n'),
        n: todayReminders.length,
    };
}

// Fetch today's urgent tasks and trigger notification
const { todayTasks, n } = await getTodayTasks();
log(`Today's urgent tasks:\n${todayTasks}`);
await remindersNotify(todayTasks, n);

// Log completion and mark script as complete
log('Completed');
Script.complete();
