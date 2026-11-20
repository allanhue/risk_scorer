"""Optional multi-label taxonomy training and inference with HF Transformers.
Training is an offline experiment. It does not alter the production rules scorer.
"""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path

import numpy as np
import torch
from torch.utils.data import Dataset
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    DataCollatorWithPadding,
    Trainer,
    TrainingArguments,
)

DEFAULT_MODEL = "microsoft/deberta-v3-base"
TEXT_COLUMNS = ("project_text", "purpose", "description", "sector", "county", "technology", "evidence")
REQUIRED_COLUMNS = {"project_text", "taxonomy_labels"}
_INFERENCE_MODELS: dict[str, tuple] = {}


def _labels(value: str) -> set[str]:
    return {label.strip().lower() for label in value.split(";") if label.strip()}


def _model_text(row: dict[str, str]) -> str:
    """Serialize project text and structured loan fields into a stable prompt."""
    fields = []
    for column in TEXT_COLUMNS:
        value = (row.get(column) or "").strip()
        if value:
            fields.append(f"{column.replace('_', ' ').title()}: {value}")
    amount = (row.get("loan_amount") or "").strip()
    currency = (row.get("currency") or "KES").strip()
    if amount:
        fields.append(f"Loan amount: {amount} {currency}")
    return " [SEP] ".join(fields)


def predict_one(model_dir: Path, row: dict[str, str], threshold: float = 0.5) -> dict:
    """Load a saved fine-tuned model once, then predict taxonomy labels for one loan."""
    model_dir = model_dir.resolve()
    if not (model_dir / "config.json").is_file():
        raise FileNotFoundError(f"No trained transformer model found at {model_dir}")
    key = str(model_dir)
    if key not in _INFERENCE_MODELS:
        tokenizer = AutoTokenizer.from_pretrained(key)
        model = AutoModelForSequenceClassification.from_pretrained(key)
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model.to(device)
        model.eval()
        _INFERENCE_MODELS[key] = (tokenizer, model, device)

    tokenizer, model, device = _INFERENCE_MODELS[key]
    encoded = tokenizer(_model_text(row), return_tensors="pt", truncation=True, max_length=384)
    encoded = {name: value.to(device) for name, value in encoded.items()}
    with torch.no_grad():
        probabilities = torch.sigmoid(model(**encoded).logits[0]).cpu().tolist()
    labels = [model.config.id2label[index] for index in range(model.config.num_labels)]
    scores = {label: float(score) for label, score in zip(labels, probabilities)}
    return {
        "predictedLabels": [label for label, score in scores.items() if score >= threshold],
        "labelScores": scores,
        "threshold": threshold,
    }


def _read_rows(path: Path, label_names: list[str] | None = None) -> tuple[list[dict], list[str]]:
    with path.open("r", newline="", encoding="utf-8-sig") as source:
        reader = csv.DictReader(source)
        missing = REQUIRED_COLUMNS - set(reader.fieldnames or [])
        if missing:
            raise ValueError(f"{path}: missing required columns: {', '.join(sorted(missing))}")
        rows = list(reader)
    if not rows:
        raise ValueError(f"{path}: no training/evaluation rows found")

    if label_names is None:
        label_names = sorted(set().union(*(_labels(row["taxonomy_labels"]) for row in rows)))
    if not label_names:
        raise ValueError(f"{path}: taxonomy_labels must contain at least one label")
    allowed = set(label_names)
    for line, row in enumerate(rows, start=2):
        row_labels = _labels(row["taxonomy_labels"])
        unknown = row_labels - allowed
        if not row_labels or unknown:
            message = f"unknown labels: {', '.join(sorted(unknown))}" if unknown else "taxonomy_labels is empty"
            raise ValueError(f"{path}, row {line}: {message}")
    return rows, label_names


class LoanDataset(Dataset):
    def __init__(self, rows: list[dict], tokenizer, label_names: list[str], max_length: int):
        self.rows = rows
        self.tokenizer = tokenizer
        self.label_names = label_names
        self.max_length = max_length

    def __len__(self) -> int:
        return len(self.rows)

    def __getitem__(self, index: int) -> dict:
        row = self.rows[index]
        encoded = self.tokenizer(
            _model_text(row), truncation=True, max_length=self.max_length,
        )
        labels = _labels(row["taxonomy_labels"])
        encoded["labels"] = [float(label in labels) for label in self.label_names]
        return encoded


def _metrics(prediction) -> dict[str, float]:
    logits = prediction.predictions if hasattr(prediction, "predictions") else prediction[0]
    targets = prediction.label_ids if hasattr(prediction, "label_ids") else prediction[1]
    if isinstance(logits, tuple):
        logits = logits[0]
    probabilities = 1 / (1 + np.exp(-logits))
    guesses = probabilities >= 0.5
    truths = targets.astype(bool)
    tp = np.logical_and(guesses, truths).sum(axis=0)
    fp = np.logical_and(guesses, np.logical_not(truths)).sum(axis=0)
    fn = np.logical_and(np.logical_not(guesses), truths).sum(axis=0)
    precision = np.divide(tp, tp + fp, out=np.zeros_like(tp, dtype=float), where=(tp + fp) != 0)
    recall = np.divide(tp, tp + fn, out=np.zeros_like(tp, dtype=float), where=(tp + fn) != 0)
    f1 = np.divide(2 * precision * recall, precision + recall,
                   out=np.zeros_like(precision), where=(precision + recall) != 0)
    micro_p = tp.sum() / max(int(tp.sum() + fp.sum()), 1)
    micro_r = tp.sum() / max(int(tp.sum() + fn.sum()), 1)
    micro_f1 = 2 * micro_p * micro_r / (micro_p + micro_r) if micro_p + micro_r else 0.0
    return {
        "macro_f1": float(f1.mean()),
        "micro_f1": float(micro_f1),
        "subset_accuracy": float(np.all(guesses == truths, axis=1).mean()),
    }


