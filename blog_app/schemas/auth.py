from pydantic import BaseModel, ConfigDict, Field

class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = Field(..., description="Seconds for access token expiration")


class RefreshRequest(BaseModel):
    refresh_token: str