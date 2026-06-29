.PHONY: format format-python format-desktop format-site format-rust \
	quality quality-strict quality-pre-commit quality-pre-push quality-python \
	quality-python-strict quality-desktop quality-desktop-strict quality-site \
	quality-site-strict quality-rust quality-shell hooks-install

PYTHON ?= $(if $(wildcard analyzer/.venv/bin/python),analyzer/.venv/bin/python,python3)
BLACK_CONFIG := analyzer/pyproject.toml
MYPY_CONFIG := analyzer/pyproject.toml
PYTHON_STYLE_FILES := analyzer/src/maia_analyzer/*.py analyzer/tests/*.py scripts/demo/*.py scripts/verification/*.py
PYTHON_TYPE_FILES := analyzer/src/maia_analyzer/*.py

format: format-python format-desktop format-site format-rust

format-python:
	$(PYTHON) -m ruff check --fix --config $(BLACK_CONFIG) $(PYTHON_STYLE_FILES)
	for file in $(PYTHON_STYLE_FILES); do $(PYTHON) -m black --workers 1 --config $(BLACK_CONFIG) "$$file"; done

format-desktop:
	cd desktop && npm run format

format-site:
	cd site && npm run format

format-rust:
	cargo fmt --manifest-path desktop/src-tauri/Cargo.toml --all

quality: quality-python quality-desktop quality-site quality-shell

quality-strict: quality-python-strict quality-desktop-strict quality-site-strict quality-rust quality-shell

quality-pre-commit: quality

quality-pre-push: quality-strict

quality-python:
	$(PYTHON) -m ruff check --config $(BLACK_CONFIG) $(PYTHON_STYLE_FILES)
	$(PYTHON) -m mypy --config-file $(MYPY_CONFIG) $(PYTHON_TYPE_FILES)

quality-python-strict:
	for file in $(PYTHON_STYLE_FILES); do $(PYTHON) -m black --check --workers 1 --config $(BLACK_CONFIG) "$$file"; done
	$(PYTHON) -m ruff check --config $(BLACK_CONFIG) $(PYTHON_STYLE_FILES)
	$(PYTHON) -m mypy --config-file $(MYPY_CONFIG) $(PYTHON_TYPE_FILES)

quality-desktop:
	cd desktop && npm run quality

quality-desktop-strict:
	cd desktop && npm run quality:strict

quality-site:
	cd site && npm run quality

quality-site-strict:
	cd site && npm run quality:strict

quality-rust:
	cd desktop && npm run rust:fmt:check
	cd desktop && npm run rust:clippy

quality-shell:
	bash -n scripts/dev/desktopctl.sh

hooks-install:
	bash scripts/dev/install-git-hooks.sh
