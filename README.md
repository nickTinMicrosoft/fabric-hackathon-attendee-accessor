# Microsoft Fabric Property Assessment Hackathon

Build an end-to-end analytics and AI solution using fictional property data for
Sudsberry. You will combine synthetic valuation records, flexible inspection
documents, and assessment appeal narratives in Microsoft Fabric.

All records are synthetic. They do not represent real people, addresses,
parcels, assessments, sales, or tax policy.

## What you will build

```text
Azure SQL -----------+
                     +--> OneLake Bronze --> Silver Delta --> Gold marts
Cosmos DB -----------+                           |               |
                                                 |               +--> Power BI
ADLS JSON/Parquet --> OneLake shortcut ----------+               +--> Ontology
                                                 |                       |
                                                 |                       +--> Data agent
                                                 |
                                                 +--> AI-enriched appeals
```

The challenge follows four goals:

1. Connect Azure SQL, Cosmos DB, and ADLS Gen2 to Fabric.
2. Transform the source data into conformed Silver tables.
3. use Fabric AI functions to analyze assessment appeal narratives.
4. build Gold marts, a semantic model, a report, an ontology, and an
   ontology-grounded data agent.

There are no time limits. Work through the goals at your own pace and use the
reference notebooks when you need a starting point.

## Start here

1. Read the [Introduction](Documents/Fabric%20Hackathon%20-%200%20-%20Intro.md).
2. Review the [Architecture and data schemas](Documents/Fabric%20Hackathon%20-%200%20-%20Architecture.md).
3. Complete [Goal 1](Documents/Fabric%20Hackathon%20-%20Goal%201.md).

## Repository contents

| Folder | Contents |
|---|---|
| [`Documents`](Documents/) | Introduction, architecture, goals, success criteria, and Microsoft Learn links |
| [`Notebooks`](Notebooks/) | Importable Fabric notebooks for Silver transformation, Copilot-guided development, AI enrichment, Gold marts, and a data-agent lab |
| `DataFiles` | Optional local files supplied by the facilitator |
| `Scripts` | Space for scripts created during the challenge |

## Prerequisites

- access to a Microsoft Fabric workspace on a capacity that supports notebooks
- permission to create Lakehouses, mirrored databases, shortcuts, semantic
  models, reports, ontology items, and data agents
- source connection details provided by the facilitator
- Fabric AI functions enabled for Goal 3
- Fabric Ontology (preview) enabled for Goal 4
- Fabric data agent and required Copilot tenant settings enabled for Goal 4

The source server names, database names, storage accounts, and credentials are
environment-specific and are intentionally not stored in this repository.
Use the [lab naming conventions](Documents/Fabric%20Hackathon%20-%200%20-%20Architecture.md#lab-naming-conventions)
so the notebooks can resolve shared workspace items.

## Data safety

- No personal information is included.
- All property addresses and parcel identifiers are fabricated.
- Map coordinates are demonstration points, not authoritative parcel geometry.
- Tax rates and estimated taxes are illustrative and are not legal guidance.
- AI outputs must be reviewed before they are used in any decision.

## Documentation

| Guide | Outcome |
|---|---|
| [Architecture](Documents/Fabric%20Hackathon%20-%200%20-%20Architecture.md) | Understand the services, data flow, schemas, and shared keys |
| [Goal 1](Documents/Fabric%20Hackathon%20-%20Goal%201.md) | Create the Bronze layer using mirroring and a shortcut |
| [Goal 2](Documents/Fabric%20Hackathon%20-%20Goal%202.md) | Produce clean, conformed Silver Delta tables |
| [Goal 3](Documents/Fabric%20Hackathon%20-%20Goal%203.md) | Enrich appeal narratives with AI-derived signals |
| [Goal 4](Documents/Fabric%20Hackathon%20-%20Goal%204.md) | Deliver Gold marts, analytics, ontology, and natural-language Q&A |
| [Goal 4 ontology](Documents/Fabric%20Hackathon%20-%20Goal%204%20-%20Ontology.md) | Bind Gold entities and relationships and ground the data agent |
