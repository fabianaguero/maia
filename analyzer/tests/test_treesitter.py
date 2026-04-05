"""Tree-sitter language analyzer tests.

Covers the four new parsers (Python, TypeScript, Rust, Go) plus the updated
build_repo_waveform_bins that accepts all language file paths.
"""
from __future__ import annotations

from pathlib import Path

import pytest

from maia_analyzer.treesitter import (
    analyze_go_sources,
    analyze_python_sources,
    analyze_rust_sources,
    analyze_typescript_sources,
    build_repo_waveform_bins,
)


# ---------------------------------------------------------------------------
# Python
# ---------------------------------------------------------------------------

PYTHON_SOURCE = b"""\
import fastapi
from typing import Optional


class UserService:
    def get_user(self, user_id: int) -> Optional[dict]:
        return None

    async def create_user(self, name: str) -> dict:
        return {"name": name}


def health_check():
    pass


@app.get("/users")
async def list_users():
    return []
"""


def test_analyze_python_returns_enabled(tmp_path):
    f = tmp_path / "service.py"
    f.write_bytes(PYTHON_SOURCE)
    result = analyze_python_sources([f])
    assert result["enabled"] is True
    assert result["fileCount"] == 1


def test_analyze_python_class_count(tmp_path):
    f = tmp_path / "service.py"
    f.write_bytes(PYTHON_SOURCE)
    result = analyze_python_sources([f])
    assert result["classCount"] >= 1


def test_analyze_python_function_count(tmp_path):
    f = tmp_path / "service.py"
    f.write_bytes(PYTHON_SOURCE)
    result = analyze_python_sources([f])
    # get_user, create_user, health_check, list_users
    assert result["functionCount"] >= 3


def test_analyze_python_async_function_count(tmp_path):
    f = tmp_path / "service.py"
    f.write_bytes(PYTHON_SOURCE)
    result = analyze_python_sources([f])
    assert result["asyncFunctionCount"] >= 2


def test_analyze_python_detects_fastapi(tmp_path):
    f = tmp_path / "main.py"
    f.write_bytes(PYTHON_SOURCE)
    result = analyze_python_sources([f])
    assert "fastapi" in result["detectedFrameworks"]


def test_analyze_python_empty_list():
    result = analyze_python_sources([])
    assert result["enabled"] is True
    assert result["fileCount"] == 0


def test_analyze_python_unreadable_file(tmp_path):
    f = tmp_path / "missing.py"
    # Don't create the file — should be skipped gracefully
    result = analyze_python_sources([f])
    assert result["fileCount"] == 0


# ---------------------------------------------------------------------------
# TypeScript
# ---------------------------------------------------------------------------

TS_SOURCE = b"""\
import React from 'react';
import { Injectable } from '@nestjs/common';

interface UserDto {
  id: number;
  name: string;
}

type UserId = number;

@Injectable()
class UserService {
  getUser(id: UserId): UserDto | null {
    return null;
  }

  async createUser(name: string): Promise<UserDto> {
    return { id: 1, name };
  }
}

const greet = (name: string) => `Hello, ${name}`;

export default UserService;
"""


def test_analyze_typescript_returns_enabled(tmp_path):
    f = tmp_path / "service.ts"
    f.write_bytes(TS_SOURCE)
    result = analyze_typescript_sources([f])
    assert result["enabled"] is True
    assert result["fileCount"] == 1


def test_analyze_typescript_class_count(tmp_path):
    f = tmp_path / "service.ts"
    f.write_bytes(TS_SOURCE)
    result = analyze_typescript_sources([f])
    assert result["classCount"] >= 1


def test_analyze_typescript_interface_count(tmp_path):
    f = tmp_path / "service.ts"
    f.write_bytes(TS_SOURCE)
    result = analyze_typescript_sources([f])
    assert result["interfaceCount"] >= 1


def test_analyze_typescript_type_alias_count(tmp_path):
    f = tmp_path / "service.ts"
    f.write_bytes(TS_SOURCE)
    result = analyze_typescript_sources([f])
    assert result["typeAliasCount"] >= 1


