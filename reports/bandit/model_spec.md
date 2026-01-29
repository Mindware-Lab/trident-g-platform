# Bandit demo — model spec (delta-rule vs baseline)

## Aim
Demonstrate simulate → fit → compare on dummy behavioural data.

## Data
Generated in Notebook 01 and saved to:
- data/generated/bandit/dummy_bandit.csv

Minimum columns:
- trial, choice, reward

## Candidate models
Learning model: delta-rule + softmax (fit α and β)
Baseline: random choice (or biased coin)

## Evaluation
Compare models fairly using log-likelihood and AIC.
Save:
- results/tables/bandit_model_comparison.csv
- results/figures/bandit_predicted_vs_observed.png
