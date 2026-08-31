---
layout: page
title: Goal 1 - Connect the sources
---

# Goal 1: Connect SQL, Cosmos DB, and ADLS Gen2

Create the Bronze layer without hard-coding environment-specific resource
names. Obtain connection details and credentials from your facilitator.

## Deliverables

- a mirrored Azure SQL database containing the assessment tables
- a mirrored Cosmos DB database containing property profiles
- a `BronzeLakehouse`
- a OneLake shortcut from the Bronze Lakehouse to the ADLS appeal path
- evidence that all three sources are readable in Fabric

## Part A: Mirror Azure SQL

1. In your workspace, select **New item**.
2. Create a **Mirrored Azure SQL Database**.
3. Enter the connection details supplied for your lab.
4. Select the assessment tables and begin mirroring.
5. Confirm that `Jurisdiction`, `Parcel`, `Building`, `Assessment`, `Sale`,
   `TaxRate`, `Neighborhood`, and `PropertyClass` appear.

Do not paste credentials into a notebook or commit them to this repository.

Reference: [Mirror Azure SQL Database in Fabric](https://learn.microsoft.com/fabric/database/mirrored-database/azure-sql-database)

## Part B: Mirror Cosmos DB

1. Create a **Mirrored Azure Cosmos DB** item.
2. Connect to the account provided by the facilitator.
3. Select the database and `properties` container.
4. Confirm that property-profile fields and nested inspection data are visible.

Reference: [Mirror Azure Cosmos DB in Fabric](https://learn.microsoft.com/fabric/database/mirrored-database/azure-cosmos-db)

## Part C: Create the ADLS shortcut

1. Create a Lakehouse named `BronzeLakehouse`.
2. Under **Files**, create a new shortcut.
3. Choose **Azure Data Lake Storage Gen2**.
4. Connect to the supplied appeal-data path.
5. Name the shortcut `appeals`.
6. Confirm that both `assessment_appeals.json` and
   `assessment_appeals.parquet` are visible.

Reference: [Create an ADLS Gen2 shortcut](https://learn.microsoft.com/fabric/onelake/create-adls-shortcut)

## Validation

- Query at least one SQL mirror table.
- Display one Cosmos property profile and its nested inspection.
- Read the Parquet appeal file from the shortcut and count its records.
- Confirm all records are marked synthetic.
- Record the actual Fabric item names because the notebooks expose them as
  editable parameters.

## Optional exploration

Compare JSON and Parquet schema inference. Note which fields require explicit
casting and which format is more efficient for repeated analytical reads.

---

**Navigation:** [Previous: Architecture](Fabric%20Hackathon%20-%200%20-%20Architecture.md) | [Next: Goal 2](Fabric%20Hackathon%20-%20Goal%202.md)
