"""
System and GPU monitoring utilities for real-time training metrics
"""
import os
import time
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
import threading
import psutil

try:
    import pynvml
    PYNVML_AVAILABLE = True
except ImportError:
    PYNVML_AVAILABLE = False


@dataclass
class GPUMetrics:
    """GPU utilization and memory metrics"""
    index: int
    name: str
    utilization: float  # Percentage
    memory_used: float  # GB
    memory_total: float  # GB
    memory_percent: float  # Percentage
    temperature: float  # Celsius
    power_usage: float  # Watts
    power_limit: float  # Watts


@dataclass
class SystemMetrics:
    """System-wide resource utilization metrics"""
    timestamp: float
    cpu_percent: float
    memory_used: float  # GB
    memory_total: float  # GB
    memory_percent: float
    disk_used: float  # GB
    disk_total: float  # GB
    disk_percent: float
    gpus: List[GPUMetrics]


class SystemMonitor:
    """Monitor system resources (CPU, memory, disk, GPU)"""

    def __init__(self):
        self._nvml_initialized = False
        if PYNVML_AVAILABLE:
            try:
                pynvml.nvmlInit()
                self._nvml_initialized = True
                self._gpu_count = pynvml.nvmlDeviceGetCount()
            except Exception as e:
                print(f"Warning: Failed to initialize NVML: {e}")
                self._gpu_count = 0
        else:
            self._gpu_count = 0

    def __del__(self):
        if self._nvml_initialized:
            try:
                pynvml.nvmlShutdown()
            except:
                pass

    def get_cpu_metrics(self) -> Dict[str, float]:
        """Get CPU utilization metrics"""
        return {
            "cpu_percent": psutil.cpu_percent(interval=0.1),
            "cpu_count": psutil.cpu_count(),
            "cpu_freq": psutil.cpu_freq().current if psutil.cpu_freq() else 0,
        }

    def get_memory_metrics(self) -> Dict[str, float]:
        """Get memory utilization metrics"""
        mem = psutil.virtual_memory()
        return {
            "memory_used": mem.used / (1024**3),  # Convert to GB
            "memory_total": mem.total / (1024**3),
            "memory_percent": mem.percent,
            "memory_available": mem.available / (1024**3),
        }

    def get_disk_metrics(self, path: str = "/") -> Dict[str, float]:
        """Get disk utilization metrics"""
        disk = psutil.disk_usage(path)
        return {
            "disk_used": disk.used / (1024**3),  # Convert to GB
            "disk_total": disk.total / (1024**3),
            "disk_percent": disk.percent,
            "disk_free": disk.free / (1024**3),
        }

    def get_gpu_metrics(self) -> List[GPUMetrics]:
        """Get GPU utilization and memory metrics"""
        if not self._nvml_initialized or self._gpu_count == 0:
            return []

        gpu_metrics = []
        for i in range(self._gpu_count):
            try:
                handle = pynvml.nvmlDeviceGetHandleByIndex(i)
                name = pynvml.nvmlDeviceGetName(handle)
                if isinstance(name, bytes):
                    name = name.decode('utf-8')

                # Get utilization
                utilization = pynvml.nvmlDeviceGetUtilizationRates(handle)

                # Get memory info
                mem_info = pynvml.nvmlDeviceGetMemoryInfo(handle)
                memory_used = mem_info.used / (1024**3)  # Convert to GB
                memory_total = mem_info.total / (1024**3)
                memory_percent = (mem_info.used / mem_info.total) * 100

                # Get temperature
                try:
                    temperature = pynvml.nvmlDeviceGetTemperature(handle, pynvml.NVML_TEMPERATURE_GPU)
                except:
                    temperature = 0.0

                # Get power usage
                try:
                    power_usage = pynvml.nvmlDeviceGetPowerUsage(handle) / 1000.0  # Convert to watts
                    power_limit = pynvml.nvmlDeviceGetPowerManagementLimit(handle) / 1000.0
                except:
                    power_usage = 0.0
                    power_limit = 0.0

                gpu_metrics.append(GPUMetrics(
                    index=i,
                    name=name,
                    utilization=float(utilization.gpu),
                    memory_used=memory_used,
                    memory_total=memory_total,
                    memory_percent=memory_percent,
                    temperature=float(temperature),
                    power_usage=power_usage,
                    power_limit=power_limit,
                ))
            except Exception as e:
                print(f"Error getting metrics for GPU {i}: {e}")

        return gpu_metrics

    def get_all_metrics(self) -> SystemMetrics:
        """Get all system metrics in one call"""
        cpu_metrics = self.get_cpu_metrics()
        memory_metrics = self.get_memory_metrics()
        disk_metrics = self.get_disk_metrics()
        gpu_metrics = self.get_gpu_metrics()

        return SystemMetrics(
            timestamp=time.time(),
            cpu_percent=cpu_metrics["cpu_percent"],
            memory_used=memory_metrics["memory_used"],
            memory_total=memory_metrics["memory_total"],
            memory_percent=memory_metrics["memory_percent"],
            disk_used=disk_metrics["disk_used"],
            disk_total=disk_metrics["disk_total"],
            disk_percent=disk_metrics["disk_percent"],
            gpus=gpu_metrics,
        )

    def get_metrics_dict(self) -> Dict[str, Any]:
        """Get all metrics as a dictionary"""
        metrics = self.get_all_metrics()
        result = asdict(metrics)
        # Convert GPU metrics to dictionaries
        result["gpus"] = [asdict(gpu) for gpu in metrics.gpus]
        return result


