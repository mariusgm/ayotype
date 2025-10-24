"""
Claude Agent Runtime
Private Reusable Browser Automation + Console Diagnostics

A lightweight Python framework for browser automation and testing
with Claude AI integration capabilities.
"""

__version__ = "1.0.0"
__author__ = "Claude Agent Runtime"

from .core.agent import ClaudeAgent
from .drivers.playwright_driver import BrowserDriver

__all__ = ["ClaudeAgent", "BrowserDriver"]
