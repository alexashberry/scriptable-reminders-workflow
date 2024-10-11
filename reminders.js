// Import necessary modules
const numWords = importModule('num-words'); // Adjust based on your environment if necessary

// Constants
const REMINDER_URL = 'x-apple-reminderkit://'; // URL scheme for Apple Reminders

/**
 * Capitalizes the first letter of a string
 * @param {string} string - The string to capitalize
 * @returns {string} - String with the first letter capitalized
 */
function capitalizeFirstLetter(string) {
    if (!string || typeof string !== 'string') {
        console.warn('capitalizeFirstLetter received invalid input.');
        return '';
    }
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Handles the notification for reminders
 * @param {string} todayUrgentTasks - List of today's urgent tasks as a string
 * @param {number} n - Number of urgent tasks
 * @param {number} inboxCount - Number of inbox items
 */
async function remindersNotify(todayUrgentTasks, n, inboxCount) {
    try {
        // If there are no urgent tasks or inbox items, skip the notification
        if (n === 0 && inboxCount === 0) {
            console.log('No urgent tasks for today and inbox is empty. Skipping notification.');
            return;
        }

        let notificationTitle = '';
        let body = '';

        // Construct the notification title and body based on tasks and inbox items
        if (n !== 0) {
            const numberOfNotificationsText = capitalizeFirstLetter(numWords(n));
            notificationTitle = (n === 1) ? `${numberOfNotificationsText} urgent task` : `${numberOfNotificationsText} urgent tasks`;
            body = todayUrgentTasks;

            if (inboxCount !== 0) {
                const numberOfInboxText = numWords(inboxCount);
                notificationTitle += ` + ${numberOfInboxText} inbox`;
            }
        } else {
            const numberOfInboxText = capitalizeFirstLetter(numWords(inboxCount));
            notificationTitle = (inboxCount === 1) ? `${numberOfInboxText} inbox task` : `${numberOfInboxText} inbox tasks`;
            body = 'Please organize the inbox';
        }

        // Create and schedule the notification
        const notification = new Notification();
        notification.title = notificationTitle;
        notification.body = body;
        notification.sound = 'event';
        notification.openURL = REMINDER_URL;
        notification.schedule();
        
        console.log(`Notification scheduled with title: "${notificationTitle}" and body: "${body}"`);
    } catch (error) {
        console.error('Error scheduling notification:', error);
    }
}

/**
 * Fetches today's urgent tasks
 * @returns {Object} - An object containing today's urgent tasks and their count
 */
async function getTodayUrgentTasks(allIncomplete) {
    try {
        const currentDate = new Date();

        // Sort reminders by priority (lower priority number means higher priority)
        allIncomplete.sort((a, b) => (a.priority || 1000) - (b.priority || 1000));

        // Filter reminders that are due today or overdue with non-zero priority
        const todayUrgentReminders = allIncomplete
            .filter(reminder => reminder.dueDate && reminder.dueDate <= currentDate && reminder.priority !== 0)
            .map(reminder => `\u2023 ${reminder.title}`);

        return {
            todayUrgentTasks: todayUrgentReminders.join('\n'),
            n: todayUrgentReminders.length,
        };
    } catch (error) {
        console.error('Error fetching today\'s urgent tasks:', error);
        return { todayUrgentTasks: '', n: 0 };
    }
}

/**
 * Fetches the count of tasks in the inbox
 * @returns {number} - Count of tasks in the inbox
 */
async function getInboxCount(allIncomplete) {
    try {
        const inboxCount = allIncomplete.filter(reminder => !reminder.dueDate && reminder.calendar.title === 'Напоминания').length;
        return inboxCount;
    } catch (error) {
        console.error('Error fetching inbox count:', error);
        return 0;
    }
}

// Main function to fetch tasks and trigger the notification
(async () => {
    try {
        const allIncomplete = await Reminder.allIncomplete();

        const { todayUrgentTasks, n } = await getTodayUrgentTasks(allIncomplete);
        console.log(`Today's urgent tasks:\n${todayUrgentTasks || 'None'}`);

        const inboxCount = await getInboxCount(allIncomplete);
        console.log(`Inbox count: ${inboxCount}`);

        await remindersNotify(todayUrgentTasks, n, inboxCount);

        console.log('Script execution completed.');
    } catch (error) {
        console.error('An error occurred during script execution:', error);
    } finally {
        Script.complete();
    }
})();
