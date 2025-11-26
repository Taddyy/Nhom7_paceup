from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class EmailSubscriptionBase(BaseModel):
  email: EmailStr
  source: Optional[str] = None


class EmailSubscriptionCreate(EmailSubscriptionBase):
  pass


class EmailSubscriptionRead(EmailSubscriptionBase):
  id: str
  created_at: datetime

  class Config:
    orm_mode = True


class EmailSubscriptionList(BaseModel):
  items: list[EmailSubscriptionRead]
  total: int


