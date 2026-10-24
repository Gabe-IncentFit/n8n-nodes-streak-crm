import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

// Import the methods
import { loadOptions, listSearch } from './methods/loadOptions';

// Import the consolidated properties
import { nodeProperties } from './properties';

// Import operation handlers
import { handleUserOperations } from './operations/userOperations';
import { handleTeamOperations } from './operations/teamOperations';
import { handlePipelineOperations } from './operations/pipelineOperations';
import { handleBoxOperations } from './operations/boxOperations';
import { handleStageOperations } from './operations/stageOperations';
import { handleFieldOperations } from './operations/fieldOperations';
import { handleContactOperations } from './operations/contactOperations';
import { handleOrganizationOperations } from './operations/organizationOperations';
import { handleTaskOperations } from './operations/taskOperations';
import { handleCommentOperations } from './operations/commentOperations';
import { handleMeetingOperations } from './operations/meetingOperations';
import { handleThreadOperations } from './operations/threadOperations';
import { handleFileOperations } from './operations/fileOperations';
import { getFileContents } from './operations/fileContents';
import { handleNewsfeedOperations } from './operations/newsfeedOperations';
import { handleSnippetOperations } from './operations/snippetOperations';
import { handleSearchOperations } from './operations/searchOperations';
import { handleWebhookOperations } from './operations/webhookOperations';

export class Streak implements INodeType {
	// Define methods required by n8n for resource locators and dynamic data loading
	methods = {
		loadOptions,
		listSearch,
	};

	description: INodeTypeDescription = {
		displayName: 'Streak',
		name: 'streak',
		group: ['transform'],
		version: 1,
		description: 'Streak CRM Node',
		icon: 'file:streak.svg',
		defaults: {
			name: 'Streak',
		},
		credentials: [
			{
				displayName: 'Streak API Key',
				name: 'streakApi',
				required: true,
			},
		],
		usableAsTool: true,
		/**
		 * Waiting on this to be merged into n8n
		 * @https://github.com/n8n-io/n8n/pull/10595
		 */
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		properties: nodeProperties,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// Process each item
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const resource = this.getNodeParameter('resource', itemIndex) as string;
				const operation = this.getNodeParameter('operation', itemIndex) as string;
				let responseData: IDataObject | IDataObject[];

				// File contents come back as binary data, not JSON
				if (resource === 'file' && operation === 'getFileContents') {
					const item = await getFileContents.call(this, itemIndex);
					returnData.push({ ...item, pairedItem: { item: itemIndex } });
					continue;
				}

				// Route to appropriate operation handler based on resource
				if (resource === 'user') {
					responseData = await handleUserOperations.call(this, operation, itemIndex);
				} else if (resource === 'team') {
					responseData = await handleTeamOperations.call(this, operation, itemIndex);
				} else if (resource === 'pipeline') {
					responseData = await handlePipelineOperations.call(this, operation, itemIndex);
				} else if (resource === 'box') {
					responseData = await handleBoxOperations.call(this, operation, itemIndex);
				} else if (resource === 'stage') {
					responseData = await handleStageOperations.call(this, operation, itemIndex);
				} else if (resource === 'field') {
					responseData = await handleFieldOperations.call(this, operation, itemIndex);
				} else if (resource === 'contact') {
					responseData = await handleContactOperations.call(this, operation, itemIndex);
				} else if (resource === 'organization') {
					responseData = await handleOrganizationOperations.call(
						this,
						operation,
						itemIndex,
					);
				} else if (resource === 'task') {
					responseData = await handleTaskOperations.call(this, operation, itemIndex);
				} else if (resource === 'comment') {
					responseData = await handleCommentOperations.call(this, operation, itemIndex);
				} else if (resource === 'meeting') {
					responseData = await handleMeetingOperations.call(this, operation, itemIndex);
				} else if (resource === 'thread') {
					responseData = await handleThreadOperations.call(this, operation, itemIndex);
				} else if (resource === 'file') {
					responseData = await handleFileOperations.call(this, operation, itemIndex);
				} else if (resource === 'newsfeed') {
					responseData = await handleNewsfeedOperations.call(
						this,
						operation,
						itemIndex,
					);
				} else if (resource === 'snippet') {
					responseData = await handleSnippetOperations.call(this, operation, itemIndex);
				} else if (resource === 'search') {
					responseData = await handleSearchOperations.call(this, operation, itemIndex);
				} else if (resource === 'webhook') {
					responseData = await handleWebhookOperations.call(this, operation, itemIndex);
				} else {
					throw new NodeOperationError(
						this.getNode(),
						`The resource "${resource}" is not supported!`,
						{ itemIndex },
					);
				}

				// Process the response
				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData),
					{ itemData: { item: itemIndex } },
				);
				returnData.push(...executionData);
			} catch (error) {
				// Handle errors
				if (this.continueOnFail()) {
					const executionErrorData = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray({ error: error.message }),
						{ itemData: { item: itemIndex } },
					);
					returnData.push(...executionErrorData);
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
