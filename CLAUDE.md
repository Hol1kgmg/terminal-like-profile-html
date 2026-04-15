# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A terminal-styled profile page. A simple static web application contained in a single `index.html` file. Displays personal information such as name, skills, and background in a command-line interface style.


## Rules and Skills Structure

- **Rules** (`.claude/rules/`): Automatically loaded based on file paths. Source of truth for project conventions.
- **Skills** (`.claude/skills/`): Manually invoked for specific integrations.

## Available Rules

| Rule                    | Applies To | Description                                |
| ----------------------- | ---------- | ------------------------------------------ |

_Note: Rules will be added as the project evolves._

## Available Skills

| Skill                          | When to Use                                                                               |
| ------------------------------ | ----------------------------------------------------------------------------------------- |

## Work Rules

1. Propose implementation plan
1. Wait for approval
1. Start implementation

## Development Environment


## Tool Usage Policy

**Always use dedicated tools for file operations:**

- File reading → `Read` tool
- File search → `Glob` tool
- Content search → `Grep` tool
- File editing → `Edit` tool
- File writing → `Write` tool

## Language Settings

- Responses: Japanese
- Thinking: English (for token reduction)
