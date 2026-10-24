const assert = require('node:assert/strict');
const test = require('node:test');

const { handleFieldOperations } = require('../dist/nodes/Streak/operations/fieldOperations');
const { createContext } = require('./helpers');

const pipeline = { pipelineKey: { mode: 'list', value: 'pipe_1' } };

test('createField for a dropdown creates the field, then sets its options with dropdownSettings', async () => {
	const updated = { key: '1001', type: 'DROPDOWN', dropdownSettings: { items: [{ key: '9001', name: 'High' }, { key: '9002', name: 'Low' }] } };
	const context = createContext(
		{ ...pipeline, fieldName: 'Priority', fieldType: 'DROPDOWN', enumValues: ['High', 'Low'] },
		[{ key: '1001', name: 'Priority', type: 'DROPDOWN' }, updated],
	);

	const result = await handleFieldOperations.call(context, 'createField', 0);

	assert.deepEqual(result, updated);
	assert.equal(context.calls.length, 2);
	const [create, update] = context.calls.map((c) => c.requestOptions);
	assert.equal(create.method, 'PUT');
	assert.equal(create.url, 'https://api.streak.com/api/v1/pipelines/pipe_1/fields');
	assert.equal(create.body, 'name=Priority&type=DROPDOWN');
	assert.equal(update.method, 'POST');
	assert.equal(update.url, 'https://api.streak.com/api/v1/pipelines/pipe_1/fields/1001');
	assert.deepEqual(update.body, { dropdownSettings: { items: [{ name: 'High' }, { name: 'Low' }] } });
});

test('createField for a dropdown without values fails before calling Streak', async () => {
	const context = createContext({ ...pipeline, fieldName: 'Priority', fieldType: 'DROPDOWN', enumValues: [] }, []);

	await assert.rejects(handleFieldOperations.call(context, 'createField', 0), /Dropdown Values are required/);
	assert.equal(context.calls.length, 0);
});

test('createField for other types sends only name and type in one request', async () => {
	const context = createContext({ ...pipeline, fieldName: 'Notes', fieldType: 'TEXT_INPUT' }, [{ key: '1002' }]);

	const result = await handleFieldOperations.call(context, 'createField', 0);

	assert.deepEqual(result, { key: '1002' });
	assert.equal(context.calls.length, 1);
	assert.equal(context.calls[0].requestOptions.body, 'name=Notes&type=TEXT_INPUT');
});

test('updateField replaces dropdown options and keeps the keys of options listed by their current name', async () => {
	const context = createContext(
		{ ...pipeline, fieldKey: '1001', updateFields: { enumValues: ['High', 'Medium'] } },
		[
			{ key: '1001', type: 'DROPDOWN', dropdownSettings: { items: [{ key: '9001', name: 'high' }, { key: '9002', name: 'Low' }] } },
			{ key: '1001' },
		],
	);

	await handleFieldOperations.call(context, 'updateField', 0);

	assert.equal(context.calls.length, 2);
	const [get, update] = context.calls.map((c) => c.requestOptions);
	assert.equal(get.method, 'GET');
	assert.equal(get.url, 'https://api.streak.com/api/v1/pipelines/pipe_1/fields/1001');
	assert.equal(update.url, 'https://api.streak.com/api/v1/pipelines/pipe_1/fields/1001');
	assert.deepEqual(update.body, {
		dropdownSettings: { items: [{ key: '9001', name: 'High' }, { name: 'Medium' }] },
	});
});

test('updateField rejects Dropdown Values on a field that is not a dropdown', async () => {
	const context = createContext(
		{ ...pipeline, fieldKey: '1001', updateFields: { enumValues: ['High'] } },
		[{ key: '1001', type: 'TEXT_INPUT' }],
	);

	await assert.rejects(handleFieldOperations.call(context, 'updateField', 0), /only apply to dropdown fields/);
	assert.equal(context.calls.length, 1);
});

test('updateField with only a name sends just the name, without looking up the field', async () => {
	const context = createContext({ ...pipeline, fieldKey: '1001', updateFields: { name: 'Stage notes' } }, [{ key: '1001' }]);

	await handleFieldOperations.call(context, 'updateField', 0);

	assert.equal(context.calls.length, 1);
	assert.deepEqual(context.calls[0].requestOptions.body, { name: 'Stage notes' });
});
