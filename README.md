# Reminders Notification Script (using Scriptable app)

This JavaScript script generates notifications for urgent tasks and inbox reminders using Apple's ReminderKit API and [Scriptable](https://scriptable.app/) app. It's designed to keep you on top of your to-dos by notifying you of today's tasks and items in your inbox that need attention.

## Features

- **Urgent Task Notifications:** Get alerts about the number of urgent tasks due today.
- **Inbox Reminders:** Keeps you informed of unorganized items in your reminder inbox.
- **Priority Sorting:** Highlights the most important tasks by sorting reminders based on their priority.

## Prerequisites

- **Scriptable App:** This script is designed to run in the [Scriptable](https://scriptable.app/) app. Make sure you have it installed on your device.
- **Permissions:** Ensure the app has permission to access your reminders.
- **Documentation:** For more information on Scriptable, check out their [official documentation](https://docs.scriptable.app/).

## Usage

1. Install the Scriptable app and add iCloud as File Bookmarks there.
2. Ensure that you have the required modules, such as `num-words`, in your icloud Scriptable directory.
3. Run the script in the Scriptable app.

## Development

To make development easier, there is an automatic file watcher that copies changes to iCloud, so they are immediately available in the Scriptable app.

1. Run the following command to start the development environment:
   ```bash
   npm run dev
   ```
