"""
Model management utilities - comparison, checkpoints, export
"""
import json
import os
import shutil
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from datetime import datetime


@dataclass
class ModelMetrics:
    """Model evaluation metrics"""
    model_id: str
    model_name: str
    accuracy: Optional[float] = None
    loss: Optional[float] = None
    perplexity: Optional[float] = None
    bleu_score: Optional[float] = None
    rouge_scores: Optional[Dict[str, float]] = None
    f1_score: Optional[float] = None
    custom_metrics: Optional[Dict[str, float]] = None


@dataclass
class CheckpointInfo:
    """Checkpoint information"""
    checkpoint_id: str
    path: str
    step: int
    epoch: float
    loss: Optional[float]
    created_at: float
    size_bytes: int


class ModelComparator:
    """Compare multiple models/adapters"""

    def compare_models(
        self,
        model_ids: List[str],
        adapter_registry: List[Dict[str, Any]],
        evaluation_results: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Compare multiple models based on their metrics

        Args:
            model_ids: List of model/adapter IDs to compare
            adapter_registry: Adapter registry data
            evaluation_results: Optional evaluation results

        Returns:
            Comparison data with metrics for each model
        """
        models_data = []

        for model_id in model_ids:
            # Find adapter in registry
            adapter = next(
                (a for a in adapter_registry if a.get("path") == model_id or a.get("name") == model_id),
                None
            )

            if not adapter:
                continue

            model_data = {
                "id": model_id,
                "name": adapter.get("name", model_id),
                "path": adapter.get("path"),
                "training_date": adapter.get("training_date"),
                "base_model": adapter.get("base_model"),
                "description": adapter.get("description"),
                "metrics": adapter.get("metrics", {}),
            }

            # Add evaluation results if available
            if evaluation_results and model_id in evaluation_results:
                model_data["evaluation"] = evaluation_results[model_id]

            models_data.append(model_data)

        # Calculate comparison statistics
        comparison_stats = self._calculate_comparison_stats(models_data)

        return {
            "models": models_data,
            "comparison_stats": comparison_stats,
            "compared_at": datetime.now().isoformat(),
        }

    def _calculate_comparison_stats(self, models_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate comparison statistics across models"""
        stats = {
            "total_models": len(models_data),
            "best_by_metric": {},
            "metric_ranges": {},
        }

        # Collect all available metrics
        all_metrics = set()
        for model in models_data:
            metrics = model.get("metrics", {})
            all_metrics.update(metrics.keys())

        # Find best model for each metric and calculate ranges
        for metric_name in all_metrics:
            values = []
            best_model = None
            best_value = None

            for model in models_data:
                value = model.get("metrics", {}).get(metric_name)
                if value is not None:
                    values.append(value)

                    # Determine if higher or lower is better based on metric name
                    is_lower_better = metric_name in ["loss", "perplexity"]

                    if best_value is None:
                        best_value = value
                        best_model = model.get("name")
                    elif is_lower_better and value < best_value:
                        best_value = value
                        best_model = model.get("name")
                    elif not is_lower_better and value > best_value:
                        best_value = value
                        best_model = model.get("name")

            if values:
                stats["best_by_metric"][metric_name] = {
                    "model": best_model,
                    "value": best_value,
                }
                stats["metric_ranges"][metric_name] = {
                    "min": min(values),
                    "max": max(values),
                    "mean": sum(values) / len(values),
                }

        return stats


class CheckpointManager:
    """Manage model checkpoints"""

    def __init__(self, output_dir: str):
        """
        Args:
            output_dir: Base directory for model outputs
        """
        self.output_dir = Path(output_dir)

    def list_checkpoints(self, model_path: str) -> List[CheckpointInfo]:
        """List all checkpoints for a model

        Args:
            model_path: Path to the model directory

        Returns:
            List of checkpoint information
        """
        model_dir = Path(model_path)
        if not model_dir.exists():
            return []

        checkpoints = []

        # Look for checkpoint directories (e.g., checkpoint-100, checkpoint-200)
        for checkpoint_dir in sorted(model_dir.glob("checkpoint-*")):
            if not checkpoint_dir.is_dir():
                continue

            try:
                # Extract step number from directory name
                step = int(checkpoint_dir.name.split("-")[-1])

                # Get checkpoint metadata
                trainer_state_path = checkpoint_dir / "trainer_state.json"
                loss = None
                epoch = 0.0

                if trainer_state_path.exists():
                    with open(trainer_state_path, 'r') as f:
                        trainer_state = json.load(f)
                        loss = trainer_state.get("best_metric")
                        epoch = trainer_state.get("epoch", 0.0)

                # Get creation time and size
                stat = checkpoint_dir.stat()
                size_bytes = sum(
                    f.stat().st_size
                    for f in checkpoint_dir.rglob("*")
                    if f.is_file()
                )

                checkpoints.append(CheckpointInfo(
                    checkpoint_id=checkpoint_dir.name,
                    path=str(checkpoint_dir),
                    step=step,
                    epoch=epoch,
                    loss=loss,
                    created_at=stat.st_ctime,
                    size_bytes=size_bytes,
                ))
            except Exception as e:
                print(f"Error processing checkpoint {checkpoint_dir}: {e}")

        return checkpoints

    def get_checkpoint(self, model_path: str, checkpoint_id: str) -> Optional[CheckpointInfo]:
        """Get information about a specific checkpoint"""
        checkpoints = self.list_checkpoints(model_path)
        return next(
            (cp for cp in checkpoints if cp.checkpoint_id == checkpoint_id),
            None
        )

    def delete_checkpoint(self, model_path: str, checkpoint_id: str) -> bool:
        """Delete a specific checkpoint

        Args:
            model_path: Path to the model directory
            checkpoint_id: ID of checkpoint to delete

        Returns:
            True if deleted successfully
        """
        checkpoint_path = Path(model_path) / checkpoint_id

        if not checkpoint_path.exists():
            return False

        try:
            shutil.rmtree(checkpoint_path)
            return True
        except Exception as e:
            print(f"Error deleting checkpoint: {e}")
            return False

    def restore_checkpoint(
        self,
        model_path: str,
        checkpoint_id: str,
        restore_to: str
    ) -> bool:
        """Restore a checkpoint to a new location

        Args:
            model_path: Path to the model directory
            checkpoint_id: ID of checkpoint to restore
            restore_to: Destination path

        Returns:
            True if restored successfully
        """
        checkpoint_path = Path(model_path) / checkpoint_id

        if not checkpoint_path.exists():
            return False

        try:
            dest_path = Path(restore_to)
            dest_path.mkdir(parents=True, exist_ok=True)

            # Copy checkpoint files
            for item in checkpoint_path.iterdir():
                if item.is_file():
                    shutil.copy2(item, dest_path / item.name)
                elif item.is_dir():
                    shutil.copytree(item, dest_path / item.name, dirs_exist_ok=True)

            return True
        except Exception as e:
            print(f"Error restoring checkpoint: {e}")
            return False


class ModelExporter:
    """Export models in various formats"""

    def export_model(
        self,
        model_path: str,
        output_path: str,
        format: str = "safetensors"
    ) -> Dict[str, Any]:
        """Export model in specified format

        Args:
            model_path: Path to the model to export
            output_path: Output path for exported model
            format: Export format (safetensors, pytorch, onnx, gguf)

        Returns:
            Export result with status and details
        """
        src_path = Path(model_path)
        dest_path = Path(output_path)

        if not src_path.exists():
            return {
                "success": False,
                "error": f"Model path not found: {model_path}"
            }

        try:
            dest_path.mkdir(parents=True, exist_ok=True)

            if format == "safetensors":
                # Copy safetensors files
                self._export_safetensors(src_path, dest_path)
            elif format == "pytorch":
                # Copy pytorch files
                self._export_pytorch(src_path, dest_path)
            elif format == "onnx":
                # ONNX export would require model loading and conversion
                return {
                    "success": False,
                    "error": "ONNX export not yet implemented"
                }
            elif format == "gguf":
                # GGUF export would require llama.cpp conversion
                return {
                    "success": False,
                    "error": "GGUF export not yet implemented"
                }
            else:
                return {
                    "success": False,
                    "error": f"Unsupported format: {format}"
                }

            # Calculate exported size
            size_bytes = sum(
                f.stat().st_size
                for f in dest_path.rglob("*")
                if f.is_file()
            )

            return {
                "success": True,
                "output_path": str(dest_path),
                "format": format,
                "size_bytes": size_bytes,
                "size_mb": round(size_bytes / (1024**2), 2),
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def _export_safetensors(self, src_path: Path, dest_path: Path):
        """Export model in safetensors format"""
        # Copy all safetensors files and config
        for pattern in ["*.safetensors", "*.json", "tokenizer*", "*.model"]:
            for file in src_path.glob(pattern):
                if file.is_file():
                    shutil.copy2(file, dest_path / file.name)

    def _export_pytorch(self, src_path: Path, dest_path: Path):
        """Export model in PyTorch format"""
        # Copy all pytorch files and config
        for pattern in ["*.bin", "*.pt", "*.pth", "*.json", "tokenizer*", "*.model"]:
            for file in src_path.glob(pattern):
                if file.is_file():
                    shutil.copy2(file, dest_path / file.name)