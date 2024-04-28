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
const generalReminderList = await Calendar.forRemindersByTitle(settings.generalReminderList);


function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}


async function processReminderList(reminderListName, limitCount, limitDateDiff) {
    const reminderList = await Calendar.forRemindersByTitle(reminderListName);
    const reminders = await Reminder.allIncomplete([reminderList]);
    const count = reminders.length;

    var oldestDate = new Date();
    for (const reminder of reminders) {
        if (!oldestDate || reminder.creationDate < oldestDate) {
            oldestDate = reminder.creationDate;
        }
    }

    const currentDate = new Date();
    const limitDate = new Date();
    limitDate.setDate(currentDate.getDate() - limitDateDiff);
    log(`Found ${count} reminders in the list (limit ${limitCount})`);
    log(`Oldest reminder is at ${oldestDate} (limit ${limitDate})`);

    if (count >= limitCount || oldestDate < limitDate) {
        let foundReminder = null;
        const allGeneralReminders = await Reminder.allIncomplete([generalReminderList]);
        for (const reminder of allGeneralReminders) {
            if (reminder.title == reminderListName && reminder.dueDate <= currentDate) {
                foundReminder = reminder;
                break;
            }
        }
        var dueDate = new Date();
        if (foundReminder) {
            log(`Found existing reminder, deleting`);
            dueDate = foundReminder.dueDate;
            foundReminder.remove();
        }

        let newReminder = new Reminder();
        newReminder.title = reminderListName;
        newReminder.calendar = generalReminderList;
        newReminder.dueDate = dueDate;
        newReminder.dueDateIncludesTime = false;
        newReminder.save();
        log(`Added reminder ${reminderListName}`);
    } else {
        log(`No limit reached, skipping`);
    }
}


async function getTodayTasks() {
    const allIncomplete = await Reminder.allIncomplete();
    const currentDate = new Date();

    // Sort reminders by priority (descending order)
    allIncomplete.sort((a, b) => {
        const priorityA = a.priority === 0 ? 1000 : a.priority;
        const priorityB = b.priority === 0 ? 1000 : b.priority;
        return priorityA - priorityB;
    });

    var todayReminders = [];
    for (const reminder of allIncomplete) {
        if (reminder.dueDate != null && reminder.dueDate <= currentDate) {
            const prioritySymbol = (reminder.priority != 0) ? "! " : "";
            const bulletSymbol = '\u2023';
            todayReminders.push(`${bulletSymbol} ${prioritySymbol}${reminder.title}`);
        }
    }

    return {
        todayTasks: todayReminders.join('\n'),
        n: todayReminders.length,
    }
}


async function remindersNotify() {
    const {todayTasks, n} = await getTodayTasks();
    if (n === 0) return;
    const numberOfNotificationsText = capitalizeFirstLetter(numWords(n));

    const notification = new Notification();
    if (n === 1) {
        notification.title = `${numberOfNotificationsText} urgent task for today`
    } else {
        notification.title = `${numberOfNotificationsText} urgent tasks for today`
    }
    notification.body = todayTasks;
    notification.sound = 'popup';
    notification.openURL = 'x-apple-reminderkit://';
    notification.schedule();
}


for (let listName in settings.checkLists) {
    let listOptions = settings.checkLists[listName];
    log(`Processing reminders from list '${listName}'`);
    await processReminderList(listName, listOptions.limitCount, listOptions.limitDateDiff);
}

await remindersNotify();

log('Completed');
Script.complete();
