const assert = require('node:assert/strict');
const test = require('node:test');

const { handleCommentOperations } = require('../dist/nodes/Streak/operations/commentOperations');
const { createContext } = require('./helpers');

// More than Limit's old default of 50, so any leftover cap would show up
const items = Array.from({ length: 60 }, (_, i) => ({ key: `item_${i}` }));

// Streak doesn't page these endpoints (it ignores limit and page on comments): each should make
// one GET with no page/limit and return every result
const cases = [
	{
		operation: 'listCommentsInBox',
		handler: handleCommentOperations,
		parameters: { boxKey: { mode: 'list', value: 'box_1' } },
		response: { hasNextPage: false, results: items },
		url: 'https://api.streak.com/api/v2/boxes/box_1/comments',
		qs: undefined,
	},
];

for (const { operation, handler, parameters, response, url, qs } of cases) {
	test(`${operation} returns every result from one request with no paging parameters`, async () => {
		const context = createContext(parameters, [response]);

		const result = await handler.call(context, operation, 0);

		assert.deepEqual(result, items);
		assert.equal(context.calls.length, 1);
		const request = context.calls[0].requestOptions;
		assert.equal(request.method, 'GET');
		assert.equal(request.url, url);
		assert.deepEqual(request.qs, qs);
	});
}
