from pydantic import BaseModel, Field
from typing import List, Literal


class ScrapeRequest(BaseModel):
    username: str = Field(..., example="spez")


class PostComment(BaseModel):
    type: Literal["post", "comment"]
    body: str
    url: str


class ScrapeResponse(BaseModel):
    username: str
    posts: list[PostComment]
    comments: list[PostComment]

class PersonaResponse(BaseModel):
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
