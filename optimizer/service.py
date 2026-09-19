"""Optional Reflex optimization sidecar.

The TypeScript application remains the default decision engine. This service
implements the requested embedding, weighted ranking, Hungarian assignment,
impact-scoped reallocation, and rarity/frequency skill-gap calculations when
the optional Python dependencies are installed.
"""

from __future__ import annotations

import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any

import numpy as np
from scipy.optimize import linear_sum_assignment
from sentence_transformers import SentenceTransformer

MODEL_NAME = "all-MiniLM-L6-v2"
MODEL = SentenceTransformer(MODEL_NAME)


def cosine_similarity(left: np.ndarray, right: np.ndarray) -> float:
    denominator = np.linalg.norm(left) * np.linalg.norm(right)
    if denominator == 0:
        return 0.0
    return float(np.dot(left, right) / denominator)


def employee_text(employee: dict[str, Any]) -> str:
    skills = employee.get("skills", [])
    names = [skill.get("skill_name", "") for skill in skills]
    return f"{' '.join(names)} {employee.get('role_title', '')}".strip()


def task_text(task: dict[str, Any]) -> str:
    requirements = task.get("skill_requirements", [])
    names = [requirement.get("skill_name", "") for requirement in requirements]
    return f"{task.get('description', '')} {' '.join(names)}".strip()


def candidate_score(task: dict[str, Any], employee: dict[str, Any]) -> dict[str, Any]:
    vectors = MODEL.encode([task_text(task), employee_text(employee)], normalize_embeddings=False)
    skill_similarity = max(0.0, min(1.0, cosine_similarity(vectors[0], vectors[1])))
    workload = max(0.0, min(1.0, 1.0 - float(employee.get("current_workload_percent", 0)) / 100))
    availability = 0.0 if employee.get("currently_unavailable") else 1.0
    performance = max(0.0, min(1.0, float(employee.get("performance_score", 0)) / 5))
    location = float(employee.get("location_score", 0)) / 100
    sla_safety = max(0.0, min(1.0, float(employee.get("sla_safety_score", 0)) / 100))
    score = (
        skill_similarity * 0.35
        + workload * 0.20
        + availability * 0.15
        + performance * 0.10
        + sla_safety * 0.10
        + location * 0.10
    )
    return {
        "employee_id": employee["id"],
        "skill_similarity": skill_similarity,
        "score": score,
        "eligible": bool(employee.get("eligible", True)),
    }


def optimize(payload: dict[str, Any]) -> dict[str, Any]:
    task = payload["task"]
    employees = payload.get("employees", [])
    candidates = [candidate_score(task, employee) for employee in employees]
    eligible = [candidate for candidate in candidates if candidate["eligible"]]
    headcount = max(1, int(payload.get("headcount", 1)))

    if not eligible:
        return {"status": "NO_FEASIBLE_MATCH", "candidates": candidates, "selected_employee_ids": []}

    # linear_sum_assignment is used for all batch requests. A single task with
    # one slot is still represented as a one-row cost matrix.
    rows = np.zeros((headcount, len(eligible)))
    for row in range(headcount):
        rows[row] = [-candidate["score"] for candidate in eligible]
    row_indices, column_indices = linear_sum_assignment(rows)
    selected = [eligible[column]["employee_id"] for row, column in zip(row_indices, column_indices)]
    status = "READY" if len(selected) == headcount else "NO_FEASIBLE_MATCH"
    return {"status": status, "candidates": candidates, "selected_employee_ids": selected}


def reallocate(payload: dict[str, Any]) -> dict[str, Any]:
    """Re-optimize only tasks in the event impact set.

    Existing allocations for tasks outside the impact set are returned
    unchanged and are never included in the optimization matrix.
    """
    event = payload["event"]
    tasks = payload.get("tasks", [])
    impacted_ids = set(payload.get("impact_task_ids", []))
    if not impacted_ids:
        impacted_ids = {
            task["id"]
            for task in tasks
            if task["id"] == event.get("task_id")
            or task["id"] in event.get("task_ids", [])
        }
    fixed_allocations = [
        allocation for allocation in payload.get("allocations", [])
        if allocation.get("task_id") not in impacted_ids
    ]
    affected = []
    for task in tasks:
        if task["id"] not in impacted_ids:
            continue
        task_employees = payload.get("employees_by_task", {}).get(task["id"], payload.get("employees", []))
        result = optimize({
            "task": task,
            "employees": task_employees,
            "headcount": task.get("headcount", 1),
        })
        affected.append({"task_id": task["id"], **result})
    return {
        "impact_task_ids": sorted(impacted_ids),
        "fixed_allocations": fixed_allocations,
        "affected_tasks": affected,
        "event_type": event.get("type"),
    }


def skill_gap_recommendations(payload: dict[str, Any]) -> list[dict[str, Any]]:
    active_counts = payload.get("active_employee_skill_counts", {})
    frequencies = payload.get("skill_gap_frequencies", {})
    results = []
    for skill, frequency in frequencies.items():
        rarity = 1 / (1 + int(active_counts.get(skill, 0)))
        shortage_score = float(frequency) * rarity
        results.append({
            "skill_name": skill,
            "rarity": rarity,
            "frequency": int(frequency),
            "shortage_score": shortage_score,
            "recommendation_strength": min(1.0, shortage_score),
            "suggested_hiring_priority": 1 if shortage_score >= 5 else 2 if shortage_score >= 2 else 3,
        })
    return sorted(results, key=lambda item: (-item["shortage_score"], item["skill_name"]))


class Handler(BaseHTTPRequestHandler):
    def do_POST(self) -> None:
        length = int(self.headers.get("Content-Length", "0"))
        payload = json.loads(self.rfile.read(length))
        if self.path == "/optimize":
            result = optimize(payload)
        elif self.path == "/reallocate":
            result = reallocate(payload)
        elif self.path == "/skill-gaps":
            result = {"items": skill_gap_recommendations(payload)}
        else:
            self.send_error(404)
            return
        body = json.dumps(result).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    import sys
    if "--once" in sys.argv:
        request = json.loads(sys.stdin.read())
        if request.get("operation") == "skill-gaps":
            response = {"items": skill_gap_recommendations(request)}
        elif request.get("operation") == "reallocate":
            response = reallocate(request)
        else:
            response = optimize(request)
        print(json.dumps(response))
        raise SystemExit(0)
    port = int(os.getenv("REFLEX_OPTIMIZER_PORT", "8091"))
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
