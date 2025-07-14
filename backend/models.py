from pydantic import BaseModel, Field
from typing import List, Optional


class ScrapeRequest(BaseModel):
    username: str = Field(..., example="spez")


class ScrapeResponse(BaseModel):
    username: str
    name: Optional[str] = None
    profile_picture: Optional[str] = None
    snoovatar: Optional[str] = None
    occupation: Optional[str] = None
    status: Optional[str] = None
    location: Optional[str] = None
    comment_karma: Optional[int] = None
    post_karma: Optional[int] = None
    total_karma: Optional[int] = None
    created_utc: Optional[float] = None
    is_mod: Optional[bool] = None
    is_gold: Optional[bool] = None
    verified: Optional[bool] = None
    has_verified_email: Optional[bool] = None
    accept_chats: Optional[bool] = None
    accept_pms: Optional[bool] = None
    accept_followers: Optional[bool] = None

    posts: List[dict]
    comments: List[dict]

class PersonaCore(BaseModel):
    introversion_extroversion: int = Field(..., ge=1, le=10)
    intuition_sensing: int = Field(..., ge=1, le=10)
    feeling_thinking: int = Field(..., ge=1, le=10)
    perceiving_judging: int = Field(..., ge=1, le=10)

    behaviors_and_habits: List[str] = Field(..., min_items=1)
    goals_and_needs: List[str] = Field(..., min_items=1)
    frustrations: List[str] = Field(..., min_items=1)
    motivations: List[str] = Field(..., min_items=1)
    keywords: List[str] = Field(..., min_items=1)

    personality_type: str | None = None
    emotional_regulation: int | None = None



class PersonaResponse(BaseModel):
    username: str
    name: Optional[str] = None
    profile_picture: Optional[str] = None
    snoovatar: Optional[str] = None
    occupation: Optional[str] = None
    status: Optional[str] = None
    location: Optional[str] = None
    comment_karma: Optional[int] = None
    post_karma: Optional[int] = None
    total_karma: Optional[int] = None
    created_utc: Optional[float] = None
    is_mod: Optional[bool] = None
    is_gold: Optional[bool] = None
    verified: Optional[bool] = None
    has_verified_email: Optional[bool] = None
    accept_chats: Optional[bool] = None
    accept_pms: Optional[bool] = None
    accept_followers: Optional[bool] = None

    introversion_extroversion: int = Field(..., ge=1, le=10)
    intuition_sensing: int = Field(..., ge=1, le=10)
    feeling_thinking: int = Field(..., ge=1, le=10)
    perceiving_judging: int = Field(..., ge=1, le=10)

    behaviors_and_habits: List[str] = Field(..., min_items=1)
    goals_and_needs: List[str] = Field(..., min_items=1)
    frustrations: List[str] = Field(..., min_items=1)
    motivations: List[str] = Field(..., min_items=1)
    keywords: List[str] = Field(..., min_items=4, max_items=4)

    personality_type: str | None = None
    emotional_regulation: int | None = None
