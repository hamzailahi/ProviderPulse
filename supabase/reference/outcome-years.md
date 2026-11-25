# Outcome data years for the back-test

Run 2026-11-25 by scripts/outcome-years.sh. Read only. Same selection as scripts/backtest-entry.sh: per county, the newest year with a value.

## ER visits per 1,000 (cms_county_utilization)

```
year | counties
2024 | 3143
```

## Readmission rate (cms_county_utilization)

```
year | counties
2024 | 3000
```

## Every year present in cms_county_utilization

```
year | rows | with_er | with_readmissions
2024 | 3197 | 3143 | 3000
```

## Preventable hospital stays (county_preventable_stays, County Health Rankings v005)

```
release_year | data_years | counties
2025 | (not in the file) | 3069
```

County Health Rankings' analytic CSV carries the release year only, not the measurement years behind v005; the import stores data_years empty for that reason.
