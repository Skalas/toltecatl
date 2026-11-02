SHELL := bash
SH_SCRIPTS := install.sh tests/validate.sh
MJS_SCRIPTS := $(wildcard skills/toltecatl/scripts/*.mjs)

.PHONY: verify lint test budget help
.DEFAULT_GOAL := help

help: ## List Makefile targets
	@grep -hE '^[a-z]+:.*##' $(MAKEFILE_LIST) | sed 's/:.*##/\t/' | sort

verify: lint test budget ## Full verification gate (lint + test + budget)

lint: ## Syntax-check shell scripts (bash -n) and Node ESM scripts (node --check)
	@for f in $(SH_SCRIPTS); do bash -n "$$f" && echo "  ✓ bash -n $$f"; done
	@for f in $(MJS_SCRIPTS); do node --check "$$f" && echo "  ✓ node --check $$f"; done

test: ## Run contract and fixture validation suite
	@bash tests/validate.sh

budget: ## Verify progressive-disclosure line and byte budgets
	@echo "▸ Checking progressive-disclosure context budgets..."
	@lines=$$(wc -l < skills/toltecatl/SKILL.md | tr -d ' '); \
	bytes=$$(wc -c < skills/toltecatl/SKILL.md | tr -d ' '); \
	if [ "$$lines" -gt 150 ] || [ "$$bytes" -ge 6500 ]; then \
		echo "  ✗ SKILL.md out of budget: $$lines lines, $$bytes bytes" >&2; exit 1; \
	fi; \
	echo "  ✓ SKILL.md: $$lines/150 lines, $$bytes/6500 bytes"
	@for f in skills/toltecatl/ceremonies/*.md skills/toltecatl/lenses/*.md skills/toltecatl/house/*.md; do \
		lines=$$(wc -l < "$$f" | tr -d ' '); \
		if [ "$$lines" -gt 200 ]; then \
			echo "  ✗ $$f exceeds 200 lines ($$lines)" >&2; exit 1; \
		fi; \
		echo "  ✓ $$f: $$lines/200 lines"; \
	done
