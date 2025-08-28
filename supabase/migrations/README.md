# Database Migrations

⚠️ **This directory is intentionally empty in the public repository.**

## How it works

During deployment, the GitHub Actions workflow:
1. Validates your license key
2. Downloads the latest migration bundle from our private API
3. Extracts the migrations here temporarily
4. Applies them to your database
5. Cleans up the temporary files

## For developers

- **Public repo**: Keep this directory empty (only .gitkeep and README)
- **Private repo**: Contains actual migration files
- **API**: Issues temporary JWT tokens for secure migration downloads

## Migration bundle structure

The downloaded bundle contains:
- All database schema migrations
- License watermark table (`__license_meta`)
- Installation verification function (`verify_installation()`)
- Version tracking and metadata

## Security

- Each download is single-use (JWT with unique `jti`)
- Short expiration time (5-15 minutes)
- License validation before any download
- Repository and project reference validation
