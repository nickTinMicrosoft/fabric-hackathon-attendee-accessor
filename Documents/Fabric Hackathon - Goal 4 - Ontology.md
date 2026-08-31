---
layout: page
title: Goal 4 - Model a Fabric ontology
---

# Model the property-assessment ontology

Create a governed business vocabulary over the Gold marts before configuring
the data agent. The ontology makes properties, neighbourhoods, sales, and
appeals explicit business concepts and turns their shared keys into traversable
relationships.

Fabric Ontology is a preview capability in the Fabric IQ workload. Your tenant
administrator must enable the **Ontology item (preview)** setting before this
exercise. The separate
[Fabric data agent tenant settings](https://learn.microsoft.com/fabric/data-science/data-agent-tenant-settings)
must also be enabled before the agent portion of the lab. Complete notebook 4
first so all four managed Gold Delta tables exist.

## Create the ontology item

1. In the Fabric workspace, select **New item** and create an **Ontology**.
2. Name the item `PropertyAssessmentOntology`. Ontology item names support
   letters, numbers, and underscores; don't use spaces or dashes.
3. Choose to build directly from OneLake. Do not generate this ontology from
   the semantic model.

Direct OneLake binding is intentional. It exposes the entity keys, property
bindings, and relationship mappings that an automatically generated model
would hide from the exercise.

## Create and bind entity types

Create the following entity types. For each one, select **Bind data**, browse to
`GoldLakehouse`, choose the table in the `dbo` schema, map the listed
properties, define the entity key, and select the suggested display property.

Ontology property names in this guide are globally distinct and no longer than
26 characters. Keep the source columns unchanged.

### Property

Source: `dbo.property_assessment_mart`

| Source column | Ontology property | Use |
|---|---|---|
| `parcel_id` | `PropertyId` | **Entity key** |
| `parcel_number` | `PropertyNumber` | Display property |
| `synthetic_address` | `PropertyAddress` | Fabricated location label |
| `neighborhood_id` | `PropertyNeighborhoodId` | Relationship key |
| `neighborhood_name` | `PropertyNeighborhoodName` | Context |
| `property_class_code` | `PropertyClassCode` | Classification key |
| `property_class_name` | `PropertyClassName` | Classification label |
| `building_type` | `PropertyBuildingType` | Primary building type |
| `condition_code` | `PropertyCondition` | Building condition |
| `tax_year` | `PropertyTaxYear` | Latest assessment year |
| `assessed_value` | `PropertyAssessedValue` | Synthetic assessed value |
| `estimated_tax` | `PropertyEstimatedTax` | Illustrative estimated tax |
| `latest_inspection_date` | `PropertyInspectionDate` | Latest inspection |
| `follow_up_required` | `PropertyFollowUpRequired` | Inspection signal |

### Neighborhood

Source: `dbo.neighborhood_equity_mart`

| Source column | Ontology property | Use |
|---|---|---|
| `neighborhood_id` | `NeighborhoodId` | **Entity key** |
| `neighborhood_name` | `NeighborhoodName` | Display property |
| `market_area` | `NeighborhoodMarketArea` | Market grouping |
| `parcel_count` | `NeighborhoodParcelCount` | Property count |
| `average_assessed_value` | `NeighborhoodAvgValue` | Synthetic average value |
| `estimated_tax_total` | `NeighborhoodTaxTotal` | Illustrative tax total |
| `average_assessment_to_sale_ratio` | `NeighborhoodSaleRatio` | Assessment-to-sale signal |
| `appeal_count` | `NeighborhoodAppealCount` | Appeal volume |
| `appeal_rate` | `NeighborhoodAppealRate` | Appealed-property rate |
| `negative_sentiment_rate` | `NeighborhoodNegativeRate` | AI-derived signal |

### ComparableSale

Source: `dbo.comparable_sales_mart`

| Source column | Ontology property | Use |
|---|---|---|
| `sale_id` | `SaleId` | **Entity key** |
| `parcel_id` | `SalePropertyId` | Relationship key |
| `sale_date` | `SaleDate` | Display property |
| `sale_price` | `SalePrice` | Synthetic sale value |
| `sale_type` | `SaleType` | Transaction category |
| `assessment_tax_year` | `SaleAssessmentYear` | Matched assessment year |
| `assessed_value` | `SaleAssessedValue` | Matched assessed value |
| `assessment_to_sale_ratio` | `SaleAssessmentRatio` | Comparison signal |

### Appeal

Source: `dbo.appeal_intelligence_mart`

| Source column | Ontology property | Use |
|---|---|---|
| `appeal_id` | `AppealId` | **Entity key** and display property |
| `parcel_id` | `AppealPropertyId` | Property relationship key |
| `neighborhood_id` | `AppealNeighborhoodId` | Neighbourhood relationship key |
| `tax_year` | `AppealTaxYear` | Appealed assessment year |
| `submitted_date` | `AppealSubmittedDate` | Submission date |
| `reason_code` | `AppealReasonCode` | Submitted reason |
| `status` | `AppealStatus` | Workflow status |
| `outcome` | `AppealOutcome` | Resolution outcome |
| `requested_adjustment_pct` | `AppealRequestedPct` | Requested adjustment |
| `ai_sentiment` | `AppealAISentiment` | AI-derived sentiment |
| `ai_summary` | `AppealAISummary` | AI-generated summary |
| `ai_reason_code` | `AppealAIReasonCode` | AI-derived classification |
| `ai_follow_up` | `AppealAIFollowUp` | AI-derived follow-up label |
| `urgent_follow_up` | `AppealUrgentFollowUp` | Derived urgency flag |

Do not bind the original `narrative` column. The ontology and agent should use
the governed AI-derived summary and labels rather than raw appeal narratives.

## Create relationship types

Create each directional relationship, choose the mapping table, and map the
origin and target keys exactly as shown.

| Relationship | Origin | Target | Mapping table | Origin key column | Target key column |
|---|---|---|---|---|---|
| `locatedIn` | `Property` | `Neighborhood` | `property_assessment_mart` | `parcel_id` | `neighborhood_id` |
| `recordsFor` | `ComparableSale` | `Property` | `comparable_sales_mart` | `sale_id` | `parcel_id` |
| `submittedFor` | `Appeal` | `Property` | `appeal_intelligence_mart` | `appeal_id` | `parcel_id` |
| `occursIn` | `Appeal` | `Neighborhood` | `appeal_intelligence_mart` | `appeal_id` | `neighborhood_id` |

The Gold mapping tables contain both keys on every relationship row. Save each
relationship and confirm that it appears on the ontology canvas.

## Refresh and validate the graph

Refresh the graph model after saving all bindings. Upstream Lakehouse changes
aren't visible in the ontology until the graph is refreshed.

Validate all of the following:

- every Gold row produces one instance of its expected entity type
- `Property` and `Neighborhood` instances display friendly labels
- a property can traverse `locatedIn` to exactly one neighbourhood
- a comparable sale can traverse `recordsFor` to exactly one property
- an appeal can traverse both `submittedFor` and `occursIn`
- property, neighbourhood, sale, and appeal values are visible rather than null

If numeric values appear null, verify the source types in the binding. Fabric
Ontology and Graph are preview features, and type support can change. Keep the
authoritative decimal values in Gold; use a `double`-typed ontology projection
only if the lab tenant can't bind a required decimal property.

## Ground the Fabric data agent

Create or open `Property Assessment Agent`, select **Add a data source**, and
add `PropertyAssessmentOntology`. Use the ontology as the agent's only source
for this exercise so the evaluation proves that entity and relationship
grounding works.

Add `Support group by in GQL` to the agent instructions. This is the current
Microsoft-documented preview guidance for improving ontology aggregations.
Also retain the synthetic-data, measure-definition, and AI-safety instructions
from notebook 5.

Test relationship-aware questions:

1. Which properties have both a comparable sale and an appeal?
2. Show appeals for properties whose assessment-to-sale ratio is above 1.1.
3. Which neighbourhood has the highest negative appeal sentiment rate?
4. For a selected parcel, show its neighbourhood, comparable sales, and
   appeals.
5. Which appealed properties also require inspection follow-up?

Compare numeric results with the Gold tables and inspect the generated
grounding. Do not accept an answer solely because it sounds plausible.

## Completion evidence

Capture:

- the ontology canvas with four entity types and four relationships
- one instance traversal from Property to Neighborhood
- one traversal from Appeal to Property
- the graph refresh status
- the data agent showing `PropertyAssessmentOntology` as its source
- one successful relationship-aware question and one corrected or qualified
  answer

## Current preview constraints

- Ontology must be enabled at the tenant level and requires Fabric capacity.
- Fabric data agent and its required Copilot tenant settings must be enabled
  separately.
- Bound Lakehouse tables must be managed tables, must not use OneLake security,
  and must not have Delta column mapping enabled.
- Source changes require a graph refresh.
- Ontology and agent behavior can change while these features are in preview.

References:

- [What is Ontology?](https://learn.microsoft.com/fabric/iq/ontology/overview)
- [Bind data](https://learn.microsoft.com/fabric/iq/ontology/how-to-bind-data)
- [Add relationship types](https://learn.microsoft.com/fabric/iq/ontology/how-to-create-relationship-types)
- [Consume ontology from a Fabric data agent](https://learn.microsoft.com/fabric/iq/ontology/tutorial-4-create-data-agent)

---

**Navigation:** [Back to Goal 4](Fabric%20Hackathon%20-%20Goal%204.md) | [Documents](README.md)
