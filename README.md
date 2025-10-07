# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

## Bulk Mark as Paid Feature

A custom enhancement was added to allow marking multiple filtered invoices as paid in one action.

How it works:
1. Navigate to the `Facturi` (Invoices) view.
2. Use the existing filter controls (e.g., supplier, number, dates) to narrow down the list.
3. A green button appears: `Marcheaza (X) ca platite` where X is the number of currently filtered & unpaid invoices.
4. Click the button and confirm the action. All displayed unpaid invoices are updated in a single Firestore batch:
	- `paid` is set to true
	- `remainingSum` becomes 0
	- A synthetic payment entry is appended to `paymentHistory` with the remaining amount (if any) so payment tracking integrity is preserved.

UI Feedback:
- While processing, the button shows a loading label.
- A short success or error message is displayed near the total outstanding amount.

Implementation notes:
- Uses Firestore `writeBatch` for atomic multi-document updates.
- Optimistic UI update is applied; the realtime `onSnapshot` listener will reconcile final state.

If you need to revert a mistakenly bulk-marked invoice, open it individually and adjust payments manually (future enhancement could include a bulk undo).

## Duplicate Invoice Cleanup Feature

An additional maintenance tool lets you remove duplicate invoices based on exact invoice number matches.

Rules:
- Matching is case-insensitive and trims whitespace.
- Only the earliest (oldest `issueDate`) invoice for each duplicated `invoiceNo` is kept; all later ones are deleted.
- Empty or missing invoice numbers are ignored.

How to use:
1. Open the Invoices view.
2. Click the orange button `Sterge Duplicatele`.
3. A confirmation dialog shows how many duplicate documents will be removed.
4. Confirm to proceed; deletions happen in Firestore batches (chunks <= 450 docs for safety).

After completion:
- A success or info message appears near the totals area.
- Local cache (`invoicesCache`) is updated optimistically; realtime snapshot listener ensures consistency.

Note: There is no automatic undo. Consider exporting data or doing a manual backup before large cleanup operations if data integrity is critical.
