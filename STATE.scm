;;; STATE.scm — poly-db-mcp
;; SPDX-License-Identifier: AGPL-3.0-or-later
;; SPDX-FileCopyrightText: 2025 Jonathan D.A. Jewell

(define metadata
  '((version . "1.3.0") (updated . "2025-12-17") (project . "poly-db-mcp")))

(define current-position
  '((phase . "v1.3 - Security Hardening")
    (overall-completion . 70)
    (components
     ((adapters ((status . "implemented") (completion . 90) (count . 20)))
      (mcp-server ((status . "stable") (completion . 85)))
      (http-transport ((status . "implemented") (completion . 80)))
      (ci-cd ((status . "configured") (completion . 95)))
      (security ((status . "in-progress") (completion . 60)))
      (testing ((status . "minimal") (completion . 20)))
      (documentation ((status . "complete") (completion . 90)))))))

(define blockers-and-issues
  '((critical ())
    (high-priority
     (("SQL injection in table/identifier interpolation" . security)
      ("PostgreSQL uses conn.unsafe() for user queries" . security)))
    (medium
     (("Test suite not implemented" . testing)
      ("ReScript migration not started" . architecture)))))

(define roadmap
  '((v1.4 "Security Hardening"
     ((security
       (("Add identifier sanitization for table/column names" . high)
        ("Audit all adapters for injection vectors" . high)
        ("Add input validation layer" . medium)
        ("Update SECURITY.adoc with accurate claims" . medium)))
      (testing
       (("Add unit tests for adapters" . medium)
        ("Add integration test framework" . medium)))))
    (v1.5 "Testing & Quality"
     ((testing
       (("Achieve 70% code coverage" . high)
        ("Add CI test runner" . high)))
      (quality
       (("Add deno fmt check to CI" . low)
        ("Add deno lint enforcement" . low)))))
    (v2.0 "ReScript Migration"
     ((architecture
       (("Convert core adapters to ReScript" . medium)
        ("Add type-safe adapter interface" . medium)
        ("Generate JS output for Deno compatibility" . medium)))))
    (future "Planned Enhancements"
     ((features
       (("Implement db_copy cross-database functionality" . low)
        ("Add connection pooling metrics" . low)
        ("Add query caching layer" . low)))
      (databases
       (("Complete DuckDB HTTP adapter" . low)
        ("Add ClickHouse adapter" . low)
        ("Add TiDB adapter" . low)))))))

(define critical-next-actions
  '((immediate
     (("Add identifier sanitization helpers" . critical)
      ("Review PostgreSQL unsafe() usage" . critical)))
    (this-week
     (("Set up basic test framework" . high)
      ("Document security considerations" . medium)))))

(define session-history
  '((snapshots
     ((date . "2025-12-17") (session . "security-review")
      (notes . "Security audit, CodeQL JS analysis added, SECURITY.md fixed"))
     ((date . "2025-12-15") (session . "initial")
      (notes . "SCM files added")))))

(define state-summary
  '((project . "poly-db-mcp")
    (completion . 70)
    (adapters . 20)
    (blockers . 0)
    (security-issues . 2)
    (updated . "2025-12-17")))
