"""
Dataset validation, statistics, and management utilities
"""
import json
import os
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
import pandas as pd
from collections import Counter


@dataclass
class DatasetStats:
    """Statistics for a dataset"""
    num_examples: int
    columns: List[str]
    column_types: Dict[str, str]
    missing_values: Dict[str, int]
    text_length_stats: Dict[str, Dict[str, float]]  # column -> {mean, min, max, median}
    sample_examples: List[Dict[str, Any]]
    file_size_bytes: int
    format: str  # json, jsonl, csv, etc.


@dataclass
class ValidationResult:
    """Result of dataset validation"""
    is_valid: bool
    errors: List[str]
    warnings: List[str]
    stats: Optional[DatasetStats] = None


class DatasetValidator:
    """Validate dataset format and content"""

    def __init__(self, required_columns: Optional[List[str]] = None):
        """
        Args:
            required_columns: List of column names that must be present
        """
        self.required_columns = required_columns or ["input", "output"]

    def validate_file(self, file_path: str) -> ValidationResult:
        """Validate a dataset file

        Args:
            file_path: Path to the dataset file

        Returns:
            ValidationResult with validation status and details
        """
        errors = []
        warnings = []
        stats = None

        # Check if file exists
        if not os.path.exists(file_path):
            errors.append(f"File not found: {file_path}")
            return ValidationResult(is_valid=False, errors=errors, warnings=warnings)

        # Get file size
        file_size = os.path.getsize(file_path)
        if file_size == 0:
            errors.append("File is empty")
            return ValidationResult(is_valid=False, errors=errors, warnings=warnings)

        # Determine file format
        file_ext = Path(file_path).suffix.lower()

        try:
            if file_ext == ".json":
                df, format_warnings = self._load_json(file_path)
                warnings.extend(format_warnings)
            elif file_ext == ".jsonl":
                df, format_warnings = self._load_jsonl(file_path)
                warnings.extend(format_warnings)
            elif file_ext == ".csv":
                df = pd.read_csv(file_path)
            else:
                errors.append(f"Unsupported file format: {file_ext}")
                return ValidationResult(is_valid=False, errors=errors, warnings=warnings)

        except Exception as e:
            errors.append(f"Failed to load file: {str(e)}")
            return ValidationResult(is_valid=False, errors=errors, warnings=warnings)

        # Validate dataframe
        validation_errors, validation_warnings = self._validate_dataframe(df)
        errors.extend(validation_errors)
        warnings.extend(validation_warnings)

        # Generate statistics if valid
        if not errors:
            stats = self._generate_stats(df, file_path, file_size, file_ext)

        is_valid = len(errors) == 0
        return ValidationResult(
            is_valid=is_valid,
            errors=errors,
            warnings=warnings,
            stats=stats
        )

    def _load_json(self, file_path: str) -> Tuple[pd.DataFrame, List[str]]:
        """Load JSON file and return DataFrame"""
        warnings = []

        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        if isinstance(data, dict):
            if "data" in data:
                examples = data["data"]
                warnings.append("Dataset wrapped in 'data' key (acceptable format)")
            elif "examples" in data:
                examples = data["examples"]
                warnings.append("Dataset wrapped in 'examples' key (acceptable format)")
            else:
                # Try to treat dict as single example
                examples = [data]
                warnings.append("Single example detected, treating as one-item dataset")
        elif isinstance(data, list):
            examples = data
        else:
            raise ValueError("Invalid JSON format: expected list or dict")

        return pd.DataFrame(examples), warnings

    def _load_jsonl(self, file_path: str) -> Tuple[pd.DataFrame, List[str]]:
        """Load JSONL file and return DataFrame"""
        warnings = []
        examples = []

        with open(file_path, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                line = line.strip()
                if not line:
                    continue
                try:
                    examples.append(json.loads(line))
                except json.JSONDecodeError as e:
                    warnings.append(f"Invalid JSON on line {line_num}: {e}")

        return pd.DataFrame(examples), warnings

    def _validate_dataframe(self, df: pd.DataFrame) -> Tuple[List[str], List[str]]:
        """Validate DataFrame contents"""
        errors = []
        warnings = []

        # Check if empty
        if len(df) == 0:
            errors.append("Dataset is empty (no examples)")
            return errors, warnings

        # Check required columns
        missing_cols = set(self.required_columns) - set(df.columns)
        if missing_cols:
            errors.append(f"Missing required columns: {', '.join(missing_cols)}")

        # Check for empty columns
        for col in df.columns:
            null_count = df[col].isnull().sum()
            if null_count > 0:
                warnings.append(
                    f"Column '{col}' has {null_count} missing values "
                    f"({null_count / len(df) * 100:.1f}%)"
                )

        # Check text columns are non-empty strings
        for col in self.required_columns:
            if col in df.columns:
                empty_strings = (df[col].astype(str).str.strip() == "").sum()
                if empty_strings > 0:
                    warnings.append(
                        f"Column '{col}' has {empty_strings} empty strings"
                    )

        # Check for very short examples
        if "input" in df.columns and "output" in df.columns:
            short_inputs = (df["input"].astype(str).str.len() < 5).sum()
            short_outputs = (df["output"].astype(str).str.len() < 5).sum()

            if short_inputs > len(df) * 0.1:  # More than 10%
                warnings.append(
                    f"{short_inputs} examples have very short inputs (< 5 chars)"
                )
            if short_outputs > len(df) * 0.1:
                warnings.append(
                    f"{short_outputs} examples have very short outputs (< 5 chars)"
                )

        return errors, warnings

    def _generate_stats(
        self,
        df: pd.DataFrame,
        file_path: str,
        file_size: int,
        file_ext: str
    ) -> DatasetStats:
        """Generate statistics for the dataset"""

        # Column types
        column_types = {col: str(dtype) for col, dtype in df.dtypes.items()}

        # Missing values
        missing_values = {col: int(df[col].isnull().sum()) for col in df.columns}

        # Text length statistics
        text_length_stats = {}
        for col in df.columns:
            if df[col].dtype == object:  # Text column
                lengths = df[col].astype(str).str.len()
                text_length_stats[col] = {
                    "mean": float(lengths.mean()),
                    "min": float(lengths.min()),
                    "max": float(lengths.max()),
                    "median": float(lengths.median()),
                    "std": float(lengths.std()),
                }

        # Sample examples (first 5)
        sample_examples = df.head(5).to_dict('records')
        # Truncate long text fields in samples
        for example in sample_examples:
            for key, value in example.items():
                if isinstance(value, str) and len(value) > 200:
                    example[key] = value[:200] + "..."

        return DatasetStats(
            num_examples=len(df),
            columns=list(df.columns),
            column_types=column_types,
            missing_values=missing_values,
            text_length_stats=text_length_stats,
            sample_examples=sample_examples,
            file_size_bytes=file_size,
            format=file_ext.lstrip('.'),
        )


class DatasetManager:
    """Manage datasets - list, validate, preview"""

    def __init__(self, data_dir: str):
        """
        Args:
            data_dir: Directory containing datasets
        """
        self.data_dir = Path(data_dir)
        self.validator = DatasetValidator()

    def list_datasets(self) -> List[Dict[str, Any]]:
        """List all datasets in the data directory"""
        if not self.data_dir.exists():
            return []

        datasets = []
        for file_path in self.data_dir.glob("*"):
            if file_path.suffix.lower() in [".json", ".jsonl", ".csv"]:
                stat = file_path.stat()
                datasets.append({
                    "name": file_path.name,
                    "path": str(file_path),
                    "size_bytes": stat.st_size,
                    "size_mb": round(stat.st_size / (1024**2), 2),
                    "modified": stat.st_mtime,
                    "format": file_path.suffix.lstrip('.'),
                })

        # Sort by modification time (newest first)
        datasets.sort(key=lambda x: x["modified"], reverse=True)
        return datasets

    def get_dataset_info(self, dataset_path: str) -> Dict[str, Any]:
        """Get detailed information about a dataset"""
        result = self.validator.validate_file(dataset_path)

        info = {
            "path": dataset_path,
            "is_valid": result.is_valid,
            "errors": result.errors,
            "warnings": result.warnings,
        }

        if result.stats:
            info["stats"] = asdict(result.stats)

        return info

    def preview_dataset(
        self,
        dataset_path: str,
        num_examples: int = 10
    ) -> Dict[str, Any]:
        """Preview dataset with sample examples"""

        # Load dataset
        file_ext = Path(dataset_path).suffix.lower()

        try:
            if file_ext == ".json":
                df, _ = self.validator._load_json(dataset_path)
            elif file_ext == ".jsonl":
                df, _ = self.validator._load_jsonl(dataset_path)
            elif file_ext == ".csv":
                df = pd.read_csv(dataset_path)
            else:
                raise ValueError(f"Unsupported format: {file_ext}")
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
            }

        # Get samples
        samples = df.head(num_examples).to_dict('records')

        return {
            "success": True,
            "num_examples": len(df),
            "columns": list(df.columns),
            "samples": samples,
        }