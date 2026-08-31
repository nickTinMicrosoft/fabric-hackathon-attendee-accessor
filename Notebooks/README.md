# Fabric notebooks

Import these notebooks into a Fabric workspace and run them in order. Each
notebook exposes logical Fabric item names near the top so it can be adapted to
the lab without embedding Azure server, database, or storage names.

| Order | Notebook | Purpose |
|---|---|---|
| 1 | `1 - SQL Assessment to Silver.ipynb` | Conform mirrored SQL parcel, assessment, sale, and reference tables |
| 2 | `2 - Cosmos Property Profiles to Silver.ipynb` | Flatten property documents and explode inspection arrays |
| 3 | `3 - ADLS Appeals to Silver and AI.ipynb` | Load appeal Parquet, enforce schema, and add AI-derived signals |
| 4 | `4 - Property Assessment Gold Marts.ipynb` | Build joined analytical marts in the Gold Lakehouse |
| 5 | `5 - Property Assessment Data Agent Lab.ipynb` | Configure grounding instructions and evaluate natural-language questions |

## Expected workspace items

- an Azure SQL mirrored database
- a Cosmos DB mirrored database
- `BronzeLakehouse` with an `appeals` shortcut
- `SilverLakehouse`
- `GoldLakehouse`

If your facilitator uses different Fabric item names, change the parameter cell
in the relevant notebook. Do not insert source credentials into notebook cells.

## Safety

All records are synthetic. Notebook outputs are analytical demonstrations and
must not be used for real property valuation, taxation, or appeal decisions.
