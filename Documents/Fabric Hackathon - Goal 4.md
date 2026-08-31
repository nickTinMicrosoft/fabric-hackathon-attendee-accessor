---
layout: page
title: Goal 4 - Build Gold and serve insights
---

# Goal 4: Build Gold marts and serve trusted insights

Create a business-ready layer that combines assessments, comparable sales,
property characteristics, inspections, and AI-enriched appeals.

## Deliverables

- reusable Gold marts
- a star-schema semantic model
- a Power BI report
- a Fabric data agent grounded in curated data
- documented limitations and safety guidance

## Build the Gold layer

Create `GoldLakehouse` with **Lakehouse schemas enabled** before importing the
notebook. The Gold marts are written to its `dbo` schema.

Import
[`4 - Property Assessment Gold Marts.ipynb`](../Notebooks/4%20-%20Property%20Assessment%20Gold%20Marts.ipynb)
as a starting point.

Recommended marts:

| Mart | Business questions |
|---|---|
| `property_assessment_mart` | What is the latest assessed value and estimated tax for each property? |
| `comparable_sales_mart` | Which assessments differ materially from arm's-length sale values? |
| `appeal_intelligence_mart` | What drives appeals, and where are urgent or negative narratives concentrated? |
| `neighborhood_equity_mart` | Which neighbourhoods show unusual sales ratios, valuation changes, or appeal rates? |

## Semantic model

Use a star schema with dimensions for date, neighbourhood, property class, and
parcel. Keep assessments, sales, inspections, and appeals as separate facts at
their natural grains.

Suggested measures:

- total and average assessed value
- year-over-year valuation change
- estimated tax
- assessment-to-sale ratio
- appeal count and appeal rate
- median requested adjustment
- resolution rate
- average resolution days
- negative-sentiment rate
- AI enrichment success rate

Reference: [Star schema guidance](https://learn.microsoft.com/power-bi/guidance/star-schema)

## Report ideas

1. **Assessment overview:** values, taxes, classes, and neighbourhood trends.
2. **Comparable sales:** assessment-to-sale distributions and outliers.
3. **Appeal operations:** volume, status, reasons, resolution time, and outcomes.
4. **Appeal intelligence:** sentiment, summaries, themes, and follow-up signals.
5. **Property detail:** parcel, building, assessment, sale, inspection, and
   appeal history.

## Data agent

Import
[`5 - Property Assessment Data Agent Lab.ipynb`](../Notebooks/5%20-%20Property%20Assessment%20Data%20Agent%20Lab.ipynb)
for grounding instructions and evaluation questions.

The agent must:

- use only curated Gold tables or the semantic model
- state that values and taxes are synthetic
- distinguish assessed value from sale price
- avoid presenting AI sentiment as an appeal decision
- say when a question cannot be answered from the available data

Reference: [Create a Fabric data agent](https://learn.microsoft.com/fabric/data-science/how-to-create-data-agent)

## Completion check

Demonstrate one traceable story from source to decision support:

1. select a neighbourhood or property class
2. identify a valuation or comparable-sales pattern
3. inspect associated appeal themes
4. explain the result through the report or data agent
5. show the source keys and transformations supporting the answer

---

**Navigation:** [Previous: Goal 3](Fabric%20Hackathon%20-%20Goal%203.md) | [Documents](README.md)