def test_analyze_typescript_detects_nestjs(tmp_path):
    f = tmp_path / "service.ts"
    f.write_bytes(TS_SOURCE)
    result = analyze_typescript_sources([f])
    assert "nestjs" in result["detectedFrameworks"]


def test_analyze_typescript_empty_list():
    result = analyze_typescript_sources([])
    assert result["fileCount"] == 0


# ---------------------------------------------------------------------------
# Rust
# ---------------------------------------------------------------------------

RUST_SOURCE = b"""\
use std::collections::HashMap;

#[derive(Debug)]
struct User {
    id: u64,
    name: String,
}

enum Status {
    Active,
    Inactive,
}

trait Greet {
    fn greet(&self) -> String;
}

impl Greet for User {
    fn greet(&self) -> String {
        format!("Hello, {}", self.name)
    }
}

fn create_user(id: u64, name: &str) -> User {
    User { id, name: name.to_owned() }
}

fn main() {
    let u = create_user(1, "Alice");
    println!("{}", u.greet());
}
"""


def test_analyze_rust_returns_enabled(tmp_path):
    f = tmp_path / "main.rs"
    f.write_bytes(RUST_SOURCE)
    result = analyze_rust_sources([f])
    assert result["enabled"] is True
    assert result["fileCount"] == 1


def test_analyze_rust_struct_count(tmp_path):
    f = tmp_path / "main.rs"
    f.write_bytes(RUST_SOURCE)
    result = analyze_rust_sources([f])
    assert result["structCount"] >= 1


def test_analyze_rust_enum_count(tmp_path):
    f = tmp_path / "main.rs"
    f.write_bytes(RUST_SOURCE)
    result = analyze_rust_sources([f])
    assert result["enumCount"] >= 1


def test_analyze_rust_trait_count(tmp_path):
    f = tmp_path / "main.rs"
    f.write_bytes(RUST_SOURCE)
    result = analyze_rust_sources([f])
    assert result["traitCount"] >= 1


def test_analyze_rust_impl_count(tmp_path):
    f = tmp_path / "main.rs"
    f.write_bytes(RUST_SOURCE)
    result = analyze_rust_sources([f])
    assert result["implCount"] >= 1


def test_analyze_rust_function_count(tmp_path):
    f = tmp_path / "main.rs"
    f.write_bytes(RUST_SOURCE)
    result = analyze_rust_sources([f])
    # create_user + main + greet impl
    assert result["functionCount"] >= 2


def test_analyze_rust_empty_list():
    result = analyze_rust_sources([])
    assert result["fileCount"] == 0


# ---------------------------------------------------------------------------
# Go
# ---------------------------------------------------------------------------

GO_SOURCE = b"""\
package main

import "fmt"

type User struct {
    ID   int
    Name string
}

type Repository interface {
    FindByID(id int) *User
}

func NewUser(id int, name string) *User {
    return &User{ID: id, Name: name}
}

func (u *User) Greet() string {
    return fmt.Sprintf("Hello, %s", u.Name)
}

func main() {
    u := NewUser(1, "Alice")
    ch := make(chan string)
    go func() {
        ch <- u.Greet()
    }()
    fmt.Println(<-ch)
}
"""


def test_analyze_go_returns_enabled(tmp_path):
    f = tmp_path / "main.go"
    f.write_bytes(GO_SOURCE)
    result = analyze_go_sources([f])
    assert result["enabled"] is True
    assert result["fileCount"] == 1


def test_analyze_go_function_count(tmp_path):
    f = tmp_path / "main.go"
    f.write_bytes(GO_SOURCE)
    result = analyze_go_sources([f])
    # NewUser + main
    assert result["functionCount"] >= 2


def test_analyze_go_method_count(tmp_path):
    f = tmp_path / "main.go"
    f.write_bytes(GO_SOURCE)
    result = analyze_go_sources([f])
    # Greet method
    assert result["methodCount"] >= 1


