from pydantic import BaseModel, Field
from typing import Literal


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
