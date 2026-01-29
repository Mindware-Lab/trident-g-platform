# Data

## raw/
Original input datasets (small/public/open only).
- raw/squirrels/: MeanGUD.csv, GUDdiffOutliersremoved.csv

## generated/
Dummy/simulated datasets created by notebooks.
- generated/bandit/: dummy bandit data created by 01_simulate_prediction_error.ipynb
- generated/trident/: change-point time-series created by 03_trident_simulate.ipynb

## processed/
Cleaned/feature-engineered outputs created by prep notebooks.
- processed/squirrels/: guddiff_processed.csv created by 01_squirrels_prepare.ipynb
- processed/trident/: optional processed files created by Trident notebooks
