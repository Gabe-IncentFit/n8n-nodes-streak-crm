const assert = require('node:assert/strict');
const test = require('node:test');

const { handleSnippetOperations } = require('../dist/nodes/Streak/operations/snippetOperations');
const { createContext } = require('./helpers');

// v1 answers a paged request with a bare array, without hasNextPage
const snippets = Array.from({ length: 60 }, (_, i) => ({ key: `snippet_${i}` }));

test('listSnippets with default options asks Streak for page 0 of 50 snippets', async () => {
	const context = createContext({}, [snippets.slice(0, 50)]);

	const result = await handleSnippetOperations.call(context, 'listSnippets', 0);

	assert.deepEqual(result, snippets.slice(0, 50));
	assert.equal(context.calls.length, 1);
	const request = context.calls[0].requestOptions;
	assert.equal(request.url, 'https://api.streak.com/api/v1/snippets');
	assert.deepEqual(request.qs, { page: 0, limit: 50 });
});

test('listSnippets with Page N asks Streak for page N with the given limit', async () => {
	const context = createContext({ returnAll: false, limit: 5, page: 2 }, [snippets.slice(10, 15)]);

	const result = await handleSnippetOperations.call(context, 'listSnippets', 0);

	assert.deepEqual(result, snippets.slice(10, 15));
	assert.deepEqual(context.calls[0].requestOptions.qs, { page: 2, limit: 5 });
});

test('listSnippets with Return All makes one unpaged request and ignores Page and Limit', async () => {
	const context = createContext({ returnAll: true, limit: 5, page: 3 }, [snippets]);

	const result = await handleSnippetOperations.call(context, 'listSnippets', 0);

	assert.deepEqual(result, snippets);
	assert.equal(context.calls.length, 1);
	assert.equal(context.calls[0].requestOptions.qs, undefined);
});
