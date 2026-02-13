"""
Backend Logging API Endpoint

Receives and stores logs from frontend application
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import json
from pathlib import Path

router = APIRouter(prefix="/logs", tags=["logging"])

# Define log storage directories
LOGS_BASE_DIR = Path("logs")
LOGS_BASE_DIR.mkdir(exist_ok=True)

# Frontend logs in separate subdirectory
FRONTEND_LOGS_DIR = LOGS_BASE_DIR / "frontend"
FRONTEND_LOGS_DIR.mkdir(exist_ok=True)


class LogContextModel(BaseModel):
    userId: Optional[str] = None
    sessionId: str
    userAgent: str
    url: str
    route: str
    referrer: Optional[str] = None
    screenWidth: int
    screenHeight: int
    deviceType: str
    os: str
    browser: str
    appVersion: Optional[str] = None
    environment: str
    timestamp: str
    timeInSession: int


class NetworkLogModel(BaseModel):
    method: str
    url: str
    status: Optional[int] = None
    duration: Optional[int] = None
    requestBody: Optional[Any] = None
    responseBody: Optional[Any] = None
    error: Optional[str] = None
    headers: Optional[Dict[str, str]] = None


class UserActionLogModel(BaseModel):
    action: str
    target: str
    targetId: Optional[str] = None
    targetClass: Optional[str] = None
    value: Optional[Any] = None
    metadata: Optional[Dict[str, Any]] = None


class PerformanceLogModel(BaseModel):
    metric: str
    duration: int
    details: Optional[Dict[str, Any]] = None


class ErrorLogModel(BaseModel):
    message: str
    stack: Optional[str] = None
    componentStack: Optional[str] = None
    errorInfo: Optional[Any] = None
    boundary: Optional[str] = None
    recoverable: bool


class LogEntryModel(BaseModel):
    id: str
    level: str
    category: str
    message: str
    context: LogContextModel
    networkLog: Optional[NetworkLogModel] = None
    userActionLog: Optional[UserActionLogModel] = None
    performanceLog: Optional[PerformanceLogModel] = None
    errorLog: Optional[ErrorLogModel] = None
    tags: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None
    uploaded: bool
    uploadAttempts: int


class LogBatchRequest(BaseModel):
    logs: List[LogEntryModel]


@router.post("")
async def receive_logs(batch: LogBatchRequest):
    """
    Receive and store logs from frontend
    """
    try:
        # Get current date for file organization
        today = datetime.now().strftime("%Y-%m-%d")
        log_file = FRONTEND_LOGS_DIR / f"frontend-{today}.jsonl"
        
        # Write each log as a JSON line
        with open(log_file, "a", encoding="utf-8") as f:
            for log in batch.logs:
                log_dict = log.model_dump()
                f.write(json.dumps(log_dict) + "\n")
        
        # Log errors to separate file for easy access
        error_logs = [
            log for log in batch.logs 
            if log.level in ["error", "fatal"]
        ]
        
        if error_logs:
            error_file = FRONTEND_LOGS_DIR / f"errors-{today}.jsonl"
            with open(error_file, "a", encoding="utf-8") as f:
                for log in error_logs:
                    log_dict = log.model_dump()
                    f.write(json.dumps(log_dict) + "\n")
        
        return {
            "success": True,
            "received": len(batch.logs),
            "errors": len(error_logs),
            "message": f"Successfully stored {len(batch.logs)} logs"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to store logs: {str(e)}"
        )


@router.get("/stats")
async def get_log_stats():
    """
    Get statistics about stored logs
    """
    try:
        log_files = list(FRONTEND_LOGS_DIR.glob("frontend-*.jsonl"))
        error_files = list(FRONTEND_LOGS_DIR.glob("errors-*.jsonl"))
        
        total_logs = 0
        total_errors = 0
        
        for log_file in log_files:
            with open(log_file, "r", encoding="utf-8") as f:
                total_logs += sum(1 for _ in f)
        
        for error_file in error_files:
            with open(error_file, "r", encoding="utf-8") as f:
                total_errors += sum(1 for _ in f)
        
        return {
            "totalLogs": total_logs,
            "totalErrors": total_errors,
            "logFiles": len(log_files),
            "errorFiles": len(error_files),
            "oldestLog": min([f.stem.split("-")[1:] for f in log_files]) if log_files else None,
            "newestLog": max([f.stem.split("-")[1:] for f in log_files]) if log_files else None,
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get log stats: {str(e)}"
        )


@router.get("/recent")
async def get_recent_logs(
    limit: int = 100,
    level: Optional[str] = None,
    category: Optional[str] = None
):
    """
    Get recent logs with optional filtering
    """
    try:
        # Get today's log file
        today = datetime.now().strftime("%Y-%m-%d")
        log_file = FRONTEND_LOGS_DIR / f"frontend-{today}.jsonl"
        
        if not log_file.exists():
            return {"logs": [], "count": 0}
        
        logs = []
        with open(log_file, "r", encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                    
                log = json.loads(line)
                
                # Apply filters
                if level and log.get("level") != level:
                    continue
                if category and log.get("category") != category:
                    continue
                
                logs.append(log)
        
        # Get most recent logs
        logs = sorted(logs, key=lambda x: x["context"]["timestamp"], reverse=True)
        logs = logs[:limit]
        
        return {
            "logs": logs,
            "count": len(logs)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get recent logs: {str(e)}"
        )


@router.delete("/clear")
async def clear_logs(
    days_old: int = 7
):
    """
    Clear logs older than specified days
    """
    try:
        from datetime import timedelta
        
        cutoff_date = datetime.now() - timedelta(days=days_old)
        deleted_count = 0
        
        for log_file in FRONTEND_LOGS_DIR.glob("*.jsonl"):
            # Parse date from filename
            try:
                date_str = log_file.stem.split("-", 1)[1]
                file_date = datetime.strptime(date_str, "%Y-%m-%d")
                
                if file_date < cutoff_date:
                    log_file.unlink()
                    deleted_count += 1
            except (ValueError, IndexError):
                continue
        
        return {
            "success": True,
            "deleted": deleted_count,
            "message": f"Deleted {deleted_count} log files older than {days_old} days"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to clear logs: {str(e)}"
        )
