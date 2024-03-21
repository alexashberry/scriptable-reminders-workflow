const settings = {
    generalReminderList: "Общий",
    checkLists: {
        "Аптека": {
            limitCount: 3,
            limitDateDiff: 7,
        },
        "Озон (срочное)": {
            limitCount: 5,
            limitDateDiff: 7,
        },
    },
}
const generalReminderList = await Calendar.forRemindersByTitle(settings.generalReminderList);


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

for (let listName in settings.checkLists) {
    let listOptions = settings.checkLists[listName];
    log(`Processing reminders from list '${listName}'`);
    await processReminderList(listName, listOptions.limitCount, listOptions.limitDateDiff);
}
log("Completed")
Script.complete();
