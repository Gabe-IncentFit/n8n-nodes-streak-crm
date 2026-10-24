import type {
	ILoadOptionsFunctions,
	INodePropertyOptions,
	INodeListSearchResult,
} from 'n8n-workflow';
import { streakApiRequest } from '../operations/utils';

interface StageRecord {
	key: string;
	name?: string;
}

function isStageRecord(value: unknown): value is StageRecord {
	return typeof value === 'object' && value !== null && 'key' in value;
}

// Helper function to parse stages response from Streak API
function parseStagesResponse(response: unknown): StageRecord[] {
	let stages: StageRecord[] = [];
	if (Array.isArray(response)) {
		if (response.length > 0 && typeof response[0] === 'object') {
			const firstItem = response[0] as Record<string, unknown>;
			const keys = Object.keys(firstItem);
			if (
				keys.length > 0 &&
				firstItem[keys[0]] &&
				typeof firstItem[keys[0]] === 'object' &&
				isStageRecord(firstItem[keys[0]])
			) {
				stages = keys
					.map((key) => firstItem[key])
					.filter((v): v is StageRecord => isStageRecord(v));
			} else {
				stages = response.filter((v): v is StageRecord => isStageRecord(v));
			}
		}
	} else if (response && typeof response === 'object') {
		const resp = response as Record<string, unknown>;
		if (resp.results && Array.isArray(resp.results)) {
			stages = (resp.results as unknown[]).filter((v): v is StageRecord => isStageRecord(v));
		} else if (resp.data && Array.isArray(resp.data)) {
			stages = (resp.data as unknown[]).filter((v): v is StageRecord => isStageRecord(v));
		} else if (resp.stages && Array.isArray(resp.stages)) {
			stages = (resp.stages as unknown[]).filter((v): v is StageRecord => isStageRecord(v));
		} else {
			const keys = Object.keys(resp);
			if (keys.length > 0 && resp[keys[0]] && isStageRecord(resp[keys[0]])) {
				stages = keys
					.map((key) => resp[key])
					.filter((v): v is StageRecord => isStageRecord(v));
			} else if (isStageRecord(response)) {
				stages = [response];
			}
		}
	}
	return stages;
}

function extractParamValue(param: unknown): string | undefined {
	if (typeof param === 'string') return param;
	if (param && typeof param === 'object') {
		const obj = param as Record<string, unknown>;
		if (typeof obj.value === 'string') return obj.value;
		if (typeof obj.id === 'string') return obj.id;
	}
	return undefined;
}

interface TeamRecord {
	key: string;
	name?: string;
}

interface TeamMemberRecord {
	key?: string;
	userKey?: string;
	email?: string;
	displayName?: string;
	fullName?: string;
	name?: string;
}

function isTeamRecord(value: unknown): value is TeamRecord {
	return typeof value === 'object' && value !== null && 'key' in value;
}

function parseTeamsResponse(response: unknown): TeamRecord[] {
	const teams: TeamRecord[] = [];
	if (Array.isArray(response)) {
		for (const item of response) {
			if (item && typeof item === 'object' && 'results' in item) {
				const obj = item as Record<string, unknown>;
				if (Array.isArray(obj.results)) {
					teams.push(...(obj.results as unknown[]).filter((v): v is TeamRecord => isTeamRecord(v)));
				}
			}
		}
	} else if (response && typeof response === 'object') {
		const resp = response as Record<string, unknown>;
		if (resp.results && Array.isArray(resp.results)) {
			teams.push(...(resp.results as unknown[]).filter((v): v is TeamRecord => isTeamRecord(v)));
		} else if (isTeamRecord(response)) {
			teams.push(response);
		}
	}
	return teams;
}

function parseBoxesResponse(response: unknown): Array<{ key: string; name: string }> {
	if (Array.isArray(response)) {
		return response as Array<{ key: string; name: string }>;
	}

	if (response && typeof response === 'object') {
		const results = (response as Record<string, unknown>).results;
		if (Array.isArray(results)) {
			return results as Array<{ key: string; name: string }>;
		}
	}

	return [];
}

