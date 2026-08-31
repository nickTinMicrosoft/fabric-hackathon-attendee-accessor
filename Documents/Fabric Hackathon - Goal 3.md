---
layout: page
title: Goal 3 - Apply AI to assessment appeals
---

# Goal 3: Derive intelligence from appeal narratives

Use Fabric AI functions to transform free-text appeal narratives into governed,
analytics-ready signals. Keep the original narrative and store AI output in new
columns.

## Deliverables

- sentiment label
- concise appeal summary
- normalized appeal-reason classification
- urgency or follow-up indicator
- evaluation against `ground_truth_sentiment`
- enriched Delta table suitable for Gold analytics

## Suggested approach

Continue with
[`3 - ADLS Appeals to Silver and AI.ipynb`](../Notebooks/3%20-%20ADLS%20Appeals%20to%20Silver%20and%20AI.ipynb).

Use the built-in functions appropriate to your Fabric runtime:

- `ai.analyze_sentiment`
- `ai.summarize`
- `ai.classify`
- `ai.extract`

Reference: [AI functions in Fabric](https://learn.microsoft.com/fabric/data-science/ai-functions/overview)

### Alternate Foundry path

After notebook 3 creates `dbo.fact_appeal`, you may use
[`3a - ADLS Appeals with Foundry AI.ipynb`](../Notebooks/3a%20-%20ADLS%20Appeals%20with%20Foundry%20AI.ipynb)
instead of the built-in AI cells. Notebook 3a calls a chat-model deployment,
requires structured JSON output, validates every response, and writes
`dbo.fact_appeal_foundry_ai`.

The suggested Variable Library name is `HackathonVariables`. Its active value
set supplies `foundry_endpoint`, `chat_deployment`, and `api_version`. Use
Key Vault variables for key authentication or leave them blank to use Entra
authentication. Do not paste credentials into the notebook.

## Classification taxonomy

Start with these supplied categories, then document any changes:

- `COMPARABLE_SALES`
- `PROPERTY_CONDITION`
- `DATA_CORRECTION`
- `CLASSIFICATION`
- `RENOVATION_TIMING`
- `INFORMATION_REQUEST`

## Evaluation

The seed data includes `ground_truth_sentiment` for technical evaluation.
Calculate at least:

- total enriched records
- enrichment failure or null rate
- sentiment accuracy
- a confusion matrix by ground-truth and predicted sentiment
- reason-code agreement between the supplied and AI-derived classifications

Review examples where the model disagrees with the label. A useful solution
does not hide uncertain or failed enrichment.

## Responsible AI checks

- Do not infer protected or personal characteristics.
- Do not use sentiment as an automatic approval or rejection rule.
- Treat summaries and classifications as decision support.
- Preserve lineage to the source appeal.
- Include model or function metadata and an enrichment timestamp when possible.

## Optional extensions

- extract property-condition topics
- detect requests needing human follow-up
- generate embeddings for semantic similarity among appeal narratives
- compare sentiment or themes by neighbourhood without ranking individuals

---

**Navigation:** [Previous: Goal 2](Fabric%20Hackathon%20-%20Goal%202.md) | [Next: Goal 4](Fabric%20Hackathon%20-%20Goal%204.md)
