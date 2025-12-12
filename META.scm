;;; ==================================================
;;; META.scm — Metaobject Facility & Reflective Practices
;;; ==================================================
;;;
;;; SPDX-License-Identifier: MIT
;;; Copyright (c) 2025 Jonathan D.A. Jewell
;;;
;;; Meta-level instructions and reflective practices
;;; for AI assistants and human developers.
;;;
;;; ==================================================

(define meta
  '((metadata
      (format-version . "1.0")
      (created-at . "2025-12-12T00:00:00Z")
      (last-updated . "2025-12-12T00:00:00Z"))

    ;;; ==================================================
    ;;; METAOBJECT FACILITY
    ;;; ==================================================
    ;;; How this project reasons about itself

    (self-description
      (purpose . "Unified database access through MCP protocol")
      (philosophy . "One tool to query them all")
      (design-pattern . "Adapter pattern with dynamic registration"))

    (reflection-points
      ;; Questions to ask when modifying this project
      ("Does this change affect multiple database adapters?"
       "Is the new code consistent with existing adapter patterns?"
       "Have SPDX headers been added to new files?"
       "Does this maintain RSR compliance?"
       "Is the change backward compatible?"))

    ;;; ==================================================
    ;;; ARCHITECTURE DECISIONS
    ;;; ==================================================

    (architectural-decisions
      ((id . "ADR-001")
       (title . "Deno over Node.js")
       (status . "accepted")
       (context . "User preference for Deno runtime")
       (decision . "Use Deno with npm: specifiers for npm packages")
       (consequences . ("Better security model"
                        "Native TypeScript (unused)"
                        "Some npm packages need workarounds")))

      ((id . "ADR-002")
       (title . "JavaScript over TypeScript")
       (status . "accepted")
       (context . "User preference for plain JavaScript")
       (decision . "Use .js files without TypeScript")
       (consequences . ("Less type safety"
                        "Simpler toolchain"
                        "RSR prefers type-safe languages")))

      ((id . "ADR-003")
       (title . "Adapter pattern for databases")
       (status . "accepted")
       (context . "Need to support many different databases")
       (decision . "Each database has its own adapter module")
       (consequences . ("Easy to add new databases"
                        "Consistent interface"
                        "Some code duplication")))

      ((id . "ADR-004")
       (title . "Deno.Kv for LMDB replacement")
       (status . "accepted")
       (context . "Native LMDB module doesn't compile in Deno")
       (decision . "Use Deno.Kv as embedded KV backend")
       (consequences . ("Works out of box"
                        "Different API from real LMDB"
                        "Deno-specific"))))

    ;;; ==================================================
    ;;; DEVELOPMENT PRACTICES
    ;;; ==================================================

    (practices
      (code-style
        (formatter . "deno fmt")
        (linter . "deno lint")
        (comments . "JSDoc for public functions"))

      (git-workflow
        (branch-strategy . "main-only for now")
        (commit-style . "Conventional commits preferred")
        (pr-required . #f))

      (testing
        (framework . "manual testing")
        (coverage-target . "N/A")
        (note . "Add deno test in future")))

    ;;; ==================================================
    ;;; QUALITY ATTRIBUTES
    ;;; ==================================================

    (quality-priorities
      ;; In order of importance (user-specified)
      ("dependability"
       "security"
       "interoperability"
       "accessibility"
       "performance"
       "functional-additions"))

    ;;; ==================================================
    ;;; EXTENSION GUIDE
    ;;; ==================================================

    (how-to-extend
      (adding-database
        ("Create adapters/yourdb.js"
         "Export: name, description, connect(), disconnect(), isConnected(), tools"
         "Follow existing adapter patterns"
         "Add SPDX header"
         "Import in index.js"
         "Add env vars to README"))

      (adding-tool
        ("Add to the tools object in adapter"
         "Include description and params"
         "Return results wrapped in handler function")))

    (context-notes . "This file guides meta-level reasoning about the project.")))

;;; ==================================================
;;; END META.scm
;;; ==================================================
