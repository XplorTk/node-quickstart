/**
 * Mocha unit tests
 */
const request = require('supertest');
const app = require('./index.js');

describe('Unit tests', () => {
	it('renders returns a success for /', () => {
		return request(app)
			.get('/')
			.expect(200);
	});
	it('renders returns a success for /dashboard', () => {
		return request(app)
			.get('/dashboard')
			.expect(200);
	});
	it('can be POSTed at the callback url', () => {
		return request(app)
			.post('/nova')
			.send({ status: 'DUMMY', publicToken: 'dummyToken' })
			.expect(200);
	});
});