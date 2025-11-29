"""add_payment_session_table

Revision ID: abcd1234addpaysession
Revises: f9e55edaa5ee
Create Date: 2025-11-28 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "abcd1234addpaysession"
down_revision = "f9e55edaa5ee"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create payment_sessions table."""
    op.create_table(
        "payment_sessions",
        sa.Column("id", sa.String(length=255), nullable=False),
        sa.Column("event_id", sa.String(length=255), nullable=False),
        sa.Column("user_id", sa.String(length=255), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("expires_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["event_id"], ["events.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_payment_sessions_id", "payment_sessions", ["id"], unique=False)


def downgrade() -> None:
    """Drop payment_sessions table."""
    op.drop_index("ix_payment_sessions_id", table_name="payment_sessions")
    op.drop_table("payment_sessions")


