import {
	IExecuteFunctions,
	IHookFunctions,
	ILoadOptionsFunctions,
	IWebhookFunctions,
	IDataObject,
	NodeApiError,
	NodeOperationError,
	IHttpRequestMethods,
	JsonObject,
} from 'n8n-workflow';

/**
 * Any n8n context that supports httpRequest and getCredentials
 */
export type StreakApiContext =
	| IExecuteFunctions
	| IHookFunctions
	| ILoadOptionsFunctions
	| IWebhookFunctions;

/**
 * Mapping of endpoint patterns to their correct API versions
 * This ensures we use the correct API version for each endpoint
 */
const ENDPOINT_API_VERSIONS: Record<string, 'v1' | 'v2'> = {
	// v2 endpoints
	'/users/me/teams': 'v2',
	'/teams': 'v2',
	'/teams/': 'v2',
	'/contacts': 'v2',
	'/contacts/': 'v2',
	'/organizations': 'v2',
	'/organizations/': 'v2',
	'/tasks': 'v2',
	'/tasks/': 'v2',
	'/webhooks': 'v2',
	'/webhooks/': 'v2',
	'/comments': 'v2',
	'/comments/': 'v2',
	'/meetings': 'v2',
	'/meetings/': 'v2',
	'/timeline': 'v2',
	'/boxes/*/tasks': 'v2',
	'/boxes/batch': 'v2',
	'/boxes/*/timeline': 'v2', // Timeline for boxes uses v2
	'/pipelines/*/boxes/batch': 'v2',
	'/pipelines/*/boxes': 'v2', // Create box uses v2
	'/teams/*/contacts': 'v2', // Create contact uses v2
	'/teams/*/organizations': 'v2', // Create organization uses v2
	'/boxes/*/comments': 'v2', // Create comment uses v2
	'/boxes/*/meetings': 'v2', // Create meeting uses v2
	'/pipelines/*/webhooks': 'v2', // List webhooks for a pipeline
	'/teams/*/webhooks': 'v2', // List webhooks for a team
};

/**
 * Determine the correct API version for an endpoint
 */
export function getApiVersionForEndpoint(endpoint: string): 'v1' | 'v2' {
	// Check for exact matches first
	if (ENDPOINT_API_VERSIONS[endpoint]) {
		return ENDPOINT_API_VERSIONS[endpoint];
	}

	// Check for pattern matches
	for (const [pattern, version] of Object.entries(ENDPOINT_API_VERSIONS)) {
		if (pattern.includes('*')) {
			// Convert pattern to regex
			const regexPattern = pattern.replace(/\*/g, '[^/]+');
			const regex = new RegExp(`^${regexPattern}`);
			if (regex.test(endpoint)) {
				return version;
			}
		} else if (endpoint.startsWith(pattern)) {
			return version;
		}
	}

	// Default to v1 for unknown endpoints
	return 'v1';
}

/**
 * Make a request to the Streak API. Works from any n8n context (execute, hook, webhook, loadOptions).
 * Accepts endpoint fragments (e.g. `/users/me`) and auto-detects the API version.
 */
export async function streakApiRequest(
	context: StreakApiContext,
	method: IHttpRequestMethods,
	endpoint: string,
	body?: IDataObject | IDataObject[],
	query?: IDataObject,
	apiVersion?: 'v1' | 'v2',
): Promise<IDataObject | IDataObject[]> {
	const version = apiVersion || getApiVersionForEndpoint(endpoint);
	const url = `https://api.streak.com/api/${version}${endpoint}`;
	const headers: IDataObject = {
		Accept: 'application/json',
	};
	if (['POST', 'PUT', 'PATCH'].includes(method)) {
		headers['Content-Type'] = 'application/json';
	}
	try {
		return (await context.helpers.httpRequestWithAuthentication.call(context, 'streakApi', {
			method,
			url,
			headers,
			qs: query,
			body,
			json: true,
		})) as IDataObject | IDataObject[];
	} catch (error) {
		throw new NodeApiError(context.getNode(), error as JsonObject);
	}
}

/**
 * Make a form-encoded request to the Streak API. Used for endpoints that require
 * application/x-www-form-urlencoded bodies (e.g. createPipeline, createStage).
 */
export async function streakApiFormRequest(
	context: StreakApiContext,
	method: IHttpRequestMethods,
	endpoint: string,
	body?: IDataObject,
	query?: IDataObject,
	apiVersion?: 'v1' | 'v2',
): Promise<IDataObject | IDataObject[]> {
	const version = apiVersion || getApiVersionForEndpoint(endpoint);
	const url = `https://api.streak.com/api/${version}${endpoint}`;

	let formBody = '';
	if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
		const params = new URLSearchParams();
		for (const [key, value] of Object.entries(body)) {
			if (value !== undefined && value !== null) {
				params.append(key, String(value));
			}
		}
		formBody = params.toString();
	}

	try {
		return (await context.helpers.httpRequestWithAuthentication.call(context, 'streakApi', {
			method,
			url,
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			qs: query,
			body: formBody,
			json: true,
		})) as IDataObject | IDataObject[];
	} catch (error) {
		throw new NodeApiError(context.getNode(), error as JsonObject);
	}
}

/**
 * Validate that required parameters are present
 */
export function validateParameters(
	this: IExecuteFunctions,
	parameters: Record<string, unknown>,
	requiredParams: string[],
	itemIndex = 0,
): void {
	for (const param of requiredParams) {
		if (parameters[param] === undefined || parameters[param] === '') {
			throw new NodeOperationError(
				this.getNode(),
				`Parameter ${param} is required for this operation`,
				{ itemIndex },
			);
		}
	}
}

/**
 * Handle pagination for list operations
 */
export async function handlePagination(
	context: StreakApiContext,
	endpoint: string,
	returnAll: boolean,
	limit = 100,
	additionalParams: IDataObject = {},
	apiVersion?: 'v1' | 'v2',
): Promise<IDataObject[]> {
	let responseData: IDataObject[] = [];

	if (returnAll) {
		let hasMore = true;
		let page = 0;

		while (hasMore) {
			const query: IDataObject = {
				...additionalParams,
				page,
				limit,
			};

			const response = await streakApiRequest(
				context,
				'GET',
				endpoint,
				undefined,
				query,
				apiVersion,
			);

			const results = Array.isArray(response) ? response : [response];
			responseData = [...responseData, ...results];

			if (results.length < limit) {
				hasMore = false;
			} else {
				page++;
			}
		}
	} else {
		const query: IDataObject = {
			...additionalParams,
			page: 0,
			limit,
		};

		const response = await streakApiRequest(
			context,
			'GET',
			endpoint,
			undefined,
			query,
			apiVersion,
		);

		responseData = Array.isArray(response) ? response : [response];
	}

	return responseData;
}
