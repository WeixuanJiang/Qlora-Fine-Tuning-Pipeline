import asyncio
import json
import threading
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

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


class JobStatus(BaseModel):
    id: str
    status: str
    result: Optional[Any] = None
    error: Optional[str] = None


class JobsRegistry:
    def __init__(self) -> None:
        self._jobs: Dict[str, JobStatus] = {}
        self._lock = threading.Lock()

    def create_job(self) -> str:
        job_id = str(uuid.uuid4())
        with self._lock:
            self._jobs[job_id] = JobStatus(id=job_id, status="pending")
        return job_id

    def set_status(self, job_id: str, status: str, *, result: Any = None, error: Optional[str] = None) -> None:
        with self._lock:
            job = self._jobs.get(job_id)
            if not job:
                job = JobStatus(id=job_id, status=status)
            job.status = status
            job.result = result
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


def run_in_background(job_id: str, func, *args, **kwargs) -> None:
    def _target():
        jobs_registry.set_status(job_id, "running")
        try:
            result = func(*args, **kwargs)
            jobs_registry.set_status(job_id, "completed", result=result)
        except Exception as exc:  # pylint: disable=broad-except
            jobs_registry.set_status(job_id, "failed", error=str(exc))

    thread = threading.Thread(target=_target, daemon=True)
    thread.start()


# ----------------------------- Parameter Metadata -----------------------------

TRAIN_PARAM_SPECS: List[Dict[str, Any]] = [
    {
        "name": "model_name",
        "label": "Base Model",
        "type": "string",
        "default": "Qwen/Qwen-0.5B",
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


class MergeRequest(BaseModel):
    base_model_name: str
    adapter_path: str
    output_dir: str
    device: str = Field(default="auto")
    trust_remote_code: bool = Field(default=True)


@app.get("/train/parameters")
def get_train_parameters() -> Dict[str, Any]:
    return {"parameters": TRAIN_PARAM_SPECS}


@app.post("/train")
def trigger_training(request: TrainRequest) -> Dict[str, Any]:
    param_values = {spec["name"]: spec["default"] for spec in TRAIN_PARAM_SPECS}
    param_values.update(request.parameters)

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

    job_id = jobs_registry.create_job()

    def _run_training():
        run_training(**param_values)

    run_in_background(job_id, _run_training)
    return {"job_id": job_id, "status": "queued"}


@app.post("/generate")
async def generate_text(request: GenerateRequest) -> Dict[str, Any]:
    def _generate() -> str:
        inference = ModelInference(
            model_path=request.model_path,
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
    job_id = jobs_registry.create_job()

    def _evaluate():
        evaluator = ModelEvaluator(model_name=request.model or EVAL_MODEL)
        return evaluator.evaluate_dataset(
            predictions_file=request.predictions_file,
            reference_file=request.reference_file,
            output_file=request.output_file,
        )

    run_in_background(job_id, _evaluate)
    return {"job_id": job_id, "status": "queued"}


@app.post("/merge")
def trigger_merge(request: MergeRequest) -> Dict[str, Any]:
    job_id = jobs_registry.create_job()

    def _merge():
        return merge_multiple_loras(
            base_model_name=request.base_model_name,
            adapter_paths=[request.adapter_path],
            output_dir=request.output_dir,
            device=request.device,
            trust_remote_code=request.trust_remote_code,
        )

    run_in_background(job_id, _merge)
    return {"job_id": job_id, "status": "queued"}


@app.get("/jobs")
def list_jobs() -> Dict[str, Any]:
    return {"jobs": [job.dict() for job in jobs_registry.list_jobs()]}


@app.get("/jobs/{job_id}")
def get_job(job_id: str) -> JobStatus:
    try:
        return jobs_registry.get_job(job_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Job not found")


@app.get("/adapters")
def list_adapters() -> Dict[str, Any]:
    config_path = PROJECT_ROOT / "config" / "adapters.json"
    if not config_path.exists():
        return {"adapters": []}
    try:
        with config_path.open("r", encoding="utf-8") as f:
            data = json.load(f)
        adapters = data.get("adapters", [])
        return {"adapters": adapters}
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=500, detail=f"Failed to parse adapters.json: {exc}")
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
