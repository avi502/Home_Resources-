from typing import Generic, TypeVar, Optional, Any
from pydantic import BaseModel

T = TypeVar("T")


class ResponseMeta(BaseModel):
    model_version: str = "1.0"
    confidence: Optional[float] = None
    timestamp: Optional[str] = None


class StandardResponse(BaseModel, Generic[T]):
    data: Optional[T] = None
    meta: ResponseMeta = ResponseMeta()
    error: Optional[str] = None
