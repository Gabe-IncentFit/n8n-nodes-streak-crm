import type { INodePropertyOptions } from 'n8n-workflow';

// Streak sends each webhook event for either a pipeline or a team, never both.
// See the event table at https://streak.readme.io/reference/webhooks

export const PIPELINE_WEBHOOK_EVENTS: INodePropertyOptions[] = [
	{ name: 'Box Change Pipeline', value: 'BOX_CHANGE_PIPELINE' },
	{ name: 'Box Change Stage', value: 'BOX_CHANGE_STAGE' },
	{ name: 'Box Create', value: 'BOX_CREATE' },
	{ name: 'Box Delete', value: 'BOX_DELETE' },
	{ name: 'Box Edit', value: 'BOX_EDIT' },
	{ name: 'Box New Email Address', value: 'BOX_NEW_EMAIL_ADDRESS' },
	{ name: 'Comment Create', value: 'COMMENT_CREATE' },
	{ name: 'Meeting Create', value: 'MEETING_CREATE' },
	{ name: 'Meeting Update', value: 'MEETING_UPDATE' },
	{ name: 'Stage Create', value: 'STAGE_CREATE' },
	{ name: 'Task Complete', value: 'TASK_COMPLETE' },
	{ name: 'Task Create', value: 'TASK_CREATE' },
	{ name: 'Task Due', value: 'TASK_DUE' },
	{ name: 'Task Updated', value: 'TASK_UPDATED' },
];

export const TEAM_WEBHOOK_EVENTS: INodePropertyOptions[] = [
	{ name: 'Contact Create', value: 'CONTACT_CREATE' },
	{ name: 'Contact Delete', value: 'CONTACT_DELETE' },
	{ name: 'Contact Update', value: 'CONTACT_UPDATE' },
	{ name: 'Org Create', value: 'ORG_CREATE' },
	{ name: 'Org Delete', value: 'ORG_DELETE' },
	{ name: 'Org Update', value: 'ORG_UPDATE' },
];

/**
 * Explain why an event can't be used with a scope, or return undefined when it can.
 * Streak answers a mismatched pair with a bare "Bad request", so check before calling it.
 */
export function webhookScopeMismatch(event: string, scope: string): string | undefined {
	const pipelineEvent = PIPELINE_WEBHOOK_EVENTS.find((option) => option.value === event);
	const teamEvent = TEAM_WEBHOOK_EVENTS.find((option) => option.value === event);

	if (scope === 'pipeline' && teamEvent) {
		return `"${teamEvent.name}" is a team event. Set Scope to Team and choose a team.`;
	}
	if (scope === 'team' && pipelineEvent) {
		return `"${pipelineEvent.name}" is a pipeline event. Set Scope to Pipeline and choose a pipeline.`;
	}

	return undefined;
}
