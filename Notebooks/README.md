# Fabric notebooks

Import these notebooks into a Fabric workspace and run them in order. Each
notebook exposes logical Fabric item names near the top so it can be adapted to
the lab without embedding Azure server, database, or storage names.

| Order | Notebook | Purpose |
|---|---|---|
| 1 | `1 - SQL Assessment to Silver.ipynb` | Conform mirrored SQL parcel, assessment, sale, and reference tables |
| 2 | `2 - Cosmos Property Profiles to Silver.ipynb` | Use detailed Fabric Copilot prompts to flatten property documents and explode inspection arrays |
| 3 | `3 - ADLS Appeals to Silver and AI.ipynb` | Load appeal Parquet, enforce schema, and add AI-derived signals |
| 3a | `3a - ADLS Appeals with Foundry AI.ipynb` | Alternate Foundry chat-model enrichment using a Variable Library |
| 4 | `4 - Property Assessment Gold Marts.ipynb` | Build joined analytical marts in the Gold Lakehouse |
| 5 | `5 - Property Assessment Data Agent Lab.ipynb` | Build the Gold ontology, configure agent grounding, and evaluate relationship-aware questions |

Completed reference versions are available in [`Answers`](Answers/). Notebook 2
in the main folder intentionally contains only Markdown instructions, Copilot
prompts, and empty code cells.

## Expected workspace items

- an Azure SQL mirrored database
- a Cosmos DB mirrored database
- `BronzeLakehouse` with an `appeals` shortcut
- `SilverLakehouse` with Lakehouse schemas enabled
- `GoldLakehouse` with Lakehouse schemas enabled
- `PropertyAssessmentOntology` created during Goal 4
- `HackathonVariables` when using the optional Foundry notebook

If your facilitator uses different Fabric item names, change the parameter cell
in the relevant notebook. Do not insert source credentials into notebook cells.

## Safety

All records are synthetic. Notebook outputs are analytical demonstrations and
must not be used for real property valuation, taxation, or appeal decisions.
