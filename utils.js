const requestPromise = require('request-promise-native');

const {
	novaEnv,
	novaAccessTokenUrl,
	novaPassportUrl,
	novaClientId,
	novaSecretKey,
} = process.env;

const novaBasicAuthCreds = Buffer.from(`${novaClientId}:${novaSecretKey}`).toString('base64');
const BORROW_LOAN_DECISION_THRESHOLD = 650;

/**
 * For demo purposes, we'll store the results of a Nova Credit Passport in-memory via a global variable
 * Note that production usage should store received data in a database, associated to its respective applicant
 */
let receivedReportData = null;

const retrievePassportData = () => {
	return receivedReportData;
};

/**
 * Here's where the magic happens!
 * Parse the credit passport we received for a given applicant, such as storing applicant metadata and analyzing the tradeline data for underwriting purposes
 */
const parseNovaPassport = ({ userArgs, publicToken }, creditPassport = {}) => {
	const { // See https://docs.neednova.com/ for a full explanation of the Nova Credit Passport
		personal,
		scores,
		meta,
		currencies,
		product,
		tradelines,
		bank_accounts,
		other_assets,
		public_records,
		frauds,
		collections,
		nonsufficient_funds,
		identifiers,
		addresses,
		employers,
		other_incomes,
		disputes,
		notices,
		metrics,
	} = creditPassport;

	/**
	 * Now that we have this data, you can easily add Nova to your existing underwriting engine.
	 * In this example, our underwriting decision is: accept applicants whose NOVA_SCORE_BETA is greater than BORROW_LOAN_DECISION_THRESHOLD
	 */
	const novaScoreObj = scores.find((score) => score.score_type === 'NOVA_SCORE_BETA');

	/**
	 * Make our decision:
	 */
	const borrowLoanDecision = novaScoreObj && novaScoreObj.value > BORROW_LOAN_DECISION_THRESHOLD ? 'APPROVE' : 'DENY';

	/**
	 * Finally, store applicant report data - refresh the page at localhost:3000/dashboard to see the results
	 */
	const { full_name, email } = personal || {};
	receivedReportData = {
		userArgs,
		publicToken,
		applicantName: full_name,
		applicantEmail: email,
		novaScore: novaScoreObj && novaScoreObj.value,
		borrowLoanDecision,
	};
};

/**
 * Logic for handling the webhook sent by Nova Credit to the callback url once an applicant's report status has changed
 */
const handleNovaWebhook = async (publicToken, userArgs, status) => {
	const body = await requestPromise.get({
			url: novaAccessTokenUrl,
			headers: {
				Authorization: `Basic ${novaBasicAuthCreds}`, // Send client id, secret as Basic Auth, base-64 encoded
				'X-ENVIRONMENT': novaEnv, // Specify the environment the applicant used to make the request (sandbox or production)
			},
		});
	/**
	 * Now make a request to Nova to fetch the Credit Passport for the public token provided in the webhook (i.e., unique identifier for the credit file request in Nova's system)
	 */
	const accessToken = JSON.parse(body).accessToken;
	const passport = await requestPromise.get({
		url: novaPassportUrl,
		headers: {
			Authorization: `Bearer ${Buffer.from(accessToken).toString('base64')}`, // Use Bearer Auth since have accessToken, base-64 encoded
			'X-ENVIRONMENT': novaEnv, // Must match the environment of the NovaConnect widget and access token
			'X-PUBLIC-TOKEN': publicToken, // The unique Passport identifier sent in the callback
		},
	});
	return parseNovaPassport({ userArgs, publicToken }, JSON.parse(passport));
};

module.exports = {
	retrievePassportData,
	handleNovaWebhook,
};