class MetricsCollector:
    """Background thread to collect metrics at regular intervals"""

    def __init__(self, interval: float = 1.0, max_history: int = 1000):
        """
        Args:
            interval: Collection interval in seconds
            max_history: Maximum number of metrics to keep in history
        """
        self.interval = interval
        self.max_history = max_history
        self.monitor = SystemMonitor()
        self.history: List[Dict[str, Any]] = []
        self._lock = threading.Lock()
        self._running = False
        self._thread: Optional[threading.Thread] = None

    def start(self):
        """Start collecting metrics in the background"""
        if self._running:
            return

        self._running = True
        self._thread = threading.Thread(target=self._collect_loop, daemon=True)
        self._thread.start()

    def stop(self):
        """Stop collecting metrics"""
        self._running = False
        if self._thread:
            self._thread.join(timeout=5.0)

    def _collect_loop(self):
        """Background loop to collect metrics"""
        while self._running:
            try:
                metrics = self.monitor.get_metrics_dict()
                with self._lock:
                    self.history.append(metrics)
                    # Trim history if it exceeds max size
                    if len(self.history) > self.max_history:
                        self.history = self.history[-self.max_history:]
            except Exception as e:
                print(f"Error collecting metrics: {e}")

            time.sleep(self.interval)

    def get_latest(self) -> Optional[Dict[str, Any]]:
        """Get the most recent metrics"""
        with self._lock:
            return self.history[-1] if self.history else None

    def get_history(self, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get metrics history

        Args:
            limit: Maximum number of recent metrics to return
        """
        with self._lock:
            if limit is None:
                return self.history.copy()
            return self.history[-limit:] if limit > 0 else []

    def get_since(self, timestamp: float) -> List[Dict[str, Any]]:
        """Get metrics since a specific timestamp"""
        with self._lock:
            return [m for m in self.history if m["timestamp"] >= timestamp]

    def clear_history(self):
        """Clear metrics history"""
        with self._lock:
            self.history.clear()


# Global metrics collector instance
_global_collector: Optional[MetricsCollector] = None


def get_metrics_collector() -> MetricsCollector:
    """Get or create the global metrics collector"""
    global _global_collector
    if _global_collector is None:
        _global_collector = MetricsCollector(interval=2.0)
        _global_collector.start()
    return _global_collector


def get_current_metrics() -> Dict[str, Any]:
    """Get current system metrics"""
    monitor = SystemMonitor()
    return monitor.get_metrics_dict()