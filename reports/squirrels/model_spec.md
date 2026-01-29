# UrbanRiskSquirrels — model spec (Baseline vs Model 1 vs Model 3)

## Aim
Test whether squirrels’ **risk sensitivity** varies with road proximity and acoustic disturbance.

Outcome is the within-pair contrast:
**ΔGUD = SafeGUD − RiskyGUD** (column: GUDDiff)

## Data
Input: data/raw/squirrels/GUDdiffOutliersremoved.csv  
Grouping factor: Site (random intercept)

Predictors (z-scored):
- Road → Road_z
- MeanDB → MeanDB_z
- VarDB → VarDB_z

## Preprocessing
- Drop missing values in outcome/predictors
- Standardise predictors
- Create interaction terms: Road_z×MeanDB_z, Road_z×VarDB_z

## Candidate models (mixed effects; random intercept by Site)
Baseline:
- ΔGUD ~ Road_z + MeanDB_z + VarDB_z + (1|Site)

Model 3 (precision-weighted cue integration):
- ΔGUD ~ Road_z + MeanDB_z + VarDB_z + Road_z:VarDB_z + (1|Site)

Model 1 (quitting threshold / cost decomposition):
- ΔGUD ~ Road_z + MeanDB_z + VarDB_z + Road_z:VarDB_z + Road_z:MeanDB_z + (1|Site)

## Evaluation
Primary: GroupKFold cross-validation by Site (RMSE, MAE)  
Secondary: AIC/BIC/log-likelihood

Outputs (recommended filenames):
- results/tables/squirrels_model_comparison.csv
- results/tables/squirrels_cv_scores.csv
- results/figures/squirrels_predicted_vs_observed.png
- results/figures/squirrels_interaction_plot.png
