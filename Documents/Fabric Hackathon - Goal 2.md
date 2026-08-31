---
layout: page
title: Goal 2 - Build the Silver layer
---

# Goal 2: Build conformed Silver tables

Transform the mirrored and shortcutted Bronze data into typed, deduplicated
Delta tables in a `SilverLakehouse`.

## Deliverables

- conformed parcel, assessment, sale, property-class, and neighbourhood tables
- a flattened property-profile table
- an exploded inspection fact
- a typed assessment-appeal table
- data-quality assertions for shared keys and synthetic-data flags

## Suggested approach

1. Create `SilverLakehouse` with **Lakehouse schemas enabled**, then attach it
   to the notebooks. The provided notebooks write tables to the `dbo` schema.
2. Import
   [`1 - SQL Assessment to Silver.ipynb`](../Notebooks/1%20-%20SQL%20Assessment%20to%20Silver.ipynb).
3. Set its SQL mirror item parameter and run every cell.
4. Import
   [`2 - Cosmos Property Profiles to Silver.ipynb`](../Notebooks/2%20-%20Cosmos%20Property%20Profiles%20to%20Silver.ipynb).
5. Set its Cosmos mirror item parameter and run every cell.
6. Import
   [`3 - ADLS Appeals to Silver and AI.ipynb`](../Notebooks/3%20-%20ADLS%20Appeals%20to%20Silver%20and%20AI.ipynb).
7. Run the ingestion and conformance cells now; the AI cells are used in Goal 3.

## Transformation requirements

### SQL

- convert names to `snake_case`
- trim strings and cast dates, booleans, and decimals explicitly
- reject null business keys
- deduplicate by the documented primary keys
- retain `is_synthetic`

### Cosmos DB

- map `id` and `parcelId` to one canonical `parcel_id`
- flatten jurisdiction, site, building, location, and current assessment
- preserve longitude before latitude from the GeoJSON coordinate array
- explode `inspections[]` into one row per inspection
- retain arrays only when downstream analysis needs them

### ADLS

- choose JSON or Parquet as the authoritative Bronze read
- cast submission and resolution dates
- preserve the original narrative unchanged
- validate `appeal_id`, `parcel_id`, `reason_code`, and `synthetic`
- prevent duplicate appeal IDs

## Quality checks

- every Silver parcel key exists in the SQL parcel source
- every Cosmos profile is synthetic and has a GeoJSON point
- every appeal is synthetic and has a nonempty narrative
- assessment values, sale prices, and requested adjustments are nonnegative
- inspection and appeal records join to valid parcel IDs

Reference: [Use notebooks in Fabric](https://learn.microsoft.com/fabric/data-engineering/how-to-use-notebook)

---

**Navigation:** [Previous: Goal 1](Fabric%20Hackathon%20-%20Goal%201.md) | [Next: Goal 3](Fabric%20Hackathon%20-%20Goal%203.md)
