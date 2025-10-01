"""
Enhanced evaluation utilities with visualization and benchmark support
"""
import json
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from datetime import datetime
import math


@dataclass
class EvaluationMetrics:
    """Enhanced evaluation metrics"""
    # Basic metrics
    accuracy: Optional[float] = None
    loss: Optional[float] = None
    perplexity: Optional[float] = None

    # Text generation metrics
    bleu_score: Optional[float] = None
    rouge_1: Optional[float] = None
    rouge_2: Optional[float] = None
    rouge_l: Optional[float] = None

    # Classification metrics (if applicable)
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1_score: Optional[float] = None

    # Additional metrics
    meteor: Optional[float] = None
    bertscore: Optional[float] = None

    # Custom metrics
    custom: Optional[Dict[str, float]] = None


@dataclass
class BenchmarkResult:
    """Benchmark comparison result"""
    benchmark_name: str
    dataset: str
    metric_name: str
    model_score: float
    benchmark_scores: Dict[str, float]  # model_name -> score
    model_rank: int
    percentile: float


class EvaluationVisualizer:
    """Generate visualization data for evaluation results"""

    def generate_chart_data(
        self,
        evaluation_results: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate chart-ready data from evaluation results

        Args:
            evaluation_results: Raw evaluation results

        Returns:
            Chart data in various formats
        """
        metrics = evaluation_results.get("metrics", {})

        return {
            "radar_chart": self._generate_radar_chart(metrics),
            "bar_chart": self._generate_bar_chart(metrics),
            "comparison_table": self._generate_comparison_table(metrics),
            "score_distribution": self._generate_score_distribution(evaluation_results),
        }

    def _generate_radar_chart(self, metrics: Dict[str, float]) -> Dict[str, Any]:
        """Generate radar chart data for metrics"""
        # Normalize metrics to 0-100 scale for radar chart
        chart_data = []

        # Common metrics to visualize
        metric_mappings = {
            "accuracy": ("Accuracy", 100),
            "bleu_score": ("BLEU", 100),
            "rouge_l": ("ROUGE-L", 100),
            "f1_score": ("F1 Score", 100),
            "precision": ("Precision", 100),
            "recall": ("Recall", 100),
        }

        for metric_key, (label, max_val) in metric_mappings.items():
            if metric_key in metrics and metrics[metric_key] is not None:
                normalized_value = (metrics[metric_key] / max_val) * 100
                chart_data.append({
                    "metric": label,
                    "value": round(normalized_value, 2),
                    "raw_value": metrics[metric_key],
                })

        return {
            "type": "radar",
            "data": chart_data,
            "config": {
                "max_value": 100,
                "label_field": "metric",
                "value_field": "value",
            }
        }

    def _generate_bar_chart(self, metrics: Dict[str, float]) -> Dict[str, Any]:
        """Generate bar chart data for metrics"""
        chart_data = []

        for metric_name, value in metrics.items():
            if value is not None and isinstance(value, (int, float)):
                chart_data.append({
                    "metric": metric_name.replace("_", " ").title(),
                    "value": round(float(value), 4),
                })

        # Sort by value descending
        chart_data.sort(key=lambda x: x["value"], reverse=True)

        return {
            "type": "bar",
            "data": chart_data,
            "config": {
                "x_field": "metric",
                "y_field": "value",
                "sort": "descending",
            }
        }

    def _generate_comparison_table(self, metrics: Dict[str, float]) -> Dict[str, Any]:
        """Generate comparison table data"""
        rows = []

        for metric_name, value in metrics.items():
            if value is not None:
                rows.append({
                    "metric": metric_name.replace("_", " ").title(),
                    "value": round(float(value), 4) if isinstance(value, (int, float)) else value,
                    "formatted": f"{float(value):.4f}" if isinstance(value, (int, float)) else str(value),
                })

        return {
            "type": "table",
            "data": rows,
            "columns": ["metric", "value"],
        }

    def _generate_score_distribution(
        self,
        evaluation_results: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate score distribution data"""
        # If we have per-example scores, create histogram
        examples = evaluation_results.get("examples", [])

        if not examples:
            return {"type": "histogram", "data": []}

        # Extract scores from examples
        scores = []
        for example in examples:
            if "score" in example:
                scores.append(example["score"])

        if not scores:
            return {"type": "histogram", "data": []}

        # Create histogram bins
        bins = self._create_histogram_bins(scores, num_bins=10)

        return {
            "type": "histogram",
            "data": bins,
            "config": {
                "x_field": "bin",
                "y_field": "count",
            }
        }

    def _create_histogram_bins(
        self,
        values: List[float],
        num_bins: int = 10
    ) -> List[Dict[str, Any]]:
        """Create histogram bins from values"""
        if not values:
            return []

        min_val = min(values)
        max_val = max(values)
        bin_width = (max_val - min_val) / num_bins

        bins = []
        for i in range(num_bins):
            bin_start = min_val + i * bin_width
            bin_end = bin_start + bin_width
            bin_center = (bin_start + bin_end) / 2

            # Count values in this bin
            count = sum(1 for v in values if bin_start <= v < bin_end)

            # Last bin includes the maximum value
            if i == num_bins - 1:
                count = sum(1 for v in values if bin_start <= v <= bin_end)

            bins.append({
                "bin": f"{bin_center:.2f}",
                "range": f"[{bin_start:.2f}, {bin_end:.2f})",
                "count": count,
            })

        return bins


class BenchmarkComparator:
    """Compare model performance against benchmarks"""

    def __init__(self, benchmarks_file: Optional[str] = None):
        """
        Args:
            benchmarks_file: Path to benchmark data JSON file
        """
        self.benchmarks = self._load_benchmarks(benchmarks_file)

    def _load_benchmarks(self, benchmarks_file: Optional[str]) -> Dict[str, Any]:
        """Load benchmark data from file"""
        if benchmarks_file and Path(benchmarks_file).exists():
            try:
                with open(benchmarks_file, 'r') as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error loading benchmarks: {e}")

        # Return some default benchmarks
        return {
            "glue": {
                "gpt-3.5": 0.85,
                "gpt-4": 0.92,
                "llama-2-7b": 0.78,
                "llama-2-13b": 0.82,
            },
            "mmlu": {
                "gpt-3.5": 0.70,
                "gpt-4": 0.86,
                "llama-2-7b": 0.46,
                "llama-2-13b": 0.55,
            },
        }

    def compare_to_benchmarks(
        self,
        model_name: str,
        model_score: float,
        benchmark_name: str,
        metric_name: str = "accuracy"
    ) -> BenchmarkResult:
        """Compare model score to benchmark scores

        Args:
            model_name: Name of the model being evaluated
            model_score: Model's score on the benchmark
            benchmark_name: Name of the benchmark dataset
            metric_name: Name of the metric being compared

        Returns:
            Benchmark comparison result
        """
        benchmark_scores = self.benchmarks.get(benchmark_name, {})

        # Calculate rank
        all_scores = list(benchmark_scores.values()) + [model_score]
        all_scores.sort(reverse=True)
        model_rank = all_scores.index(model_score) + 1

        # Calculate percentile
        better_count = sum(1 for score in benchmark_scores.values() if model_score > score)
        percentile = (better_count / len(benchmark_scores) * 100) if benchmark_scores else 50

        return BenchmarkResult(
            benchmark_name=benchmark_name,
            dataset=benchmark_name,
            metric_name=metric_name,
            model_score=model_score,
            benchmark_scores=benchmark_scores,
            model_rank=model_rank,
            percentile=round(percentile, 1),
        )

    def generate_leaderboard(
        self,
        benchmark_name: str,
        model_results: Optional[Dict[str, float]] = None
    ) -> List[Dict[str, Any]]:
        """Generate leaderboard data for a benchmark

        Args:
            benchmark_name: Name of the benchmark
            model_results: Optional dict of model_name -> score to include

        Returns:
            Leaderboard data sorted by score
        """
        scores = self.benchmarks.get(benchmark_name, {}).copy()

        if model_results:
            scores.update(model_results)

        # Create leaderboard entries
        leaderboard = []
        for rank, (model_name, score) in enumerate(
            sorted(scores.items(), key=lambda x: x[1], reverse=True),
            start=1
        ):
            leaderboard.append({
                "rank": rank,
                "model": model_name,
                "score": round(score, 4),
                "is_custom": model_name in (model_results or {}),
            })

        return leaderboard


class EvaluationManager:
    """Manage evaluation results and history"""

    def __init__(self, evaluation_dir: str):
        """
        Args:
            evaluation_dir: Directory for storing evaluation results
        """
        self.evaluation_dir = Path(evaluation_dir)
        self.evaluation_dir.mkdir(parents=True, exist_ok=True)
        self.visualizer = EvaluationVisualizer()
        self.benchmark_comparator = BenchmarkComparator()

    def save_evaluation(
        self,
        results: Dict[str, Any],
        run_name: Optional[str] = None
    ) -> str:
        """Save evaluation results

        Args:
            results: Evaluation results dict
            run_name: Optional name for this run

        Returns:
            Path to saved results
        """
        # Generate run directory name
        timestamp = datetime.now().strftime("%Y-%m-%d_%H%M%S")
        run_dir = self.evaluation_dir / f"run_{timestamp}"
        if run_name:
            run_dir = self.evaluation_dir / f"run_{timestamp}_{run_name}"

        run_dir.mkdir(parents=True, exist_ok=True)

        # Save results
        results_file = run_dir / "evaluation_results.json"
        with open(results_file, 'w') as f:
            json.dump(results, f, indent=2)

        # Generate and save visualizations
        viz_data = self.visualizer.generate_chart_data(results)
        viz_file = run_dir / "visualizations.json"
        with open(viz_file, 'w') as f:
            json.dump(viz_data, f, indent=2)

        # Save metadata
        metadata = {
            "timestamp": timestamp,
            "run_name": run_name,
            "results_file": str(results_file),
            "visualization_file": str(viz_file),
        }
        metadata_file = run_dir / "metadata.json"
        with open(metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2)

        return str(run_dir)

    def list_evaluations(self) -> List[Dict[str, Any]]:
        """List all evaluation runs"""
        evaluations = []

        for run_dir in sorted(self.evaluation_dir.glob("run_*"), reverse=True):
            if not run_dir.is_dir():
                continue

            metadata_file = run_dir / "metadata.json"
            if metadata_file.exists():
                try:
                    with open(metadata_file, 'r') as f:
                        metadata = json.load(f)
                    metadata["run_dir"] = str(run_dir)
                    evaluations.append(metadata)
                except Exception as e:
                    print(f"Error loading metadata from {run_dir}: {e}")

        return evaluations

    def get_evaluation(self, run_dir: str) -> Optional[Dict[str, Any]]:
        """Get evaluation results and visualizations

        Args:
            run_dir: Path to evaluation run directory

        Returns:
            Combined results and visualizations
        """
        run_path = Path(run_dir)

        if not run_path.exists():
            return None

        data = {}

        # Load results
        results_file = run_path / "evaluation_results.json"
        if results_file.exists():
            with open(results_file, 'r') as f:
                data["results"] = json.load(f)

        # Load visualizations
        viz_file = run_path / "visualizations.json"
        if viz_file.exists():
            with open(viz_file, 'r') as f:
                data["visualizations"] = json.load(f)

        # Load metadata
        metadata_file = run_path / "metadata.json"
        if metadata_file.exists():
            with open(metadata_file, 'r') as f:
                data["metadata"] = json.load(f)

        return data if data else None