# SECURITY.md

## Reporting security issues

Please report security vulnerabilities privately to:
- `mark@iqmindware.com`

Do not open public issues for active vulnerabilities.

## Data handling boundaries

Do not submit identifiable clinical or personal data via:
- Issues
- Pull requests
- Email to public project addresses

This repository is documentation/schemas only and should never contain user-level datasets.

## Supply chain and publication controls

The repository uses CI checks to block:
- runtime/source exposure artifacts
- forbidden extensions and internal paths
- schema-invalid publication files