async function getTeamMembers(
	context: ILoadOptionsFunctions,
): Promise<TeamMemberRecord[]> {
	const response = await streakApiRequest(context, 'GET', '/users/me/teams');
	const teams = parseTeamsResponse(response);
	const members: TeamMemberRecord[] = [];

	for (const team of teams) {
		if (!team.key) continue;
		const teamData = (await streakApiRequest(
			context,
			'GET',
			`/teams/${team.key}`,
		)) as Record<string, unknown>;
		const teamMembers = teamData.members as TeamMemberRecord[];
		if (Array.isArray(teamMembers)) {
			members.push(...teamMembers);
		}
	}

	return members;
}

function getTeamMemberLabel(member: TeamMemberRecord): string {
	const label = member.fullName || member.displayName || member.name || member.email || member.key || member.userKey || 'Unnamed User';
	return member.email && label !== member.email ? `${label} (${member.email})` : label;
}

interface TeamFieldRecord {
	key: string;
	name?: string;
	type?: string;
}

// Streak returns custom contact and organization fields as an object keyed by field key
function parseTeamFieldsResponse(response: unknown): TeamFieldRecord[] {
	if (!response || typeof response !== 'object') return [];
	const results = (response as Record<string, unknown>).results;
	const values = Array.isArray(response)
		? response
		: Array.isArray(results)
			? results
			: Object.values(response as Record<string, unknown>);
	return values.filter((v): v is TeamFieldRecord => isTeamRecord(v));
}

/**
 * List the custom contact or organization fields of every team the user is in. Update
 * Contact and Update Organization have no team parameter, so fields from all teams are
 * offered, labelled with the team when there's more than one.
 */
async function getTeamFieldOptions(
	context: ILoadOptionsFunctions,
	resource: 'contacts' | 'organizations',
): Promise<INodePropertyOptions[]> {
	const teams = parseTeamsResponse(
		await streakApiRequest(context, 'GET', '/users/me/teams'),
	).filter((team) => team.key);
	const options: INodePropertyOptions[] = [];

	for (const team of teams) {
		const fields = parseTeamFieldsResponse(
			await streakApiRequest(context, 'GET', `/teams/${team.key}/${resource}/fields`),
		);
		for (const field of fields) {
			// Streak computes formula fields, so they can't be set
			if (field.type === 'FORMULA') continue;
			const type = field.type || 'unknown';
			const details = teams.length > 1 ? `${type}, ${team.name || team.key}` : type;
			options.push({ name: `${field.name || 'Unnamed Field'} (${details})`, value: field.key });
		}
	}

	return options;
}

