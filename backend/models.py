from pydantic import BaseModel
from typing import List, Optional

class ScrapeRequest(BaseModel):
    username: str

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
