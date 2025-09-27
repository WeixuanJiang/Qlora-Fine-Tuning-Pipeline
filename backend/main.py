import asyncio
import io
import json
import os
import re
import shutil
import threading
import time
import uuid
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from huggingface_hub import HfApi
from huggingface_hub.utils import HfHubHTTPError

# Ensure project root on path
import sys
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from train import train as run_training  # noqa: E402  # type: ignore
from run_inference import ModelInference  # noqa: E402  # type: ignore
from eval import ModelEvaluator, EVAL_MODEL  # noqa: E402  # type: ignore
from merge_multiple_loras import merge_multiple_loras  # noqa: E402  # type: ignore

app = FastAPI(title="QLoRA Pipeline API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check() -> Dict[str, Any]:
    return {"status": "ok"}


MAX_LOG_LINES = 2000

WINDOWS_DRIVE_PATTERN = re.compile(r'^([a-zA-Z]):[\\/](.*)$')


def normalize_path_string(path: Optional[str]) -> Optional[str]:
    if path is None:
        return None
    raw = path.strip()
    if not raw:
        return raw
    match = WINDOWS_DRIVE_PATTERN.match(raw)
    if match:
        drive = match.group(1).lower()
        rest = match.group(2).replace('\\', '/').lstrip('/')
        return f"/mnt/{drive}/{rest}"
    return raw.replace('\\', '/')


def resolve_storage_path(path: str) -> Path:
    normalized = normalize_path_string(path) or path
    candidate = Path(normalized)
    if not candidate.is_absolute():
        candidate = (PROJECT_ROOT / candidate).resolve()
    return candidate


def load_adapter_registry() -> List[Dict[str, Any]]:
    """Return adapter entries from config/adapters.json."""
    config_path = PROJECT_ROOT / "config" / "adapters.json"
    if not config_path.exists():
        return []

    try:
        with config_path.open("r", encoding="utf-8") as config_file:
            data = json.load(config_file)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=500, detail=f"Failed to parse adapters.json: {exc}") from exc

    adapters = data.get("adapters", [])
    if not isinstance(adapters, list):
        return []
    return adapters


def _relative_path(path: Path) -> str:
    try:
        relative = path.relative_to(PROJECT_ROOT)
    except ValueError:
        relative = path
    return str(relative).replace("\\", "/")


def _collect_file_entries(root: Path, patterns: Sequence[str]) -> List[Dict[str, str]]:
    entries: Dict[str, Dict[str, str]] = {}
    if not root.exists():
        return []

    for pattern in patterns:
        for file_path in root.rglob(pattern):
            if not file_path.is_file():
                continue
            rel = _relative_path(file_path)
            entries[rel] = {"path": rel, "label": rel}

    return [entries[key] for key in sorted(entries.keys())]


def _catalog_entry(path_value: str, *, label: Optional[str] = None) -> Optional[Dict[str, str]]:
    if not path_value:
        return None

    normalized = normalize_path_string(path_value) or path_value
    candidate = Path(normalized)
    if candidate.is_absolute():
        cleaned = _relative_path(candidate)
    else:
        cleaned = normalized.replace("\\", "/")

    display = label or cleaned
    return {"path": cleaned, "label": display}


def _collect_model_catalog() -> List[Dict[str, str]]:
    entries: Dict[str, Dict[str, str]] = {}

    default_entry = _catalog_entry("./merged_model")
    if default_entry:
        entries[default_entry["path"]] = default_entry

    merged_root = PROJECT_ROOT / "merged_model"
    if merged_root.exists() and merged_root.is_dir():
        for child in sorted(merged_root.iterdir()):
            if not child.is_dir():
                continue
            rel = _relative_path(child)
            entries[rel] = {"path": rel, "label": rel}

    for adapter in load_adapter_registry():
        raw_path = adapter.get("path")
        entry = _catalog_entry(raw_path or "")
        if not entry:
            continue
        adapter_name = adapter.get("name")
        training_date = adapter.get("training_date")
        if adapter_name:
            label_parts = [adapter_name]
            if training_date:
                label_parts.append(f"({training_date})")
            label_parts.append(entry["path"])
            entry["label"] = " ".join(label_parts)
        entries[entry["path"]] = entry

    return [entries[key] for key in sorted(entries.keys())]


