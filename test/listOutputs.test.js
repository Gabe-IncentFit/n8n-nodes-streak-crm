const assert = require('node:assert/strict');
const test = require('node:test');

const { handleTeamOperations } = require('../dist/nodes/Streak/operations/teamOperations');
const { handleWebhookOperations } = require('../dist/nodes/Streak/operations/webhookOperations');
const { createContext } = require('./helpers');

// Streak wraps these lists as { results: [...] }. The node should output one item per entry.

test('getMyTeams outputs one item per team', async () => {
	const teams = [{ key: 'team_1' }, { key: 'team_2' }];
	const context = createContext({}, [{ results: teams, hasNextPage: false }]);

	const result = await handleTeamOperations.call(context, 'getMyTeams', 0);

	assert.deepEqual(result, teams);
	assert.equal(context.calls[0].requestOptions.url, 'https://api.streak.com/api/v2/users/me/teams');
});

for (const [scope, parameters, url] of [
	['pipeline', { scope: 'pipeline', pipelineKey: 'pipe_1' }, 'https://api.streak.com/api/v2/pipelines/pipe_1/webhooks'],
	['team', { scope: 'team', teamKey: 'team_1' }, 'https://api.streak.com/api/v2/teams/team_1/webhooks'],
]) {
	test(`listWebhooks for a ${scope} outputs one item per webhook`, async () => {
		const webhooks = [{ key: 'hook_1' }, { key: 'hook_2' }];
		const context = createContext(parameters, [{ results: webhooks }]);

		const result = await handleWebhookOperations.call(context, 'listWebhooks', 0);

		assert.deepEqual(result, webhooks);
		assert.equal(context.calls[0].requestOptions.url, url);
	});
}
