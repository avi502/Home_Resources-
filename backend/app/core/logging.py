import logging
import sys
import re

SENSITIVE_PATTERNS = [
    re.compile(r'password["\']?\s*[:=]\s*["\']?([^"\'\s]+)', re.IGNORECASE),
    re.compile(r'token["\']?\s*[:=]\s*["\']?([^"\'\s]+)', re.IGNORECASE),
    re.compile(r'secret["\']?\s*[:=]\s*["\']?([^"\'\s]+)', re.IGNORECASE),
    re.compile(r'bearer\s+([A-Za-z0-9_\-\.]+)', re.IGNORECASE),
]


class SanitizedFormatter(logging.Formatter):
    """Custom formatter to strip passwords, tokens and secrets from log messages."""
    def format(self, record: logging.LogRecord) -> str:
        msg = super().format(record)
        for pattern in SENSITIVE_PATTERNS:
            msg = pattern.sub(r'***REDACTED***', msg)
        return msg


def setup_logging() -> logging.Logger:
    logger = logging.getLogger("homeresource")
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = SanitizedFormatter(
            "[%(asctime)s] [%(levelname)s] [%(name)s]: %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    return logger


logger = setup_logging()