def _collect_adapter_catalog() -> List[Dict[str, str]]:
    entries: Dict[str, Dict[str, str]] = {}

    for adapter in load_adapter_registry():
        raw_path = adapter.get("path")
        entry = _catalog_entry(raw_path or "")
        if not entry:
            continue
        adapter_name = adapter.get("name")
        training_date = adapter.get("training_date")
        if adapter_name:
            label_parts = [adapter_name]
            if training_date:
                label_parts.append(f"({training_date})")
            label_parts.append(entry["path"])
            entry["label"] = " ".join(label_parts)
        entries[entry["path"]] = entry

    output_root = PROJECT_ROOT / "output"
    if output_root.exists() and output_root.is_dir():
        for child in sorted(output_root.iterdir()):
            if not child.is_dir():
                continue
            rel = _relative_path(child)
            entries.setdefault(rel, {"path": rel, "label": rel})

    return [entries[key] for key in sorted(entries.keys())]


def _collect_prediction_catalog() -> List[Dict[str, str]]:
    predictions_root = PROJECT_ROOT / "predictions"
    return _collect_file_entries(predictions_root, ("*.json", "*.jsonl"))


def _collect_reference_catalog() -> List[Dict[str, str]]:
    references_root = PROJECT_ROOT / "data"
    return _collect_file_entries(references_root, ("*.json", "*.jsonl"))


def _collect_evaluation_results_catalog() -> List[Dict[str, str]]:
    evaluation_root = PROJECT_ROOT / "evaluation"
    all_entries = _collect_file_entries(evaluation_root, ("*.json",))
    filtered = []
    for entry in all_entries:
        path = entry["path"]
        if path.endswith("evaluation_results.json") or path.endswith("latest_evaluation.json"):
            filtered.append(entry)
    return filtered


class JobStatus(BaseModel):
    id: str
    status: str
    kind: Optional[str] = None
    summary: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    result: Optional[Any] = None
    error: Optional[str] = None
    created_at: float = Field(default_factory=time.time)


