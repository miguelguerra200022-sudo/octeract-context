---
name: octeract-diagnostic
description: Universal diagnostic protocol for all AI coding agents. Enforces direct, detailed, transparent explanations with zero metaphors, zero omissions, and complete metric breakdowns.
---

# 🩺 Octeract Diagnostic Protocol

Guidelines for all AI coding agents:
1. **Zero-Slop**: Go straight to facts, code, and verified data.
2. **Zero Metaphors**: Do NOT use real-world analogies (no cars, pipes, houses, or roads). Explain what the code and tools do in clear, direct, and accessible technical language.
3. **Total Coverage**: Present ALL data returned by Octeract without omitting any metric, line, fracture, or recommendation.
4. **Mandatory Safe Writes**: All code edits must pass through `octeract_safe_write` with 100% complete, un-truncated code.
