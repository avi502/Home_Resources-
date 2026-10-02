from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, field_validator, ConfigDict


VALID_RESOURCE_TYPES = {"electricity", "water", "food", "money", "time"}
VALID_UNITS = {
    "electricity": {"kWh", "Wh"},
    "water": {"L", "gal", "m3"},
    "food": {"kg", "g", "items"},
    "money": {"USD", "EUR", "GBP", "INR", "CAD", "AUD"},
    "time": {"hrs", "mins"}
}


UNIT_ALIASES = {
    "liters": "L",
    "liter": "L",
    "l": "L",
    "gallons": "gal",
    "gallon": "gal",
    "gal": "gal",
    "m3": "m3",
    "kwh": "kWh",
    "wh": "Wh",
    "kg": "kg",
    "kilograms": "kg",
    "kilogram": "kg",
    "grams": "g",
    "gram": "g",
    "g": "g",
    "items": "items",
    "item": "items",
    "hours": "hrs",
    "hour": "hrs",
    "hrs": "hrs",
    "hr": "hrs",
    "minutes": "mins",
    "minute": "mins",
    "mins": "mins",
    "min": "mins",
    "usd": "USD",
    "dollars": "USD",
    "dollar": "USD",
    "$": "USD",
    "eur": "EUR",
    "gbp": "GBP",
    "inr": "INR",
    "cad": "CAD",
    "aud": "AUD"
}


class ResourceEntryCreate(BaseModel):
    resource_type: str = Field(..., description="electricity, water, food, money, or time")
    amount: float = Field(..., gt=0, description="Amount consumed/used")
    unit: str = Field(..., description="Explicit unit of measurement")
    cost: Optional[float] = Field(0.0, ge=0, description="Financial cost if applicable")
    activity_tag: Optional[str] = Field("general", max_length=100)
    recorded_at: Optional[datetime] = Field(None, description="UTC timestamp of occurrence")
    notes: Optional[str] = Field(None, max_length=500)
    is_demo: bool = Field(False)

    @field_validator("resource_type")
    @classmethod
    def validate_resource_type(cls, v: str) -> str:
        clean = v.lower().strip()
        if clean not in VALID_RESOURCE_TYPES:
            raise ValueError(f"Invalid resource_type: {v}. Must be one of: {', '.join(sorted(VALID_RESOURCE_TYPES))}")
        return clean

    @field_validator("unit")
    @classmethod
    def validate_unit(cls, v: str) -> str:
        clean = v.strip()
        clean_norm = UNIT_ALIASES.get(clean.lower(), clean)
        all_valid = {u for units in VALID_UNITS.values() for u in units}
        if clean_norm not in all_valid:
            raise ValueError(f"Invalid unit: '{v}'. Must be an explicit standard unit (e.g. kWh, L, kg, hrs, USD)")
        return clean_norm


class ResourceEntryUpdate(BaseModel):
    amount: Optional[float] = Field(None, gt=0)
    unit: Optional[str] = None
    cost: Optional[float] = Field(None, ge=0)
    activity_tag: Optional[str] = None
    notes: Optional[str] = None


class ResourceEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    household_id: int
    resource_type: str
    amount: float
    unit: str
    cost: float
    activity_tag: str
    recorded_at: datetime
    notes: Optional[str] = None
    is_demo: bool
    created_at: datetime


class ResourceSummaryItem(BaseModel):
    resource_type: str
    total_amount: float
    unit: str
    total_cost: float
    entry_count: int
    daily_average: float
    is_demo: bool = False


class DashboardSummaryResponse(BaseModel):
    summaries: List[ResourceSummaryItem]
    recent_entries: List[ResourceEntryResponse]
    household_name: str
    currency: str
