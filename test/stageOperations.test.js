const assert = require('node:assert/strict');
const test = require('node:test');

const { handleStageOperations } = require('../dist/nodes/Streak/operations/stageOperations');
const { createContext } = require('./helpers');

const pipeline = { pipelineKey: { mode: 'list', value: 'pipe_1' } };

test('createStage with a color creates the stage, then sets the color as a background and text pair', async () => {
	const updated = { key: '5003', name: 'Won', color: { backgroundColor: '#FFCC00', foregroundColor: '#000000' } };
	const context = createContext(
		{ ...pipeline, stageName: 'Won', additionalFields: { color: '#ffcc00' } },
		[{ key: '5003', name: 'Won' }, updated],
	);

	const result = await handleStageOperations.call(context, 'createStage', 0);

	assert.deepEqual(result, updated);
	assert.equal(context.calls.length, 2);
	const [create, update] = context.calls.map((c) => c.requestOptions);
	assert.equal(create.method, 'PUT');
	assert.equal(create.url, 'https://api.streak.com/api/v1/pipelines/pipe_1/stages');
	assert.equal(create.body, 'name=Won');
	assert.equal(update.method, 'POST');
	assert.equal(update.url, 'https://api.streak.com/api/v1/pipelines/pipe_1/stages/5003');
	// A light background gets black text
	assert.deepEqual(update.body, { color: { backgroundColor: '#FFCC00', foregroundColor: '#000000' } });
});

test('createStage without a color makes one request', async () => {
	const context = createContext({ ...pipeline, stageName: 'Won', additionalFields: {} }, [{ key: '5003' }]);

	const result = await handleStageOperations.call(context, 'createStage', 0);

	assert.deepEqual(result, { key: '5003' });
	assert.equal(context.calls.length, 1);
});

test('updateStage sends the color as an object, with white text on a dark background', async () => {
	const context = createContext(
		{ ...pipeline, stageKey: '5001', updateFields: { name: 'Lost', color: '#1a237e' } },
		[{ key: '5001' }],
	);

	await handleStageOperations.call(context, 'updateStage', 0);

	const request = context.calls[0].requestOptions;
	assert.equal(request.url, 'https://api.streak.com/api/v1/pipelines/pipe_1/stages/5001');
	assert.deepEqual(request.body, {
		name: 'Lost',
		color: { backgroundColor: '#1A237E', foregroundColor: '#FFFFFF' },
	});
});

test('listStages outputs one item per stage instead of one object keyed by stage', async () => {
	const context = createContext(pipeline, [{ 5001: { key: '5001', name: 'Lead' }, 5002: { key: '5002', name: 'Won' } }]);

	const result = await handleStageOperations.call(context, 'listStages', 0);

	assert.deepEqual(result, [
		{ key: '5001', name: 'Lead' },
		{ key: '5002', name: 'Won' },
	]);
});