export const loadOptions = {
	async getPipelineOptions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
		try {
			const pipelines = (await streakApiRequest(this, 'GET', '/pipelines')) as Array<{
				key: string;
				name: string;
			}>;

			return pipelines
				.filter((pipeline) => pipeline && pipeline.key)
				.map((pipeline) => ({
					name: `${pipeline.name || 'Unnamed Pipeline'} (${pipeline.key || 'no-key'})`,
					value: pipeline.key || '',
				}));
		} catch {
			return [];
		}
	},

	async getTeamOptions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
		try {
			const response = await streakApiRequest(this, 'GET', '/users/me/teams');
			const teams = parseTeamsResponse(response);

			return teams
				.filter((team) => team && team.key)
				.map((team) => ({
					name: `${team.name || 'Unnamed Team'} (${team.key || 'no-key'})`,
					value: team.key || '',
				}));
		} catch {
			return [];
		}
	},

	async getTeamMemberEmailOptions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
		try {
			const seen = new Set<string>();
			const members: INodePropertyOptions[] = [];
			const teamMembers = await getTeamMembers(this);

			for (const member of teamMembers) {
				if (!member.email || seen.has(member.email)) continue;
				seen.add(member.email);
				members.push({
					name: getTeamMemberLabel(member),
					value: member.email,
				});
			}

			return members;
		} catch {
			return [];
		}
	},

	async getTeamMemberOptions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
		return await loadOptions.getTeamMemberEmailOptions.call(this);
	},

	async getContactFieldOptions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
		try {
			return await getTeamFieldOptions(this, 'contacts');
		} catch {
			return [];
		}
	},

	async getOrganizationFieldOptions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
		try {
			return await getTeamFieldOptions(this, 'organizations');
		} catch {
			return [];
		}
	},

	async getStageOptions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
		try {
			const pipelineKey = extractParamValue(this.getCurrentNodeParameter('pipelineKey'));
			if (!pipelineKey) return [];

			const response = await streakApiRequest(
				this,
				'GET',
				`/pipelines/${pipelineKey}/stages`,
			);
			const stages = parseStagesResponse(response);

			return stages
				.filter((stage) => stage && stage.key)
				.map((stage) => ({
					name: `${stage.name || 'Unnamed Stage'} (${stage.key || 'no-key'})`,
					value: stage.key || '',
				}));
		} catch {
			return [];
		}
	},

	async getBoxOptions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
		try {
			const pipelineKey = extractParamValue(this.getCurrentNodeParameter('pipelineKey'));
			if (!pipelineKey) return [];

			const response = await streakApiRequest(
				this,
				'GET',
				`/pipelines/${pipelineKey}/boxes`,
			);
			const boxes = parseBoxesResponse(response);

			return boxes
				.filter((box) => box && box.key)
				.map((box) => ({
					name: `${box.name || 'Unnamed Box'} (${box.key || 'no-key'})`,
					value: box.key || '',
				}));
		} catch {
			return [];
		}
	},

	async getTagValues(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
		try {
			const fields = await getFieldsForCurrentBox(this);

			// Read the sibling field key from the full parameter tree
			let selectedFieldKey: string | undefined;
			try {
				const allParams = this.getCurrentNodeParameters() as Record<string, unknown>;
				const uf = allParams?.updateFields as Record<string, unknown>;
				const cf = uf?.customFields as Record<string, unknown>;
				const entries = cf?.tagField as Array<{ key: { value: string } }>;
				if (entries?.length) {
					selectedFieldKey = entries[entries.length - 1]?.key?.value;
				}
			} catch {
				// Fall back to showing all tags
			}

			const tagFields = fields.filter(
				(f) => f.type === 'TAG' && f.tagSettings?.tags,
			);
			const needsPrefix = !selectedFieldKey && tagFields.length > 1;
			const results: INodePropertyOptions[] = [];

			for (const field of tagFields) {
				if (selectedFieldKey && field.key !== selectedFieldKey) continue;
				for (const tag of field.tagSettings!.tags) {
					if (!tag.key) continue;
					results.push({
						name: needsPrefix ? `${field.name} \u2192 ${tag.tag}` : tag.tag,
						value: tag.key,
					});
				}
			}

			return results;
		} catch {
			return [];
		}
	},
};

interface StreakField {
	key: string;
	name: string;
	type: string;
	dropdownSettings?: { items: Array<{ key: string; name: string }> };
	tagSettings?: { tags: Array<{ key: string; tag: string }> };
}

async function getFieldsForCurrentBox(
	context: ILoadOptionsFunctions,
): Promise<StreakField[]> {
	const boxKey = extractParamValue(context.getCurrentNodeParameter('boxKey'));
	if (!boxKey) return [];

	const box = (await streakApiRequest(context, 'GET', `/boxes/${boxKey}`)) as {
		pipelineKey: string;
	};
	if (!box?.pipelineKey) return [];

	return (await streakApiRequest(
		context,
		'GET',
		`/pipelines/${box.pipelineKey}/fields`,
	)) as unknown as StreakField[];
}

function applyFilter<T extends { key: string; name?: string }>(
	items: T[],
	filter: string | undefined,
	getSearchableText: (item: T) => string,
): T[] {
	if (!filter) return items;
	const filterLower = filter.toLowerCase();
	return items.filter(
		(item) => item && item.key && getSearchableText(item).toLowerCase().includes(filterLower),
	);
}

