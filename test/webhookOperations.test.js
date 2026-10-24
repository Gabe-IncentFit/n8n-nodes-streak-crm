const assert = require('node:assert/strict');
const test = require('node:test');

const { handleWebhookOperations } = require('../dist/nodes/Streak/operations/webhookOperations');

function createContext(parameters, responses) {
	const calls = [];

	return {
		calls,
		getNode() {
			return { name: 'Streak' };
		},
		getNodeParameter(name, _itemIndex, defaultValue) {
			return Object.prototype.hasOwnProperty.call(parameters, name)
				? parameters[name]
				: defaultValue;
		},
		helpers: {
			async httpRequestWithAuthentication(credentialsType, requestOptions) {
				calls.push({ credentialsType, requestOptions });
				if (responses.length === 0) {
					throw new Error(`Unexpected request to ${requestOptions.url}`);
				}
				return responses.shift();
			},
		},
		logger: {
			warn() {},
		},
	};
}

test('createWebhook sends teamKey as a query parameter, not in the body', async () => {
	const context = createContext(
		{
			scope: 'team',
			teamKey: 'team_1',
			event: 'CONTACT_CREATE',
			targetUrl: 'https://example.com/hook',
		},
		[{ key: 'wh_1' }],
	);

	const result = await handleWebhookOperations.call(context, 'createWebhook', 0);

	assert.deepEqual(result, { key: 'wh_1' });
	const request = context.calls[0].requestOptions;
	assert.equal(request.method, 'POST');
	assert.equal(request.url, 'https://api.streak.com/api/v2/webhooks');
	assert.deepEqual(request.qs, { teamKey: 'team_1' });
	assert.deepEqual(request.body, { event: 'CONTACT_CREATE', targetUrl: 'https://example.com/hook' });
});

test('createWebhook sends pipelineKey as a query parameter, not in the body', async () => {
	const context = createContext(
		{
			scope: 'pipeline',
			pipelineKey: 'pipe_1',
			event: 'BOX_CHANGE_STAGE',
			targetUrl: 'https://example.com/hook',
		},
		[{ key: 'wh_2' }],
	);

	await handleWebhookOperations.call(context, 'createWebhook', 0);

	const request = context.calls[0].requestOptions;
	assert.deepEqual(request.qs, { pipelineKey: 'pipe_1' });
	assert.deepEqual(request.body, { event: 'BOX_CHANGE_STAGE', targetUrl: 'https://example.com/hook' });
});

test('createWebhook rejects an event that does not match the scope before calling Streak', async () => {
	const context = createContext(
		{
			scope: 'pipeline',
			pipelineKey: 'pipe_1',
			event: 'ORG_DELETE',
			targetUrl: 'https://example.com/hook',
		},
		[],
	);

	await assert.rejects(
		handleWebhookOperations.call(context, 'createWebhook', 0),
		/"Org Delete" is a team event\. Set Scope to Team/,
	);
	assert.equal(context.calls.length, 0);
});
