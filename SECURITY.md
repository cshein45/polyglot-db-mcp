# Security Policy

> **Note**: For the full security policy, see [SECURITY.adoc](./SECURITY.adoc).

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability:

1. **For critical vulnerabilities**: Contact the maintainer directly
2. **For non-critical issues**: Open an issue with `[SECURITY]` prefix

### Response Timeline

- **Acknowledgement**: Within 24 hours
- **Initial assessment**: Within 72 hours
- **Resolution**: 7-30 days depending on severity

## Known Security Considerations

- All database credentials must be provided via environment variables
- This server is designed for trusted environments (AI assistants/MCP clients)
- SQL-based adapters accept raw queries - ensure proper access controls