async function getFieldOptionsByType(
	this: ILoadOptionsFunctions,
	fieldType: string,
	filter?: string,
): Promise<INodeListSearchResult> {
	try {
		const fields = await getFieldsForCurrentBox(this);
		const typed = fields.filter((f) => f.type === fieldType);
		const filtered = applyFilter(typed, filter, (f) => `${f.name || ''} ${f.key}`);

		return {
			results: filtered
				.filter((f) => f.key)
				.map((f) => ({ name: f.name || 'Unnamed Field', value: f.key })),
		};
	} catch {
		return { results: [] };
	}
}

export const listSearch = {
	async getPipelineOptions(
		this: ILoadOptionsFunctions,
		filter?: string,
	): Promise<INodeListSearchResult> {
		try {
			const pipelines = (await streakApiRequest(this, 'GET', '/pipelines')) as Array<{
				key: string;
				name: string;
			}>;

			let filteredPipelines = pipelines;
			if (filter) {
				const filterLower = filter.toLowerCase();
				filteredPipelines = pipelines.filter(
					(pipeline) =>
						pipeline &&
						pipeline.key &&
						((pipeline.name || '').toLowerCase().includes(filterLower) ||
							pipeline.key.toLowerCase().includes(filterLower)),
				);
			}

			const results = filteredPipelines
				.filter((pipeline) => pipeline && pipeline.key)
				.map((pipeline) => ({
					name: `${pipeline.name || 'Unnamed Pipeline'} (${pipeline.key || 'no-key'})`,
					value: pipeline.key || '',
					url: `https://www.streak.com/pipeline/${pipeline.key || 'no-key'}`,
				}));

			return { results };
		} catch {
			return { results: [] };
		}
	},

	async getStageOptions(
		this: ILoadOptionsFunctions,
		filter?: string,
	): Promise<INodeListSearchResult> {
		try {
			const pipelineKey = extractParamValue(this.getCurrentNodeParameter('pipelineKey'));
			if (!pipelineKey) return { results: [] };

			const response = await streakApiRequest(
				this,
				'GET',
				`/pipelines/${pipelineKey}/stages`,
			);
			const stages = parseStagesResponse(response);

			let filteredStages = stages;
			if (filter) {
				const filterLower = filter.toLowerCase();
				filteredStages = stages.filter(
					(stage) =>
						stage &&
						stage.key &&
						((stage.name || '').toLowerCase().includes(filterLower) ||
							stage.key.toLowerCase().includes(filterLower)),
				);
			}

			const results = filteredStages
				.filter((stage) => stage && stage.key)
				.map((stage) => ({
					name: `${stage.name || 'Unnamed Stage'} (${stage.key || 'no-key'})`,
					value: stage.key || '',
					url: `https://www.streak.com/pipeline/${pipelineKey}/stage/${stage.key || 'no-key'}`,
				}));

			return { results };
		} catch {
			return { results: [] };
		}
	},

	async getBoxOptions(
		this: ILoadOptionsFunctions,
		filter?: string,
	): Promise<INodeListSearchResult> {
		try {
			const pipelineKey = extractParamValue(this.getCurrentNodeParameter('pipelineKey'));
			if (!pipelineKey) return { results: [] };

			// This goes to v2, which wraps the boxes as { results: [...] }
			const boxes = parseBoxesResponse(
				await streakApiRequest(this, 'GET', `/pipelines/${pipelineKey}/boxes`),
			);

			let filteredBoxes = boxes;
			if (filter) {
				const filterLower = filter.toLowerCase();
				filteredBoxes = boxes.filter(
					(box) =>
						box &&
						box.key &&
						((box.name || '').toLowerCase().includes(filterLower) ||
							box.key.toLowerCase().includes(filterLower)),
				);
			}

			const results = filteredBoxes
				.filter((box) => box && box.key)
				.map((box) => ({
					name: `${box.name || 'Unnamed Box'} (${box.key || 'no-key'})`,
					value: box.key || '',
					url: `https://www.streak.com/box/${box.key || 'no-key'}`,
				}));

			return { results };
		} catch {
			return { results: [] };
		}
	},

	async getFieldOptions(
		this: ILoadOptionsFunctions,
		filter?: string,
	): Promise<INodeListSearchResult> {
		try {
			const fields = await getFieldsForCurrentBox(this);
			// Exclude types that have their own dedicated dropdowns
			const excludeTypes = ['FORMULA', 'CHECKBOX', 'DATE', 'DROPDOWN', 'TAG'];
			const typed = fields.filter((f) => !excludeTypes.includes(f.type));
			const filtered = applyFilter(typed, filter, (f) => `${f.name || ''} ${f.key}`);

			return {
				results: filtered
					.filter((f) => f.key)
					.map((f) => ({
						name: `${f.name || 'Unnamed Field'} (${f.type || 'unknown'})`,
						value: f.key,
					})),
			};
		} catch {
			return { results: [] };
		}
	},

	async getCheckboxFieldOptions(
		this: ILoadOptionsFunctions,
		filter?: string,
	): Promise<INodeListSearchResult> {
		return getFieldOptionsByType.call(this, 'CHECKBOX', filter);
	},

	async getDateFieldOptions(
		this: ILoadOptionsFunctions,
		filter?: string,
	): Promise<INodeListSearchResult> {
		return getFieldOptionsByType.call(this, 'DATE', filter);
	},

	async getDropdownFieldOptions(
		this: ILoadOptionsFunctions,
		filter?: string,
	): Promise<INodeListSearchResult> {
		return getFieldOptionsByType.call(this, 'DROPDOWN', filter);
	},

	async getTagFieldOptions(
		this: ILoadOptionsFunctions,
		filter?: string,
	): Promise<INodeListSearchResult> {
		return getFieldOptionsByType.call(this, 'TAG', filter);
	},

	async getDropdownValueOptions(
		this: ILoadOptionsFunctions,
		filter?: string,
	): Promise<INodeListSearchResult> {
		try {
			const fields = await getFieldsForCurrentBox(this);
			const results: Array<{ name: string; value: string }> = [];

			// Read the sibling field key from the full parameter tree
			let selectedFieldKey: string | undefined;
			try {
				const allParams = this.getCurrentNodeParameters() as Record<string, unknown>;
				const uf = allParams?.updateFields as Record<string, unknown>;
				const cf = uf?.customFields as Record<string, unknown>;
				const entries = cf?.dropdownField as Array<{ key: { value: string } }>;
				if (entries?.length) {
					selectedFieldKey = entries[entries.length - 1]?.key?.value;
				}
			} catch {
				// Fall back to showing all options
			}

			const dropdownFields = fields.filter(
				(f) => f.type === 'DROPDOWN' && f.dropdownSettings?.items,
			);
			const needsPrefix = !selectedFieldKey && dropdownFields.length > 1;

			for (const field of dropdownFields) {
				if (selectedFieldKey && field.key !== selectedFieldKey) continue;
				for (const item of field.dropdownSettings!.items) {
					if (!item.key) continue;
					const name = needsPrefix ? `${field.name} \u2192 ${item.name}` : item.name;
					if (filter && !name.toLowerCase().includes(filter.toLowerCase())) continue;
					results.push({ name, value: item.key });
				}
			}

			return { results };
		} catch {
			return { results: [] };
		}
	},

	async getTeamSearchOptions(
		this: ILoadOptionsFunctions,
		filter?: string,
	): Promise<INodeListSearchResult> {
		try {
			const response = await streakApiRequest(this, 'GET', '/users/me/teams');
			const teams = parseTeamsResponse(response);

			let filteredTeams = teams;
			if (filter) {
				const filterLower = filter.toLowerCase();
				filteredTeams = teams.filter(
					(team) =>
						team &&
						team.key &&
						((team.name || '').toLowerCase().includes(filterLower) ||
							team.key.toLowerCase().includes(filterLower)),
				);
			}

			const results = filteredTeams
				.filter((team) => team && team.key)
				.map((team) => ({
					name: `${team.name || 'Unnamed Team'} (${team.key || 'no-key'})`,
					value: team.key || '',
					url: `https://www.streak.com/team/${team.key || 'no-key'}`,
				}));

			return { results };
		} catch {
			return { results: [] };
		}
	},
};
