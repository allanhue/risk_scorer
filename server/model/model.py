"""Offline evaluation utilities for future candidate risk models.

This module deliberately does not train or serve a model. Candidate predictions
are supplied as CSV so model development can remain independent of production
scoring until there is a reviewed representative labeled dataset.
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path
from typing import Iterable

LABELS = ("low", "medium", "high")
REQUIRED_COLUMNS = {
    "loan_amount",
    "purpose",
    "county",
    "sector",
}


def _metrics(expected: list[str], predicted: list[str]) -> dict:
    matrix = {actual: {guess: 0 for guess in LABELS} for actual in LABELS}
    for actual, guess in zip(expected, predicted):
        matrix[actual][guess] += 1

    per_class = {}
    f1s = []
    for label in LABELS:
        tp = matrix[label][label]
        fp = sum(matrix[other][label] for other in LABELS if other != label)
        fn = sum(matrix[label][other] for other in LABELS if other != label)
        precision = tp / (tp + fp) if tp + fp else 0.0
        recall = tp / (tp + fn) if tp + fn else 0.0
        f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
        per_class[label] = {
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1": round(f1, 4),
            "support": sum(matrix[label].values()),
        }
        f1s.append(f1)

    count = len(expected)
    correct = sum(matrix[label][label] for label in LABELS)
    return {
        "rows": count,
        "accuracy": round(correct / count, 4) if count else 0.0,
        "macro_f1": round(sum(f1s) / len(f1s), 4),
        "confusion_matrix": matrix,
        "per_class": per_class,
    }


def _multilabel_metrics(expected: list[set[str]], predicted: list[set[str]]) -> dict:
    labels = sorted(set().union(*expected, *predicted))
    if not labels:
        raise ValueError("Taxonomy label columns must contain at least one label")
    per_label = {}
    f1s = []
    tp_total = fp_total = fn_total = exact_matches = 0
    for actual, guess in zip(expected, predicted):
        exact_matches += actual == guess
    for label in labels:
        tp = sum(label in actual and label in guess for actual, guess in zip(expected, predicted))
        fp = sum(label not in actual and label in guess for actual, guess in zip(expected, predicted))
        fn = sum(label in actual and label not in guess for actual, guess in zip(expected, predicted))
        precision = tp / (tp + fp) if tp + fp else 0.0
        recall = tp / (tp + fn) if tp + fn else 0.0
        f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
        per_label[label] = {
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1": round(f1, 4),
            "support": tp + fn,
        }
        f1s.append(f1)
        tp_total += tp
        fp_total += fp
        fn_total += fn

    micro_precision = tp_total / (tp_total + fp_total) if tp_total + fp_total else 0.0
    micro_recall = tp_total / (tp_total + fn_total) if tp_total + fn_total else 0.0
    micro_f1 = (2 * micro_precision * micro_recall / (micro_precision + micro_recall)
                if micro_precision + micro_recall else 0.0)
    count = len(expected)
    return {
        "rows": count,
        "subset_accuracy": round(exact_matches / count, 4) if count else 0.0,
        "macro_f1": round(sum(f1s) / len(f1s), 4),
        "micro_f1": round(micro_f1, 4),
        "per_label": per_label,
    }


def evaluate_rows(rows: Iterable[dict[str, str]], baseline_predictor) -> dict:
    """Compare optional risk labels and multi-label taxonomy predictions."""
    baseline_labels: list[str] = []
    candidate_labels: list[str] = []
    actual_labels: list[str] = []
    predicted_taxonomy: list[set[str]] = []
    actual_taxonomy: list[set[str]] = []
    has_actual = False
    has_prediction_column = False
    has_taxonomy_truth_column = False
    row_count = 0

    for line_number, row in enumerate(rows, start=2):
        row_count += 1
        has_prediction_column = "model_taxonomy_labels" in row
        has_taxonomy_truth_column = "actual_taxonomy_labels" in row
        candidate = row.get("model_risk_level", "").strip().lower()
        if candidate and candidate not in LABELS:
            raise ValueError(f"Row {line_number}: model_risk_level must be low, medium, or high")
        try:
            amount = float(row["loan_amount"])
        except (KeyError, ValueError) as exc:
            raise ValueError(f"Row {line_number}: loan_amount must be numeric") from exc

        baseline = baseline_predictor(
            loan_amount=amount,
            purpose=row["purpose"],
            county=row["county"],
            sector=row["sector"],
            description=row.get("description", ""),
            currency=row.get("currency", "KES") or "KES",
        )["riskLevel"].lower()
        if baseline not in LABELS:
            raise ValueError(f"Row {line_number}: rules baseline returned unknown label {baseline!r}")

        if candidate:
            baseline_labels.append(baseline)
            candidate_labels.append(candidate)
        actual = row.get("actual_risk_level", "").strip().lower()
        if actual:
            if actual not in LABELS:
                raise ValueError(f"Row {line_number}: actual_risk_level must be low, medium, or high")
            has_actual = True
        elif has_actual:
            raise ValueError(f"Row {line_number}: actual_risk_level must be filled for every row or none")
        actual_labels.append(actual)
        predicted_taxonomy.append(_parse_taxonomy_labels(row.get("model_taxonomy_labels", "")))
        actual_taxonomy.append(_parse_taxonomy_labels(row.get("actual_taxonomy_labels", "")))

    if row_count == 0:
        raise ValueError("CSV has a header but no data rows")
    if has_actual and any(not label for label in actual_labels):
        raise ValueError("actual_risk_level must be filled for every row or none")

    result = {"rows": row_count}
    if candidate_labels:
        if len(candidate_labels) != row_count:
            raise ValueError("model_risk_level must be filled for every row or none")
        risk_report = {
            "labels": list(LABELS),
            "candidate_vs_rules": _metrics(baseline_labels, candidate_labels),
        }
        if has_actual:
            risk_report["candidate_vs_outcomes"] = _metrics(actual_labels, candidate_labels)
            risk_report["rules_vs_outcomes"] = _metrics(actual_labels, baseline_labels)
        result["risk_labels"] = risk_report

    if has_prediction_column != has_taxonomy_truth_column:
        raise ValueError("model_taxonomy_labels and actual_taxonomy_labels must both be supplied")
    if has_prediction_column:
        result["taxonomy_labels"] = {
            "candidate_vs_outcomes": _multilabel_metrics(actual_taxonomy, predicted_taxonomy),
            "note": "Taxonomy labels are evaluated against reviewed labels; the rules engine does not currently produce taxonomy categories.",
        }
    if candidate_labels:
        result["interpretation"] = "Agreement with rules measures consistency with the current baseline; it is not evidence of real-world predictive accuracy."
    return result


def _parse_taxonomy_labels(value: str) -> set[str]:
    return {label.strip().lower() for label in value.split(";") if label.strip()}


def evaluate_csv(path: Path) -> dict:
    # The application service import works when invoked from the server directory.
    try:
        from services.scoring import score_loan
    except ImportError:
        sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
        from services.scoring import score_loan

    with path.open("r", newline="", encoding="utf-8-sig") as source:
        reader = csv.DictReader(source)
        missing = REQUIRED_COLUMNS - set(reader.fieldnames or [])
        if missing:
            raise ValueError(f"CSV is missing required columns: {', '.join(sorted(missing))}")
        return evaluate_rows(reader, score_loan)


def main() -> int:
    parser = argparse.ArgumentParser(description="Evaluate candidate risk or multi-label taxonomy predictions.")
    parser.add_argument("csv_file", type=Path, help="CSV containing loan features and candidate predictions")
    parser.add_argument("--output", type=Path, help="Optional path for the JSON metrics report")
    args = parser.parse_args()
    try:
        report = evaluate_csv(args.csv_file)
    except (OSError, ValueError) as exc:
        parser.error(str(exc))

    rendered = json.dumps(report, indent=2)
    if args.output:
        args.output.write_text(rendered + "\n", encoding="utf-8")
    print(rendered)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
