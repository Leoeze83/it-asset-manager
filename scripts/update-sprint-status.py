#!/usr/bin/env python3
"""Generate sprint status from GitHub Issues/Milestones into a single markdown file.

Designed for GitHub Actions using only free built-in APIs and GITHUB_TOKEN.
"""

from __future__ import annotations

import json
import os
import re
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

OUTPUT_PATH = Path("Fase 2/01_Sprint1/SPRINTS_ESTADO.md")
API_BASE = "https://api.github.com"


def _utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")


def _github_get(url: str, token: str) -> Tuple[List[dict], Optional[str]]:
    req = Request(url)
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("X-GitHub-Api-Version", "2022-11-28")

    with urlopen(req, timeout=30) as response:
        body = response.read().decode("utf-8")
        link_header = response.headers.get("Link", "")
        next_url = None
        if link_header:
            parts = [part.strip() for part in link_header.split(",")]
            for part in parts:
                if 'rel="next"' in part:
                    next_url = part.split(";")[0].strip("<>")
                    break
        data = json.loads(body)
        if isinstance(data, list):
            return data, next_url
        return [data], next_url


def _fetch_all_pages(initial_url: str, token: str) -> List[dict]:
    items: List[dict] = []
    url = initial_url
    while url:
        page_items, url = _github_get(url, token)
        items.extend(page_items)
    return items


def _extract_sprint_key(issue: dict) -> str:
    milestone = issue.get("milestone")
    if milestone and milestone.get("title"):
        return milestone["title"].strip()

    labels = issue.get("labels") or []
    for label in labels:
        name = (label.get("name") or "").strip().lower()
        match = re.search(r"sprint[/ _-]?(\d+)", name)
        if match:
            return f"Sprint {match.group(1)}"

    return "Backlog sin sprint"


def _extract_epic(issue: dict) -> str:
    labels = issue.get("labels") or []
    for label in labels:
        name = (label.get("name") or "").strip()
        if name.lower().startswith("epic/"):
            return name.split("/", 1)[1]
    return "sin-epica"


def _safe_percent(done: int, total: int) -> int:
    if total <= 0:
        return 0
    return int((done * 100) / total)


def _build_markdown(repo: str, milestones: List[dict], issues: List[dict]) -> str:
    issues_only = [i for i in issues if "pull_request" not in i]
    by_sprint: Dict[str, List[dict]] = defaultdict(list)
    for issue in issues_only:
        by_sprint[_extract_sprint_key(issue)].append(issue)

    closed_milestones = [m for m in milestones if m.get("state") == "closed"]
    open_milestones = [m for m in milestones if m.get("state") == "open"]

    lines: List[str] = []
    lines.append("# Sprint Status (Auto)")
    lines.append("")
    lines.append(f"Updated: {_utc_now()}")
    lines.append(f"Repository: {repo}")
    lines.append("")
    lines.append("## Summary")
    lines.append(f"- Total issues tracked: {len(issues_only)}")
    lines.append(f"- Open milestones: {len(open_milestones)}")
    lines.append(f"- Closed milestones (completed sprints): {len(closed_milestones)}")
    lines.append("")

    lines.append("## Completed Sprints")
    if not closed_milestones:
        lines.append("- None yet")
    else:
        for m in sorted(closed_milestones, key=lambda x: x.get("updated_at") or ""):
            title = m.get("title", "(no-title)")
            closed_at = (m.get("closed_at") or "").replace("T", " ").replace("Z", " UTC")
            lines.append(f"- {title}: closed at {closed_at}")
    lines.append("")

    lines.append("## Sprint Breakdown")
    for sprint_name in sorted(by_sprint.keys()):
        sprint_issues = by_sprint[sprint_name]
        total = len(sprint_issues)
        done = len([i for i in sprint_issues if i.get("state") == "closed"])
        open_count = total - done
        progress = _safe_percent(done, total)

        lines.append(f"### {sprint_name}")
        lines.append(f"- Total: {total}")
        lines.append(f"- Closed: {done}")
        lines.append(f"- Open: {open_count}")
        lines.append(f"- Progress: {progress}%")

        by_epic: Dict[str, int] = defaultdict(int)
        for issue in sprint_issues:
            by_epic[_extract_epic(issue)] += 1

        if by_epic:
            epic_list = ", ".join([f"{k}({v})" for k, v in sorted(by_epic.items())])
            lines.append(f"- Epics: {epic_list}")

        lines.append("")
        for issue in sorted(sprint_issues, key=lambda i: i.get("number", 0)):
            number = issue.get("number")
            title = issue.get("title", "")
            state = (issue.get("state") or "").upper()
            lines.append(f"- [{state}] #{number} {title}")
        lines.append("")

    lines.append("## Notes")
    lines.append("- Generated automatically by .github/workflows/fase2-sync.yml")
    lines.append("- Source: GitHub Issues + Milestones + Labels")

    return "\n".join(lines) + "\n"


def main() -> int:
    token = os.getenv("GITHUB_TOKEN")
    repo = os.getenv("GITHUB_REPOSITORY")

    if not token or not repo:
        OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
        OUTPUT_PATH.write_text(
            "# Sprint Status (Auto)\n\n"
            "No GitHub context found (GITHUB_TOKEN / GITHUB_REPOSITORY missing).\n"
            "Run this script inside GitHub Actions to populate real sprint data.\n",
            encoding="utf-8",
        )
        print("Wrote placeholder sprint status (missing GitHub env vars).")
        return 0

    milestones_url = f"{API_BASE}/repos/{repo}/milestones?state=all&per_page=100"
    issues_url = f"{API_BASE}/repos/{repo}/issues?state=all&per_page=100"

    try:
        milestones = _fetch_all_pages(milestones_url, token)
        issues = _fetch_all_pages(issues_url, token)
    except (HTTPError, URLError, TimeoutError) as exc:
        print(f"Failed to fetch GitHub data: {exc}")
        return 1

    markdown = _build_markdown(repo, milestones, issues)
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(markdown, encoding="utf-8")

    print(
        f"Updated {OUTPUT_PATH} with {len([i for i in issues if 'pull_request' not in i])} issues and {len(milestones)} milestones."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