class JobsRegistry:
    def __init__(self) -> None:
        self._jobs: Dict[str, JobStatus] = {}
        self._lock = threading.Lock()

    def create_job(
        self,
        *,
        kind: Optional[str] = None,
        summary: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> str:
        job_id = str(uuid.uuid4())
        with self._lock:
            self._jobs[job_id] = JobStatus(
                id=job_id,
                status="pending",
                kind=kind,
                summary=summary,
                metadata=metadata or {},
            )
        with job_logs_lock:
            job_logs[job_id] = []
            job_log_base[job_id] = 0
        return job_id

    def set_status(
        self,
        job_id: str,
        status: str,
        *,
        result: Any = None,
        error: Optional[str] = None,
        summary: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        with self._lock:
            job = self._jobs.get(job_id)
            if not job:
                job = JobStatus(id=job_id, status=status)
            job.status = status
            if summary is not None:
                job.summary = summary
            if metadata is not None:
                job.metadata = metadata
            if result is not None:
                job.result = result
            elif status in {"pending", "running"}:
                job.result = None
            job.error = error
            self._jobs[job_id] = job

    def get_job(self, job_id: str) -> JobStatus:
        with self._lock:
            job = self._jobs.get(job_id)
            if not job:
                raise KeyError(job_id)
            return job

    def list_jobs(self) -> List[JobStatus]:
        with self._lock:
            return list(self._jobs.values())


jobs_registry = JobsRegistry()


job_logs: Dict[str, List[str]] = {}
job_log_base: Dict[str, int] = {}
job_logs_lock = threading.Lock()


def _append_job_log(job_id: str, message: str) -> None:
    line = message.rstrip("\n")
    if not line:
        return
    with job_logs_lock:
        buffer = job_logs.setdefault(job_id, [])
        buffer.append(line)
        base = job_log_base.get(job_id, 0)
        if len(buffer) > MAX_LOG_LINES:
            drop = len(buffer) - MAX_LOG_LINES
            del buffer[:drop]
            job_log_base[job_id] = base + drop


class JobLogWriter(io.TextIOBase):
    def __init__(self, job_id: str) -> None:
        super().__init__()
        self.job_id = job_id
        self._buffer = ""

    def writable(self) -> bool:
        return True

    def write(self, message: str) -> int:  # type: ignore[override]
        if not isinstance(message, str):
            message = str(message)
        if not message:
            return 0
        data = self._buffer + message
        lines = data.splitlines(keepends=True)
        self._buffer = ""
        for chunk in lines:
            if chunk.endswith("\n"):
                _append_job_log(self.job_id, chunk[:-1])
            else:
                self._buffer = chunk
        return len(message)

    def flush(self) -> None:  # type: ignore[override]
        if self._buffer:
            _append_job_log(self.job_id, self._buffer)
            self._buffer = ""


def run_in_background(job_id: str, func, *args, **kwargs) -> None:
    def _target():
        jobs_registry.set_status(job_id, "running")
        job_log_writer = JobLogWriter(job_id)
        _append_job_log(job_id, "Job started")
        try:
            with redirect_stdout(job_log_writer), redirect_stderr(job_log_writer):
                result = func(*args, **kwargs)
            job_log_writer.flush()
            jobs_registry.set_status(job_id, "completed", result=result)
            _append_job_log(job_id, "Job completed")
        except Exception as exc:  # pylint: disable=broad-except
            job_log_writer.flush()
            _append_job_log(job_id, f"Job failed: {exc}")
            jobs_registry.set_status(job_id, "failed", error=str(exc))

    thread = threading.Thread(target=_target, daemon=True)
    thread.start()


# ----------------------------- Parameter Metadata -----------------------------

TRAIN_PARAM_SPECS: List[Dict[str, Any]] = [
    {
        "name": "model_name",
        "label": "Base Model",
        "type": "string",
        "default": "Qwen/Qwen2.5-0.5B-Instruct",
        "category": "General",
        "help": "Model identifier or local path",
    },
    {
        "name": "dataset_path",
        "label": "Dataset Path",
        "type": "string",
        "default": None,
        "category": "General",
        "help": "Path to local dataset JSON file (upload via UI to populate automatically)",
    },
    {
        "name": "dataset_name",
        "label": "Dataset Name",
        "type": "string",
        "default": None,
        "category": "General",
        "help": "Optional dataset identifier",
    },
    {
        "name": "output_dir",
        "label": "Output Directory",
        "type": "string",
        "default": "output",
        "category": "General",
        "help": "Directory to save checkpoints",
    },
    {
        "name": "trust_remote_code",
        "label": "Trust Remote Code",
        "type": "boolean",
        "default": True,
        "category": "General",
    },
    {
        "name": "input_column",
        "label": "Input Column",
        "type": "string",
        "default": "input",
        "category": "Dataset",
    },
    {
        "name": "target_column",
        "label": "Target Column",
        "type": "string",
        "default": "output",
        "category": "Dataset",
    },
    {
        "name": "max_samples",
        "label": "Max Samples",
        "type": "number",
        "subtype": "int",
        "default": None,
        "category": "Dataset",
    },
    {
        "name": "max_length",
        "label": "Max Sequence Length",
        "type": "number",
        "subtype": "int",
        "default": 2048,
        "category": "Dataset",
    },
    {
        "name": "max_target_length",
        "label": "Max Target Length",
        "type": "number",
        "subtype": "int",
        "default": None,
        "category": "Dataset",
    },
    {
        "name": "num_train_epochs",
        "label": "Epochs",
        "type": "number",
        "subtype": "float",
        "default": 3.0,
        "category": "Training",
    },
    {
        "name": "per_device_train_batch_size",
        "label": "Per-Device Batch Size",
        "type": "number",
        "subtype": "int",
        "default": 4,
        "category": "Training",
    },
    {
        "name": "gradient_accumulation_steps",
        "label": "Gradient Accumulation Steps",
        "type": "number",
        "subtype": "int",
        "default": 4,
        "category": "Training",
    },
    {
        "name": "learning_rate",
        "label": "Learning Rate",
        "type": "number",
        "subtype": "float",
        "default": 2e-4,
        "category": "Training",
    },
    {
        "name": "weight_decay",
        "label": "Weight Decay",
        "type": "number",
        "subtype": "float",
        "default": 0.001,
        "category": "Training",
    },
    {
        "name": "warmup_ratio",
        "label": "Warmup Ratio",
        "type": "number",
        "subtype": "float",
        "default": 0.03,
        "category": "Training",
    },
    {
        "name": "warmup_steps",
        "label": "Warmup Steps",
        "type": "number",
        "subtype": "int",
        "default": 0,
        "category": "Training",
    },
    {
        "name": "max_grad_norm",
        "label": "Max Grad Norm",
        "type": "number",
        "subtype": "float",
        "default": 1.0,
        "category": "Training",
    },
    {
        "name": "lr_scheduler_type",
        "label": "LR Scheduler",
        "type": "string",
        "default": "cosine",
        "category": "Training",
    },
    {
        "name": "optim",
        "label": "Optimizer",
        "type": "string",
        "default": "adamw_bnb_8bit",
        "category": "Training",
    },
    {
        "name": "fp16",
        "label": "FP16",
        "type": "boolean",
        "default": False,
        "category": "Training",
    },
    {
        "name": "bf16",
        "label": "BF16",
        "type": "boolean",
        "default": False,
        "category": "Training",
    },
    {
        "name": "max_steps",
        "label": "Max Steps",
        "type": "number",
        "subtype": "int",
        "default": -1,
        "category": "Training",
    },
    {
        "name": "evaluation_strategy",
        "label": "Evaluation Strategy",
        "type": "string",
        "default": "no",
        "category": "Training",
    },
    {
        "name": "eval_steps",
        "label": "Evaluation Steps",
        "type": "number",
        "subtype": "int",
        "default": None,
        "category": "Training",
    },
    {
        "name": "lora_r",
        "label": "LoRA Rank",
        "type": "number",
        "subtype": "int",
        "default": 64,
        "category": "LoRA",
    },
    {
        "name": "lora_alpha",
        "label": "LoRA Alpha",
        "type": "number",
        "subtype": "int",
        "default": 128,
        "category": "LoRA",
    },
    {
        "name": "lora_dropout",
        "label": "LoRA Dropout",
        "type": "number",
        "subtype": "float",
        "default": 0.05,
        "category": "LoRA",
    },
    {
        "name": "lora_target_modules",
        "label": "LoRA Target Modules",
        "type": "list",
        "default": None,
        "category": "LoRA",
    },
    {
        "name": "modules_to_save",
        "label": "Modules to Save",
        "type": "list",
        "default": None,
        "category": "LoRA",
    },
    {
        "name": "fan_in_fan_out",
        "label": "Fan In Fan Out",
        "type": "boolean",
        "default": False,
        "category": "LoRA",
    },
    {
        "name": "bias",
        "label": "Bias",
        "type": "string",
        "default": "none",
        "category": "LoRA",
    },
    {
        "name": "use_gradient_checkpointing",
        "label": "Use Gradient Checkpointing",
        "type": "boolean",
        "default": False,
        "category": "LoRA",
    },
    {
        "name": "seed",
        "label": "Seed",
        "type": "number",
        "subtype": "int",
        "default": 42,
        "category": "Misc",
    },
    {
        "name": "logging_steps",
        "label": "Logging Steps",
        "type": "number",
        "subtype": "int",
        "default": 10,
        "category": "Misc",
    },
    {
        "name": "save_steps",
        "label": "Save Steps",
        "type": "number",
        "subtype": "int",
        "default": 100,
        "category": "Misc",
    },
    {
        "name": "save_total_limit",
        "label": "Save Total Limit",
        "type": "number",
        "subtype": "int",
        "default": 3,
        "category": "Misc",
    },
    {
        "name": "bits",
        "label": "Quantization Bits",
        "type": "number",
        "subtype": "int",
        "default": 4,
        "category": "Quantization",
    },
    {
        "name": "double_quant",
        "label": "Double Quant",
        "type": "boolean",
        "default": True,
        "category": "Quantization",
    },
    {
        "name": "quant_type",
        "label": "Quantization Type",
        "type": "string",
        "default": "nf4",
        "category": "Quantization",
    },
    {
        "name": "load_in_8bit",
        "label": "Load in 8bit",
        "type": "boolean",
        "default": False,
        "category": "Quantization",
    },
    {
        "name": "load_in_4bit",
        "label": "Load in 4bit",
        "type": "boolean",
        "default": True,
        "category": "Quantization",
    },
    {
        "name": "group_size",
        "label": "Group Size",
        "type": "number",
        "subtype": "int",
        "default": 128,
        "category": "Quantization",
    },
    {
        "name": "use_nested_quant",
        "label": "Use Nested Quant",
        "type": "boolean",
        "default": False,
        "category": "Quantization",
    },
    {
        "name": "prompt_template_type",
        "label": "Prompt Template Type",
        "type": "string",
        "default": None,
        "category": "Prompt",
    },
    {
        "name": "prompt_template",
        "label": "Prompt Template",
        "type": "json",
        "default": None,
        "category": "Prompt",
    },
    {
        "name": "run_name",
        "label": "Run Name",
        "type": "string",
        "default": None,
        "category": "Tracking",
    },
    {
        "name": "report_to",
        "label": "Report To",
        "type": "string",
        "default": None,
        "category": "Tracking",
        "help": "Comma separated (e.g. none,tensorboard)",
    },
    {
        "name": "model_cache_dir",
        "label": "Model Cache Directory",
        "type": "string",
        "default": None,
        "category": "Tracking",
    },
    {
        "name": "register_adapter",
        "label": "Register Adapter",
        "type": "boolean",
        "default": True,
        "category": "Tracking",
    },
    {
        "name": "adapter_name",
        "label": "Adapter Name",
        "type": "string",
        "default": None,
        "category": "Tracking",
    },
    {
        "name": "adapter_description",
        "label": "Adapter Description",
        "type": "string",
        "default": None,
        "category": "Tracking",
    },
    {
        "name": "adapter_config_path",
        "label": "Adapter Config Path",
        "type": "string",
        "default": None,
        "category": "Tracking",
    },
    {
        "name": "save_safetensors",
        "label": "Save Safetensors",
        "type": "boolean",
        "default": True,
        "category": "Model Saving",
    },
    {
        "name": "resume_from_checkpoint",
        "label": "Resume From Checkpoint",
        "type": "string",
        "default": None,
        "category": "Model Saving",
    },
    {
        "name": "push_to_hub",
        "label": "Push To Hub",
        "type": "boolean",
        "default": False,
        "category": "Model Saving",
    },
    {
        "name": "hub_model_id",
        "label": "Hub Model ID",
        "type": "string",
        "default": None,
        "category": "Model Saving",
    },
    {
        "name": "hub_private_repo",
        "label": "Hub Private Repo",
        "type": "boolean",
        "default": True,
        "category": "Model Saving",
    },
    {
        "name": "hub_token",
        "label": "Hub Token",
        "type": "string",
        "default": None,
        "category": "Model Saving",
    },
]


class TrainRequest(BaseModel):
    parameters: Dict[str, Any] = Field(default_factory=dict)


class GenerateRequest(BaseModel):
    model_path: str = Field(default="./merged_model")
    prompt: str
    max_new_tokens: Optional[int] = Field(default=256)
    temperature: float = Field(default=0.7)
    top_p: float = Field(default=0.9)
    top_k: int = Field(default=50)
    num_beams: int = Field(default=1)
    device: str = Field(default="auto")
    trust_remote_code: bool = Field(default=True)


class EvaluateRequest(BaseModel):
    predictions_file: str
    reference_file: str
    output_file: Optional[str] = None
    model: Optional[str] = None
    openai_api_key: Optional[str] = None


class MergeRequest(BaseModel):
    base_model_name: str
    adapter_path: str
    output_dir: str
    device: str = Field(default="auto")
    trust_remote_code: bool = Field(default=True)


class PublishToHubRequest(BaseModel):
    source_dir: str
    repo_id: str
    token: str | None = None
    private: bool = Field(default=False)
    commit_message: str | None = Field(default="Upload merged model")
    repo_type: str = Field(default="model")


class AdapterDeleteRequest(BaseModel):
    path: str
    remove_files: bool = Field(default=False)


@app.get("/train/parameters")
def get_train_parameters() -> Dict[str, Any]:
    return {"parameters": TRAIN_PARAM_SPECS}


@app.post("/train")
def trigger_training(request: TrainRequest) -> Dict[str, Any]:
    param_values = {spec["name"]: spec["default"] for spec in TRAIN_PARAM_SPECS}
    param_values.update(request.parameters)

    path_keys = ["model_name", "dataset_path", "output_dir", "model_cache_dir", "resume_from_checkpoint", "adapter_config_path"]
    for key in path_keys:
        if param_values.get(key):
            param_values[key] = normalize_path_string(str(param_values[key]))

    # Normalize certain fields
    if isinstance(param_values.get("lora_target_modules"), str) and param_values["lora_target_modules"]:
        param_values["lora_target_modules"] = [m.strip() for m in param_values["lora_target_modules"].split(",") if m.strip()]
    if isinstance(param_values.get("modules_to_save"), str) and param_values["modules_to_save"]:
        param_values["modules_to_save"] = [m.strip() for m in param_values["modules_to_save"].split(",") if m.strip()]
    if isinstance(param_values.get("report_to"), str) and param_values["report_to"]:
        param_values["report_to"] = [s.strip() for s in param_values["report_to"].split(",") if s.strip()]
    if isinstance(param_values.get("prompt_template"), str) and param_values["prompt_template"]:
        try:
            param_values["prompt_template"] = json.loads(param_values["prompt_template"])
        except json.JSONDecodeError as exc:
            raise HTTPException(status_code=400, detail=f"Invalid prompt_template JSON: {exc}")

    model_name = param_values.get("model_name") or "model"
    summary = f"Fine-tune {model_name}"
    dataset_label = param_values.get("dataset_name") or param_values.get("dataset_path")
    if dataset_label:
        dataset_label = Path(str(dataset_label)).name
        summary = f"{summary} on {dataset_label}"

    metadata = {
        "model_name": param_values.get("model_name"),
        "dataset_path": param_values.get("dataset_path"),
        "dataset_name": param_values.get("dataset_name"),
        "output_dir": param_values.get("output_dir"),
    }

    job_id = jobs_registry.create_job(kind="train", summary=summary, metadata=metadata)

    def _run_training():
        run_training(**param_values)

    run_in_background(job_id, _run_training)
    return {"job_id": job_id, "status": "queued"}


@app.post("/generate")
async def generate_text(request: GenerateRequest) -> Dict[str, Any]:
    def _generate() -> str:
        try:
            model_path = str(resolve_storage_path(request.model_path))
        except Exception:
            model_path = normalize_path_string(request.model_path) or request.model_path

        inference = ModelInference(
            model_path=model_path,
            device=request.device,
            max_length=request.max_new_tokens or 256,
            temperature=request.temperature,
            top_p=request.top_p,
            top_k=request.top_k,
            num_beams=request.num_beams,
            trust_remote_code=request.trust_remote_code,
        )
        return inference.generate_response(
            request.prompt,
            max_new_tokens=request.max_new_tokens,
        )

    loop = asyncio.get_running_loop()
    response = await loop.run_in_executor(None, _generate)
    return {"response": response}


@app.post("/evaluate")
def trigger_evaluation(request: EvaluateRequest) -> Dict[str, Any]:
    pred_label = Path(str(request.predictions_file)).name
    ref_label = Path(str(request.reference_file)).name
    summary = f"Evaluate {pred_label} vs {ref_label}"
    metadata = {
        "predictions_file": request.predictions_file,
        "reference_file": request.reference_file,
        "output_file": request.output_file,
        "model": request.model or EVAL_MODEL,
    }
    if request.openai_api_key:
        metadata["uses_custom_openai_key"] = True

    job_id = jobs_registry.create_job(kind="evaluate", summary=summary, metadata=metadata)

    def _evaluate():
        token = (request.openai_api_key or "").strip()
        previous_token = os.environ.get("OPENAI_API_KEY")
        if token:
            os.environ["OPENAI_API_KEY"] = token
        evaluator = ModelEvaluator(model_name=request.model or EVAL_MODEL)
        predictions_file = str(resolve_storage_path(request.predictions_file))
        reference_file = str(resolve_storage_path(request.reference_file))
        output_file = request.output_file
        if output_file:
            output_file = str(resolve_storage_path(output_file))
        try:
            return evaluator.evaluate_dataset(
                predictions_file=predictions_file,
                reference_file=reference_file,
                output_file=output_file,
            )
        finally:
            if token:
                if previous_token is None:
                    os.environ.pop("OPENAI_API_KEY", None)
                else:
                    os.environ["OPENAI_API_KEY"] = previous_token

    run_in_background(job_id, _evaluate)
    return {"job_id": job_id, "status": "queued"}


@app.post("/merge")
def trigger_merge(request: MergeRequest) -> Dict[str, Any]:
    adapter_label = Path(str(request.adapter_path)).name
    output_label = Path(str(request.output_dir)).name
    summary = f"Merge {adapter_label} -> {output_label}"
    metadata = {
        "base_model_name": request.base_model_name,
        "adapter_path": request.adapter_path,
        "output_dir": request.output_dir,
        "device": request.device,
    }

    job_id = jobs_registry.create_job(kind="merge", summary=summary, metadata=metadata)

    def _merge():
        adapter_path = str(resolve_storage_path(request.adapter_path))
        output_dir = str(resolve_storage_path(request.output_dir))
        return merge_multiple_loras(
            base_model_name=request.base_model_name,
            adapter_paths=[adapter_path],
            output_dir=output_dir,
            device=request.device,
            trust_remote_code=request.trust_remote_code,
        )

    run_in_background(job_id, _merge)
    return {"job_id": job_id, "status": "queued"}


@app.post("/publish/hub")
def publish_to_hub(request: PublishToHubRequest) -> Dict[str, Any]:
    source_label = Path(str(request.source_dir)).name
    summary = f"Upload {source_label} to {request.repo_id}"
    metadata = {
        "source_dir": request.source_dir,
        "repo_id": request.repo_id,
        "private": request.private,
    }

    job_id = jobs_registry.create_job(kind="publish", summary=summary, metadata=metadata)

    def _publish():
        source_path = resolve_storage_path(request.source_dir)
        if not source_path.exists() or not source_path.is_dir():
            raise ValueError(f"Source directory does not exist: {source_path}")

        repo_id = request.repo_id.strip()
        if not repo_id:
            raise ValueError("A Hugging Face repo ID is required")

        token = (request.token or "").strip() or os.environ.get("HF_TOKEN") or os.environ.get("HUGGINGFACEHUB_API_TOKEN")

        print(f"Preparing upload of '{source_path}' to Hugging Face repo '{repo_id}'")
        if request.private:
            print("Target repository will be private")

        if token:
            print("Using provided Hugging Face access token")
        else:
            print("No Hugging Face token provided; attempting upload with existing credentials")

        api = HfApi(token=token)

        try:
            api.create_repo(repo_id=repo_id, repo_type=request.repo_type, private=request.private, exist_ok=True)
            print("Repository ready; starting upload...")
            api.upload_folder(
                folder_path=str(source_path),
                repo_id=repo_id,
                repo_type=request.repo_type,
                commit_message=request.commit_message or "Upload merged model",
            )
            print("Upload completed successfully")
        except HfHubHTTPError as exc:
            raise RuntimeError(f"Hugging Face Hub error: {exc}") from exc

        return {"repo_id": repo_id}

    run_in_background(job_id, _publish)
    return {"job_id": job_id, "status": "queued"}


@app.get("/evaluation/results")
def fetch_evaluation_results(path: Optional[str] = Query(default=None)) -> Dict[str, Any]:
    if path:
        target_path = resolve_storage_path(path)
    else:
        target_path = PROJECT_ROOT / "evaluation" / "latest_evaluation.json"
        if not target_path.exists():
            raise HTTPException(status_code=404, detail="No evaluation results found")

    if not target_path.exists():
        raise HTTPException(status_code=404, detail=f"Evaluation file not found: {target_path}")

    try:
        with target_path.open("r", encoding="utf-8") as f:
            data = json.load(f)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail=f"Invalid evaluation JSON: {exc}") from exc

    metadata = data.setdefault("metadata", {})
    metadata["source_path"] = str(target_path)
    return data


@app.get("/jobs")
def list_jobs() -> Dict[str, Any]:
    return {"jobs": [job.dict() for job in jobs_registry.list_jobs()]}


@app.get("/jobs/{job_id}")
def get_job(job_id: str) -> JobStatus:
    try:
        return jobs_registry.get_job(job_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Job not found") from exc


@app.get("/jobs/{job_id}/logs")
def get_job_logs(job_id: str, since: int = Query(0, ge=0)) -> Dict[str, Any]:
    try:
        jobs_registry.get_job(job_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Job not found") from exc

    with job_logs_lock:
        base = job_log_base.get(job_id, 0)
        buffer = job_logs.get(job_id, [])
        total = base + len(buffer)

        if since < base:
            start_idx = 0
            reset = True
        else:
            start_idx = since - base
            if start_idx < 0:
                start_idx = 0
            reset = False

        new_lines = buffer[start_idx:]
        next_offset = base + len(buffer)

    return {
        "logs": new_lines,
        "next_offset": next_offset,
        "reset": reset,
        "total": total,
    }


@app.get("/adapters")
def list_adapters() -> Dict[str, Any]:
    adapters = load_adapter_registry()
    return {"adapters": adapters}


@app.get("/storage/catalog")
def list_storage_catalog() -> Dict[str, Any]:
    return {
        "models": _collect_model_catalog(),
        "merge": _collect_adapter_catalog(),
        "predictions": _collect_prediction_catalog(),
        "references": _collect_reference_catalog(),
        "evaluation_results": _collect_evaluation_results_catalog(),
    }


@app.delete("/adapters")
def delete_adapter(request: AdapterDeleteRequest) -> Dict[str, Any]:
    config_path = PROJECT_ROOT / "config" / "adapters.json"
    if not config_path.exists():
        raise HTTPException(status_code=404, detail="No adapter registry found")

    try:
        with config_path.open("r", encoding="utf-8") as f:
            data = json.load(f)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=500, detail=f"Failed to parse adapters.json: {exc}") from exc

    normalized_path = normalize_path_string(request.path) or request.path
    adapters = data.get("adapters", [])
    target = next((adapter for adapter in adapters if adapter.get("path") == normalized_path), None)
    if not target:
        raise HTTPException(status_code=404, detail="Adapter not found")

    data["adapters"] = [adapter for adapter in adapters if adapter.get("path") != normalized_path]

    with config_path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)

    removed_files = False
    if request.remove_files:
        adapter_path = resolve_storage_path(normalized_path)

        try:
            adapter_path.relative_to(PROJECT_ROOT)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="Adapter path must reside within project directory") from exc

        if adapter_path.exists():
            removed_files = True
            if adapter_path.is_dir():
                shutil.rmtree(adapter_path)
            else:
                adapter_path.unlink()

    return {"removed": target, "removed_files": removed_files}
@app.post("/datasets/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    destination: str = Form("data"),
) -> Dict[str, Any]:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Uploaded file must have a name")

    dest_dir = (PROJECT_ROOT / destination).resolve()
    if PROJECT_ROOT not in dest_dir.parents and dest_dir != PROJECT_ROOT:
        raise HTTPException(status_code=400, detail="Destination must reside within project directory")

    dest_dir.mkdir(parents=True, exist_ok=True)
    dest_path = dest_dir / file.filename

    try:
        content = await file.read()
        dest_path.write_bytes(content)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to save dataset: {exc}") from exc

    return {
        "filename": file.filename,
        "path": str(dest_path.relative_to(PROJECT_ROOT)),
        "size": len(content),
    }
