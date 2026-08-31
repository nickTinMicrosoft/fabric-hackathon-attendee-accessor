---
layout: page
title: Introduction
---

# Property Assessment Analytics and AI

Sudsberry is a fictional municipality modernizing its property-assessment data
platform. Its information is split across three systems:

- relational parcel, building, assessment, sale, and tax-rate records
- flexible property profiles and field-inspection documents
- assessment appeal narratives stored as JSON and Parquet

Your team will connect these sources to Microsoft Fabric, transform them into a
trusted analytical model, apply AI to appeal narratives, and make the results
available through reports and natural-language questions.

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
   report, and a data agent grounded only in curated data.

## Safety statement

The municipality, addresses, parcels, inspections, appeals, values, sales, and
tax calculations are fabricated. Nothing in this challenge represents a real
taxpayer or an authoritative assessment policy.

---

**Navigation:** [Documents](README.md) | [Next: Architecture](Fabric%20Hackathon%20-%200%20-%20Architecture.md)