def train(args: argparse.Namespace) -> None:
    train_rows, label_names = _read_rows(args.train_csv)
    validation_rows, _ = _read_rows(args.validation_csv, label_names)
    tokenizer = AutoTokenizer.from_pretrained(args.base_model)
    model = AutoModelForSequenceClassification.from_pretrained(
        args.base_model,
        num_labels=len(label_names),
        problem_type="multi_label_classification",
        id2label={index: label for index, label in enumerate(label_names)},
        label2id={label: index for index, label in enumerate(label_names)},
        ignore_mismatched_sizes=True,
    )
    train_data = LoanDataset(train_rows, tokenizer, label_names, args.max_length)
    validation_data = LoanDataset(validation_rows, tokenizer, label_names, args.max_length)
    training_args = TrainingArguments(
        output_dir=str(args.output_dir),
        num_train_epochs=args.epochs,
        learning_rate=args.learning_rate,
        per_device_train_batch_size=args.batch_size,
        per_device_eval_batch_size=args.batch_size,
        eval_strategy="epoch",
        save_strategy="epoch",
        load_best_model_at_end=True,
        metric_for_best_model="eval_macro_f1",
        greater_is_better=True,
        save_total_limit=2,
        report_to="none",
        fp16=torch.cuda.is_available(),
        seed=args.seed,
    )
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_data,
        eval_dataset=validation_data,
        data_collator=DataCollatorWithPadding(tokenizer=tokenizer),
        processing_class=tokenizer,
        compute_metrics=_metrics,
    )
    trainer.train()
    trainer.save_model(str(args.output_dir))
    tokenizer.save_pretrained(str(args.output_dir))
    print(json.dumps({"saved_model": str(args.output_dir), "labels": label_names,
                      "validation_metrics": trainer.evaluate()}, indent=2))


def predict(args: argparse.Namespace) -> None:
    with args.input_csv.open("r", newline="", encoding="utf-8-sig") as source:
        reader = csv.DictReader(source)
        if "project_text" not in (reader.fieldnames or []):
            raise ValueError(f"{args.input_csv}: missing required column: project_text")
        rows = list(reader)
    if not rows:
        raise ValueError(f"{args.input_csv}: no rows found")
    tokenizer = AutoTokenizer.from_pretrained(args.model_dir)
    model = AutoModelForSequenceClassification.from_pretrained(args.model_dir)
    label_names = [model.config.id2label[index] for index in range(model.config.num_labels)]
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    model.eval()
    output_rows = []
    for row in rows:
        encoded = tokenizer(_model_text(row), return_tensors="pt", truncation=True,
                            max_length=args.max_length)
        encoded = {key: value.to(device) for key, value in encoded.items()}
        with torch.no_grad():
            probs = torch.sigmoid(model(**encoded).logits[0]).cpu().tolist()
        predicted = [label for label, probability in zip(label_names, probs)
                     if probability >= args.threshold]
        output_rows.append({**row, "model_taxonomy_labels": "; ".join(predicted)})

    columns = list(output_rows[0])
    if "model_taxonomy_labels" not in columns:
        columns.append("model_taxonomy_labels")
    with args.output_csv.open("w", newline="", encoding="utf-8") as target:
        writer = csv.DictWriter(target, fieldnames=columns)
        writer.writeheader()
        writer.writerows(output_rows)
    print(f"Wrote {len(output_rows)} predictions to {args.output_csv}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Offline multi-label loan taxonomy transformer")
    commands = parser.add_subparsers(dest="command", required=True)
    train_parser = commands.add_parser("train", help="fine-tune from separate train and validation CSV files")
    train_parser.add_argument("train_csv", type=Path)
    train_parser.add_argument("validation_csv", type=Path)
    train_parser.add_argument("--base-model", default=DEFAULT_MODEL)
    train_parser.add_argument("--output-dir", type=Path, default=Path("model-artifacts/taxonomy-encoder"))
    train_parser.add_argument("--epochs", type=float, default=3)
    train_parser.add_argument("--learning-rate", type=float, default=2e-5)
    train_parser.add_argument("--batch-size", type=int, default=8)
    train_parser.add_argument("--max-length", type=int, default=384)
    train_parser.add_argument("--seed", type=int, default=42)
    train_parser.set_defaults(func=train)

    predict_parser = commands.add_parser("predict", help="add candidate taxonomy labels to a CSV")
    predict_parser.add_argument("model_dir", type=Path)
    predict_parser.add_argument("input_csv", type=Path)
    predict_parser.add_argument("output_csv", type=Path)
    predict_parser.add_argument("--threshold", type=float, default=0.5)
    predict_parser.add_argument("--max-length", type=int, default=384)
    predict_parser.set_defaults(func=predict)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