def test_analyze_go_goroutine_count(tmp_path):
    f = tmp_path / "main.go"
    f.write_bytes(GO_SOURCE)
    result = analyze_go_sources([f])
    assert result["goroutineCount"] >= 1


def test_analyze_go_empty_list():
    result = analyze_go_sources([])
    assert result["fileCount"] == 0


# ---------------------------------------------------------------------------
# build_repo_waveform_bins with multi-language inputs
# ---------------------------------------------------------------------------


def test_waveform_bins_python_only(tmp_path):
    f = tmp_path / "app.py"
    f.write_bytes(PYTHON_SOURCE)
    bins = build_repo_waveform_bins([], [], python_files=[f])
    assert len(bins) > 0
    assert all(0.0 <= b <= 1.0 for b in bins)


def test_waveform_bins_mixed_languages(tmp_path):
    py = tmp_path / "app.py"
    py.write_bytes(PYTHON_SOURCE)
    ts = tmp_path / "service.ts"
    ts.write_bytes(TS_SOURCE)
    rs = tmp_path / "main.rs"
    rs.write_bytes(RUST_SOURCE)
    go = tmp_path / "main.go"
    go.write_bytes(GO_SOURCE)
    bins = build_repo_waveform_bins(
        [],
        [],
        python_files=[py],
        ts_files=[ts],
        rust_files=[rs],
        go_files=[go],
    )
    assert len(bins) > 0
    assert all(0.0 <= b <= 1.0 for b in bins)


def test_waveform_bins_empty_all_languages():
    bins = build_repo_waveform_bins([], [])
    assert bins == []


# ---------------------------------------------------------------------------
# Full repository analysis dispatches to new parsers
# ---------------------------------------------------------------------------


def test_analyze_repository_python_repo(tmp_path):
    from maia_analyzer.repository import analyze_repository

    (tmp_path / "main.py").write_bytes(PYTHON_SOURCE)
    (tmp_path / "service.py").write_bytes(PYTHON_SOURCE)

    asset, warnings = analyze_repository("directory", str(tmp_path))
    assert asset["assetType"] == "repo_analysis"
    metrics = asset["metrics"]
    assert metrics["pythonFileCount"] >= 2
    assert metrics["primaryLanguage"] == "python"
    assert "tree-sitter-python" in asset["tags"]


def test_analyze_repository_typescript_repo(tmp_path):
    from maia_analyzer.repository import analyze_repository

    (tmp_path / "app.ts").write_bytes(TS_SOURCE)
    (tmp_path / "package.json").write_text('{"name":"test"}', encoding="utf-8")

    asset, _ = analyze_repository("directory", str(tmp_path))
    metrics = asset["metrics"]
    assert metrics["typescriptFileCount"] >= 1
    assert metrics["buildSystem"] == "npm"


def test_analyze_repository_rust_repo(tmp_path):
    from maia_analyzer.repository import analyze_repository

    (tmp_path / "main.rs").write_bytes(RUST_SOURCE)
    (tmp_path / "Cargo.toml").write_text('[package]\nname="test"\nversion="0.1.0"', encoding="utf-8")

    asset, _ = analyze_repository("directory", str(tmp_path))
    metrics = asset["metrics"]
    assert metrics["rustFileCount"] >= 1
    assert metrics["buildSystem"] == "cargo"
    assert "tree-sitter-rust" in asset["tags"]


def test_analyze_repository_go_repo(tmp_path):
    from maia_analyzer.repository import analyze_repository

    (tmp_path / "main.go").write_bytes(GO_SOURCE)
    (tmp_path / "go.mod").write_text("module example.com/app\n\ngo 1.21\n", encoding="utf-8")

    asset, _ = analyze_repository("directory", str(tmp_path))
    metrics = asset["metrics"]
    assert metrics["goFileCount"] >= 1
    assert metrics["buildSystem"] == "go-modules"
    assert "tree-sitter-go" in asset["tags"]
