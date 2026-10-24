import { IDataObject, IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import { parseKeyList } from './utils';

/**
 * Helpers for the custom fields and links that contacts and organizations share.
 * Streak only accepts these on update, not on create.
 */

/**
 * Turn the Custom Fields entries into Streak's `fields` map of field key to text.
 * Returns undefined when there are no entries, so the request leaves `fields` out.
 */
export function getCustomFieldValues(
	this: IExecuteFunctions,
	customFields: unknown,
	itemIndex: number,
): IDataObject | undefined {
	const entries = ((customFields as IDataObject | undefined)?.field ?? []) as IDataObject[];
	if (entries.length === 0) {
		return undefined;
	}

	const fields: IDataObject = {};
	for (const entry of entries) {
		const key = String(entry.key ?? '').trim();
		if (!key) {
			throw new NodeOperationError(
				this.getNode(),
				'Choose a field for each Custom Fields entry',
				{ itemIndex },
			);
		}
		fields[key] = String(entry.value ?? '');
	}

	return fields;
}

/**
 * Turn contact or organization keys into the link objects Streak takes. An empty list
 * stays empty, which tells Streak to remove every link of that kind.
 */
export function toLinks(keys: unknown): IDataObject[] {
	return parseKeyList(keys).map((key) => ({ key }));
}
