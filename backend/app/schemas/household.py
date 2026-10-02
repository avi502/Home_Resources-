from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class HouseholdCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    currency: str = Field("USD", min_length=1, max_length=10)
    timezone: str = Field("UTC", max_length=50)
    electricity_tariff_rate: float = Field(0.18, gt=0, description="Cost per kWh")
    water_tariff_rate: float = Field(0.004, gt=0, description="Cost per Liter")


class HouseholdUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    currency: Optional[str] = Field(None, min_length=1, max_length=10)
    timezone: Optional[str] = Field(None, max_length=50)
    electricity_tariff_rate: Optional[float] = Field(None, gt=0)
    water_tariff_rate: Optional[float] = Field(None, gt=0)


class HouseholdResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    owner_id: int
    currency: str
    timezone: str
    electricity_tariff_rate: float
    water_tariff_rate: float
    created_at: datetime
