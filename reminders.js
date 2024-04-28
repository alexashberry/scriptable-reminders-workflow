const numWords = importModule('num-words');

const settings = {
    generalReminderList: 'Общий',
    checkLists: {
        'Аптека': {
            limitCount: 3,
            limitDateDiff: 7,
        },
        'Озон (срочное)': {
            limitCount: 5,
            limitDateDiff: 7,
        },
    },
}

// Constants
const REMINDER_URL = 'x-apple-reminderkit://'; // URL for reminders
const GENERAL_REMINDER_LIST = await Calendar.forRemindersByTitle(settings.generalReminderList); // General reminder list

// Function to capitalize the first letter of a string
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Function to delete an existing reminder
async function deleteExistingReminder(reminderListName, currentDate) {
    // Find existing reminders in the general reminder list
    const allGeneralReminders = await Reminder.allIncomplete([GENERAL_REMINDER_LIST]);
    const foundReminder = allGeneralReminders.find(reminder => reminder.title === reminderListName && reminder.dueDate <= currentDate);
    
    // If existing reminder found, delete it
    if (foundReminder) {
        foundReminder.remove();
        log(`Existing reminder for ${reminderListName} found and deleted.`);
        return foundReminder.dueDate;
    }
    
    // Return current date if no existing reminder found
    return new Date();
}

// Function to create a new reminder
async function createNewReminder(reminderListName, dueDate) {
    // Create new reminder
    const newReminder = new Reminder();
    newReminder.title = reminderListName;
    newReminder.calendar = GENERAL_REMINDER_LIST;
    newReminder.dueDate = dueDate;
    newReminder.dueDateIncludesTime = false;
    newReminder.save();
    log(`New reminder for ${reminderListName} created.`);
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

// Function to process a reminder list
async function processReminderList(reminderListName, limitCount, limitDateDiff) {
    // Fetch the reminder list and its reminders
    const reminderList = await Calendar.forRemindersByTitle(reminderListName);
    const reminders = await Reminder.allIncomplete([reminderList]);
    const count = reminders.length;

    // Determine the limit date for reminders
    const currentDate = new Date();
    const oldestDate = reminders.reduce((oldest, reminder) => reminder.creationDate < oldest ? reminder.creationDate : oldest, currentDate);
    const limitDate = new Date(currentDate);
    limitDate.setDate(currentDate.getDate() - limitDateDiff);

    // Log information about the reminder list and its reminders
    log(`Found ${count} reminders in the list '${reminderListName}' (limit ${limitCount}).`);
    log(`Oldest reminder is at ${oldestDate} (limit ${limitDate}).`);

    // Check if the limit is reached for the reminder list
    if (count >= limitCount || oldestDate < limitDate) {
        const dueDate = await deleteExistingReminder(reminderListName, currentDate);
        await createNewReminder(reminderListName, dueDate);
    } else {
        log(`No limit reached for list '${reminderListName}'. Skipping.`);
    }
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

// Main function
(async (settings) => {
    // Process each reminder list in settings
    for (const listName in settings.checkLists) {
        const { limitCount, limitDateDiff } = settings.checkLists[listName];
        log(`Processing reminders from list '${listName}'.`);
        await processReminderList(listName, limitCount, limitDateDiff);
    }

    // Fetch today's urgent tasks and trigger notification
    const { todayTasks, n } = await getTodayTasks();
    log(`Today's urgent tasks:\n${todayTasks}`);
    await remindersNotify(todayTasks, n);

    // Log completion and mark script as complete
    log('Completed.');
    Script.complete();
})(settings);
