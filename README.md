# n8n-nodes-streak-crm

This is an n8n community node that lets you use [Streak CRM](https://streak.com) in your n8n workflows.

Streak CRM is a powerful customer relationship management (CRM) tool integrated directly into Gmail that helps teams track leads, manage sales pipelines, and streamline customer communications.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)
[Operations](#operations)
[Trigger Events](#trigger-events)
[Credentials](#credentials)
[Compatibility](#compatibility)
[Usage](#usage)
[Resources](#resources)
[Version History](#version-history)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

```bash
npm install n8n-nodes-streak-crm
```

Or if you use n8n Desktop, you can go to **Settings > Community nodes > Install** and provide the package name `n8n-nodes-streak-crm`.

## Operations

This node supports a comprehensive set of operations across various Streak CRM resources.

### Architecture Improvements

The node now features a dedicated `StreakApiService` class that centralizes all API interactions, providing:

- Consistent error handling across all operations
- Strong TypeScript typing for better code reliability
- Improved performance with optimized request handling
- Better developer experience for future enhancements

### User Operations
- **Get Current User** - Retrieve the details of the current authenticated user
- **Get User** - Retrieve details of a specific user by key

### Team Operations
- **Get My Teams** - Retrieve all teams the current user belongs to
- **Get Team** - Retrieve details of a specific team by key

### Pipeline Operations
- **List All Pipelines** - Get all available pipelines
- **Get Pipeline** - Retrieve a specific pipeline by key
- **Create Pipeline** - Create a new pipeline with customizable properties
- **Update Pipeline** - Update properties of an existing pipeline
- **Delete Pipeline** - Remove a pipeline
- **Move Boxes Between Pipelines** - Move multiple boxes (deals) between pipelines in batch. Streak gives each moved box a new key, and the old key stops working, so use the keys in the output

### Box Operations
- **List Boxes in Pipeline** - Get all boxes (deals) in a specific pipeline
- **Get Box** - Retrieve a specific box by key
- **Get Multiple Boxes** - Retrieve multiple boxes at once
- **Create Box** - Create a new box in a pipeline
- **Update Box** - Update properties of an existing box
- **Delete Box** - Remove a box
- **Get Box Timeline** - Retrieve the timeline of events for a box

### Stage Operations
- **List Stages** - Get all stages in a pipeline
- **Get Stage** - Retrieve a specific stage by key
- **Create Stage** - Create a new stage in a pipeline
- **Update Stage** - Update properties of an existing stage
- **Delete Stage** - Remove a stage from a pipeline

### Field Operations
- **List Fields** - Get all fields in a pipeline
- **Get Field** - Retrieve a specific field by key
- **Create Field** - Create a new field in a pipeline
- **Update Field** - Update properties of an existing field
- **Delete Field** - Remove a field from a pipeline
- **List Field Values** - Get all field values for a box
- **Get Field Value** - Retrieve a specific field value
- **Update Field Value** - Update a field value for a box. Text is converted to what the field needs: true or false for a checkbox, tag names or keys (separated by commas) for a tag field, an option name or key for a dropdown, and a date or epoch milliseconds for a date

### Contact Operations
- **Get Contact** - Retrieve a specific contact by key
- **Create Contact** - Create a new contact
- **Update Contact** - Update properties of an existing contact, including custom fields and links to other contacts and organizations
- **Delete Contact** - Remove a contact

### Organization Operations
- **Get Organization** - Retrieve a specific organization by key
- **Create Organization** - Create a new organization. Turn on **Return Existing If Found** to get the organization that already has one of the domains instead of a duplicate
- **Check Existing Organizations** - Find an organization by domain. If none matches, Streak creates one with those domains
- **Update Organization** - Update properties of an existing organization, including custom fields and links to contacts and other organizations
- **Delete Organization** - Remove an organization

### Task Operations
- **Get Task** - Retrieve a specific task by key
- **Get Tasks in Box** - Get all tasks associated with a box
- **Create Task** - Create a new task for a box
- **Update Task** - Update properties of an existing task
- **Delete Task** - Remove a task

### Comment Operations
- **List Comments** - Get all comments on a box
- **Get Comment** - Retrieve a specific comment by key
- **Create Comment** - Add a comment to a box
- **Delete Comment** - Remove a comment

### Meeting Operations
- **List Meetings** - Get all meetings for a box
- **Get Meeting** - Retrieve a specific meeting by key
- **Create Meeting** - Create a new meeting for a box
- **Update Meeting** - Update properties of an existing meeting
- **Delete Meeting** - Remove a meeting

### Thread Operations
- **List Threads** - Get all threads for a box
- **Get Thread** - Retrieve a specific thread by key
- **Get Thread by Gmail ID** - Retrieve a thread using its Gmail ID
- **Add Thread to Box** - Link a Gmail thread to a box

### File Operations
- **List Files in Box** - Get all files attached to a box
- **Get File Metadata** - Retrieve a specific file's metadata by key
- **Get File Contents** - Download a file as binary data, in the field set by **Put Output File in Field** (default `data`). Only for files of type `GMAIL_API`
- **Add File to Box** - Attach one or more Google Drive files to a box in a single request

### Newsfeed Operations
- **Get Pipeline Newsfeed** - Get recent activity for a pipeline
- **Get Box Newsfeed** - Get recent activity for a box
- **Get All Newsfeed** - Get all recent activity

### Snippet Operations
- **List Snippets** - Get all snippets
- **Get Snippet** - Retrieve a specific snippet by key
- **Create Snippet** - Create a new snippet
- **Delete Snippet** - Remove a snippet

### Webhook Operations
- **List Webhooks** - Get all webhooks for a pipeline or team
- **Get Webhook** - Retrieve a specific webhook by key
- **Create Webhook** - Create a new webhook for a pipeline or team event
- **Delete Webhook** - Remove a webhook

### Search Operations
- **Search by Query** - Search across Streak using a query string
- **Search by Name** - Search for boxes by name

## Trigger Events

The **Streak Trigger** node starts workflows automatically when events occur in Streak. Webhooks can be scoped to a specific pipeline or team.

Each event belongs to one scope: Contact and Org events need **Team** scope, and all other events need **Pipeline** scope. The Event list only shows events for the selected scope.

Streak sends events to n8n's webhook URL, so n8n must be reachable from the internet. A trigger on `localhost` won't receive events.

### Supported Events

| Event | Scope | Description |
|-------|-------|-------------|
| Box Create | Pipeline | A new box is created |
| Box Delete | Pipeline | A box is deleted |
| Box Edit | Pipeline | A box's fields, notes, assignments, or name change |
| Box Change Stage | Pipeline | A box moves to a different stage |
| Box Change Pipeline | Pipeline | A box is transferred to a different pipeline |
| Box New Email Address | Pipeline | A new email address is detected on a box |
| Stage Create | Pipeline | A new stage is created |
| Comment Create | Pipeline | A comment is added to a box |
| Meeting Create | Pipeline | A meeting is created |
| Meeting Update | Pipeline | A meeting is updated |
| Task Create | Pipeline | A task is created |
| Task Complete | Pipeline | A task is marked complete |
| Task Due | Pipeline | A task reaches its due date |
| Task Updated | Pipeline | A task is updated |
| Contact Create | Team | A contact is created |
| Contact Update | Team | A contact is updated |
| Contact Delete | Team | A contact is deleted |
| Org Create | Team | An organization is created |
| Org Update | Team | An organization is updated |
| Org Delete | Team | An organization is deleted |

## Credentials

To use this node, you need an API key from Streak CRM.

### How to get your API key:

1. Log in to your Streak account at [streak.com](https://streak.com)
2. Go to **Settings** > **API** 
3. Copy your API key

In n8n, create a new credential of type **Streak CRM API** and enter your API key.

## Compatibility

This node was developed and tested with n8n version 1.0.0 and uses Streak API v1 and v2.

## Usage

### Example: Creating a new pipeline and adding a box (deal)

This is a simple workflow to create a pipeline and then add a box to it:

1. **Streak CRM node** with operation **Create Pipeline**
   - Set name: `New Sales Pipeline`
   - Optional: Add description, team key, and other properties

2. **Streak CRM node** with operation **Create Box**
   - Use the pipeline key from the previous node
   - Set name: `Potential Client`
   - Optional: Add stage key and other properties

### Example: Triggering a workflow when a box changes stage

1. Add a **Streak Trigger** node
   - Set scope to **Pipeline** and select your pipeline
   - Set event to **Box Change Stage**
2. Activate the workflow — it will now run automatically whenever a box moves between stages

### Example: Managing contacts and linking them to boxes

1. **Streak CRM node** with operation **Create Contact**
   - Set email: `client@example.com`
   - Add fields for name, organization, etc.

2. **Streak CRM node** with operation **Update Box**
   - Use an existing box key
   - Link the contact by updating field values

### Fetching one page at a time

**List All Pipelines**, **List Boxes in Pipeline**, **List Field Values**, **Get Tasks in Box**, **List Meetings in Box**, **List Snippets**, **List Files in Box** and the three **Newsfeed** operations have a **Page** option, shown when **Return All** is off. Pages start at 0: page 0 is the first **Limit** results, page 1 the next **Limit**, and so on. Page defaults to 0, so existing workflows keep fetching the first page.

- Streak returns at most 1000 boxes or tasks per page, so keep **Limit** at 1000 or below for those. Streak doesn't document a maximum for the others.
- On List Boxes, **Sort By** and **Stage** apply to every page. Both sort orders are newest first.
- On List Boxes, Page only works without a **Search Query**. With a search query, any page other than 0 is rejected.
- Streak removes items you can't access after it builds each page, so a page can come back short, or even empty, before the end.

**Get Box Timeline** has Return All and Limit but no Page, because Streak pages the timeline by time rather than page number. To step back through it, set **Start Timestamp** to the oldest entry you've already fetched.

**List Threads in Box** also has Return All and Limit but no Page, because Streak returns an empty page 1 for threads.

**Get All Newsfeed** returns at most the 100 newest events, even with Return All on, and pages past the first 100 come back empty, because Streak keeps only 100 events for that feed.

The other list operations have no Return All, Limit or Page. Streak returns all of their results in one response, so they always output everything.

### Example: Looping through boxes newest first until a cutoff date

This fetches boxes created in the last 90 days, 100 at a time, without loading the whole pipeline:

1. **Streak CRM node** with operation **List Boxes in Pipeline**
   - Sort By: **Creation Date**
   - Return All: off
   - Limit: `100`
   - Page: `{{ $runIndex }}` (0 on the first pass, 1 on the next, and so on)
   - In the node's **Settings**, turn on **Always Output Data** so an empty page still reaches the next node
2. Process the boxes on a branch from the Streak CRM node. The last page can include boxes older than the cutoff, so filter on `creationTimestamp` there.
3. **Code node** (Run Once for All Items) that decides whether to fetch another page. It returns a single item, so the Streak CRM node runs once per page rather than once per box:

   ```js
   const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
   const boxes = $input.all().map((item) => item.json).filter((box) => box.boxKey);
   const oldest = Math.min(...boxes.map((box) => box.creationTimestamp));
   return [{ json: { more: boxes.length > 0 && oldest >= cutoff } }];
   ```

4. **If node** that checks `{{ $json.more }}` is true, with its true output connected back to the Streak CRM node.

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
* [Streak API Documentation](https://streak.readme.io/reference/about-the-streak-api)
* [Streak User Guide](https://streak.com/support/articles)

## Version History

### 1.2.0
- Added **Streak Trigger** node with webhook support for 20 event types
- Webhooks can be scoped to a pipeline or team
- Automatic webhook registration/cleanup on workflow activate/deactivate
- Added Comment operations (list, get, create, delete)
- Added Meeting operations (list, get, create, update, delete)
- Added Thread operations (list, get, get by Gmail ID, add to box)
- Added File operations (list, get metadata, get contents, add Google Drive file to box)
- Added Newsfeed operations (pipeline, box, all)
- Added Snippet operations (list, get, create, delete)
- Added Search operations (by query, by name)

### 1.0.3
- Added a comprehensive StreakApiService class to centralize API interactions
- Improved pipeline selection with dynamic dropdown loading
- Fixed Box Keys field handling in Move Boxes operation
- Enhanced error handling and API request consistency
- Added TypeScript interfaces for better type safety

### 1.0.2
- Initial release with comprehensive support for Users, Teams, Pipelines, Boxes, Stages, Fields, Contacts, Organizations, and Tasks
- Support for pagination in list operations
- Detailed error handling

## License

[MIT](LICENSE.md)
