---
layout: page
title: Introduction
---

# Property Assessment Analytics and AI

This lab uses fictional property-assessment data for Sudsberry. The synthetic
scenario organizes its information across three systems:

- relational parcel, building, assessment, sale, and tax-rate records
- flexible property profiles and field-inspection documents
- assessment appeal narratives stored as JSON and Parquet

Your team will connect these sources to Microsoft Fabric, transform them into a
trusted analytical model, apply AI to appeal narratives, and make the results
available through reports and natural-language questions.

## Lab naming conventions

Use these names unless your facilitator provides alternatives:

| Fabric item | Convention |
|---|---|
| Bronze Lakehouse | `BronzeLakehouse` |
| Silver Lakehouse | `SilverLakehouse`, with Lakehouse schemas enabled |
| Gold Lakehouse | `GoldLakehouse`, with Lakehouse schemas enabled |
| ADLS shortcut under Bronze Files | `appeals` |
| SQL mirrored database | Suggested: `Property Assessment SQL Mirror` |
| Cosmos mirrored database | Suggested: `Property Profiles Mirror` |
| Foundry Variable Library | Suggested: `HackathonVariables` |
| Fabric ontology | Required for Goal 4: `PropertyAssessmentOntology` |
| Managed table schema | `dbo` |

The three Lakehouse names and `dbo` schema are used directly by the notebooks.
Mirror names remain editable notebook variables because facilitators may assign
different names in each lab. The architecture guide contains the complete
naming contract.

## Challenge principles

- There are no time limits.
- Use the provided goals as guardrails, not as a single prescribed solution.
- Keep transformations repeatable and avoid manual corrections to individual
  rows.
- Record assumptions and data-quality decisions.
- Treat every value as synthetic demonstration data.
- Review AI output and measure it against the supplied ground-truth sentiment.

## Success criteria

1. **Connect all three sources.** Mirror Azure SQL and Cosmos DB and expose ADLS
   Gen2 files through a OneLake shortcut.
2. **Build a Silver layer.** Produce typed, deduplicated Delta tables joined by
   stable business keys.
3. **Create AI-derived appeal signals.** Add sentiment, summary, classification,
   and urgency fields without changing the original narrative.
4. **Deliver business-ready analytics.** Build Gold marts, a semantic model, a
   report, a Fabric ontology, and an ontology-grounded data agent.

## Safety statement

The addresses, parcels, inspections, appeals, values, sales, and tax
calculations are fabricated. Nothing in this challenge represents a real
taxpayer, property record, or authoritative assessment policy.

---

**Navigation:** [Documents](README.md) | [Next: Architecture](Fabric%20Hackathon%20-%200%20-%20Architecture.md)
