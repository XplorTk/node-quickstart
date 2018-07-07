const express = require('express');
const utils = require('./utils');
const router = express.Router();
/**
 * IMPORTANT! Your credentials should NOT be left unencrypted in your production integration
 * We recommend placing them in a hidden environment variable / file.
 * The variable file here is left unencrypted for demonstration purposes only
 */
const {
	novaPublicId,
	novaEnv,
	novaProductId,
} = process.env;

module.exports = () => {
	/**
	 * Here is a sample loan application that has the NovaConnect widget added.
	 * NovaConnect is a preconfigured modal pop up that gets attached with a single line of Javascript
	 * More details: https://www.novacredit.com/quickstart-guide#clientside
	 */
	router.get('/', (req, res) => {
		/**
		 * Pass our Nova configs to the template so the widget can render
		 * We can also pass a string of data to `userArgs` of NovaConnect, and this string will be returned in our webhook
		 * Example userArgs: unique identifiers from your system, unique nonces for security
		 */
		const novaUserArgs = 'borrow_loan_id_12345';
		return res.render('loan_application', { novaPublicId, novaEnv, novaProductId, novaUserArgs });
	});

	/**
	 * Here is a sample internal dashboard, where your loan officer might view applicant profiles
	 */
	router.get('/dashboard', (req, res) => {
		// Pass the Nova Credit Passport data, if we've received it, to the dashboard view
		return res.render('dashboard', { receivedReportData: utils.retrievePassportData() });
	});

	/**
	 * Route to handle Nova callback webhook, which you should specify on the dashboard as "https://your_domain_here.com/nova"
	 * This route is POST'd to after an applicant completes NovaConnect, and we have updated the status of their NovaCredit Passport
	 * When running this locally, you'll need a tunnel service like ngrok to expose your localhost: https://ngrok.com/
	 * See our docs for a list of potential responses: https://docs.neednova.com/#error-codes-amp-responses
	 */
	return router.post('/nova', (req, res) => {
		const { publicToken, status, userArgs } = req.body;
		console.log('Received a callback to our webhook! Navigate your web browser to /dashboard to see the results');
		res.status(200).send(); // Respond immediately to let Nova know we received the webhook

		if (status === 'SUCCESS') {
			utils.handleNovaWebhook(publicToken, userArgs, status);
		} else {
			/**
			 * Handle unsuccessful statuses here, such as applicant NOT_FOUND and NOT_AUTHENTICATED
			 * For example, you might finalize your loan decision
			 */
			console.log(`Report status ${status} received for Nova public token ${publicToken}`);
		}
	});
	
};

