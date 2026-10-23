const assert = require('node:assert/strict');
const test = require('node:test');

const { handleMeetingOperations } = require('../dist/nodes/Streak/operations/meetingOperations');
const { createContext } = require('./helpers');

const listMeetingsParameters = {
	boxKey: { mode: 'list', value: 'box_1' },
	returnAll: false,
	limit: 5,
};

test('listMeetingsInBox without Page asks Streak for page 0 with the given limit', async () => {
	const context = createContext(listMeetingsParameters, [
		{ results: [{ key: 'meeting_1' }], hasNextPage: true },
	]);

	const result = await handleMeetingOperations.call(context, 'listMeetingsInBox', 0);

	assert.deepEqual(result, [{ key: 'meeting_1' }]);
	assert.equal(context.calls.length, 1);
	const request = context.calls[0].requestOptions;
	assert.equal(request.url, 'https://api.streak.com/api/v2/boxes/box_1/meetings');
	assert.deepEqual(request.qs, { page: 0, limit: 5 });
});

test('listMeetingsInBox with Page N asks Streak for page N with the given limit', async () => {
	const context = createContext({ ...listMeetingsParameters, page: 2 }, [
		{ results: [{ key: 'meeting_11' }], hasNextPage: false },
	]);

	const result = await handleMeetingOperations.call(context, 'listMeetingsInBox', 0);

	assert.deepEqual(result, [{ key: 'meeting_11' }]);
	assert.equal(context.calls.length, 1);
	assert.deepEqual(context.calls[0].requestOptions.qs, { page: 2, limit: 5 });
});

test('listMeetingsInBox with Return All makes one unpaged request and ignores Page', async () => {
	const context = createContext({ ...listMeetingsParameters, returnAll: true, page: 3 }, [
		{ results: [{ key: 'meeting_1' }, { key: 'meeting_2' }], hasNextPage: false },
	]);

	const result = await handleMeetingOperations.call(context, 'listMeetingsInBox', 0);

	assert.deepEqual(result, [{ key: 'meeting_1' }, { key: 'meeting_2' }]);
	assert.equal(context.calls.length, 1);
	assert.equal(context.calls[0].requestOptions.qs, undefined);
});
