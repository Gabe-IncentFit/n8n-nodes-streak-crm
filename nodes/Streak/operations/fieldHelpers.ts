import { IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import { streakApiRequest } from './utils';

export interface StreakFieldDef {
	key: string;
	name: string;
	type: string;
	dropdownSettings?: { items: Array<{ key: string; name: string }> };
	tagSettings?: { tags: Array<{ key: string; tag: string }> };
}

/**
 * Look up a box field's definition through the box's pipeline.
 */
export async function getFieldDef(
	context: IExecuteFunctions,
	boxKey: string,
	fieldKey: string,
): Promise<StreakFieldDef | undefined> {
	const box = (await streakApiRequest(context, 'GET', `/boxes/${boxKey}`)) as { pipelineKey: string };
	if (!box?.pipelineKey) return undefined;
	const fields = (await streakApiRequest(
		context, 'GET', `/pipelines/${box.pipelineKey}/fields`,
	)) as unknown as StreakFieldDef[];
	return fields.find((f) => f.key === fieldKey);
}

/**
 * Find a dropdown option by its key or, ignoring case, by its name.
 */
function findDropdownItem(
	field: StreakFieldDef | undefined,
	value: string,
): { key: string; name: string } | undefined {
	const items = field?.dropdownSettings?.items || [];
	return (
		items.find((i) => i.key === value) ||
		items.find((i) => i.name.toLowerCase() === value.toLowerCase())
	);
}

export async function resolveDropdownValue(
	context: IExecuteFunctions,
	boxKey: string,
	fieldKey: string,
	value: string,
): Promise<string> {
	const field = await getFieldDef(context, boxKey, fieldKey);
	return findDropdownItem(field, value)?.key ?? value;
}

/**
 * Streak types box field values: a checkbox takes a boolean, a tag field an array of tag keys,
 * a dropdown an option key and a date epoch milliseconds. Convert a value given as text to what
 * the field expects. Anything that isn't text, such as an array from an expression, is sent as is.
 */
export function toFieldValue(
	context: IExecuteFunctions,
	field: StreakFieldDef | undefined,
	value: unknown,
	itemIndex: number,
): unknown {
	if (!field || typeof value !== 'string') return value;

	const text = value.trim();

	switch (field.type) {
		case 'CHECKBOX': {
			const lower = text.toLowerCase();
			if (lower === 'true') return true;
			if (lower === 'false') return false;
			throw new NodeOperationError(
				context.getNode(),
				`"${field.name}" is a checkbox field, so its value must be true or false (got "${value}")`,
				{ itemIndex },
			);
		}
		case 'TAG': {
			const tags = field.tagSettings?.tags || [];
			return text
				.split(',')
				.map((t) => t.trim())
				.filter(Boolean)
				.map((t) => {
					const tag =
						tags.find((x) => x.key === t) || tags.find((x) => x.tag.toLowerCase() === t.toLowerCase());
					if (!tag) {
						throw new NodeOperationError(context.getNode(), `"${field.name}" has no tag "${t}"`, {
							itemIndex,
						});
					}
					return tag.key;
				});
		}
		case 'DROPDOWN':
			// An unknown option is sent as is, and Streak explains what's wrong
			return findDropdownItem(field, text)?.key ?? value;
		case 'DATE': {
			if (/^-?\d+$/.test(text)) return Number(text);
			const ms = new Date(text).getTime();
			return Number.isNaN(ms) ? value : ms;
		}
		default:
			return value;
	}
}
