const assert = require('node:assert/strict');
const test = require('node:test');

const { handleSearchOperations } = require('../dist/nodes/Streak/operations/searchOperations');
const { createContext } = require('./helpers');

test('searchByQuery sends Page, which Streak honors for query searches too', async () => {
	const context = createContext({ query: 'acme', additionalFields: { page: 2 } }, [{ results: { boxes: [] } }]);

	await handleSearchOperations.call(context, 'searchByQuery', 0);

	const request = context.calls[0].requestOptions;
	assert.equal(request.url, 'https://api.streak.com/api/v1/search');
	assert.deepEqual(request.qs, { query: 'acme', page: 2 });
});
