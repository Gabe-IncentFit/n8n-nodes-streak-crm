const assert = require('node:assert/strict');
const test = require('node:test');

const { handleMeetingOperations } = require('../dist/nodes/Streak/operations/meetingOperations');
const { createContext } = require('./helpers');

test('createMeeting sends a JSON body with startTimestamp in epoch milliseconds', async () => {
	const context = createContext(
		{
			boxKey: { mode: 'list', value: 'box_1' },
			meetingType: 'CALL_LOG',
			startTimestamp: '2020-01-02T03:04:05Z',
			additionalFields: { notes: 'Called about renewal' },
		},
		[{ key: 'meeting_1' }],
	);

	const result = await handleMeetingOperations.call(context, 'createMeeting', 0);

	assert.deepEqual(result, { key: 'meeting_1' });
	assert.equal(context.calls.length, 1);
	const request = context.calls[0].requestOptions;
	assert.equal(request.method, 'POST');
	assert.equal(request.url, 'https://api.streak.com/api/v2/boxes/box_1/meetings');
	assert.equal(request.headers['Content-Type'], 'application/json');
	assert.deepEqual(request.body, {
		meetingType: 'CALL_LOG',
		startTimestamp: 1577934245000,
		notes: 'Called about renewal',
	});
});

// The Streak app shows a duration of 1800000 as 30 minutes, and 30 as 0 seconds
test('createMeeting converts Duration from minutes to the milliseconds Streak stores', async () => {
	const context = createContext(
		{
			boxKey: { mode: 'list', value: 'box_1' },
			meetingType: 'MEETING_NOTES',
			startTimestamp: '2020-01-02T03:04:05Z',
			additionalFields: { duration: 30 },
		},
		[{ key: 'meeting_1' }],
	);

	await handleMeetingOperations.call(context, 'createMeeting', 0);

	assert.equal(context.calls[0].requestOptions.body.duration, 1800000);
});

test('editMeeting converts Duration from minutes to milliseconds', async () => {
	const context = createContext({ meetingKey: 'meeting_1', updateFields: { duration: 45 } }, [{ key: 'meeting_1' }]);

	await handleMeetingOperations.call(context, 'editMeeting', 0);

	const request = context.calls[0].requestOptions;
	assert.equal(request.url, 'https://api.streak.com/api/v2/meetings/meeting_1');
	assert.deepEqual(request.body, { duration: 2700000 });
});
