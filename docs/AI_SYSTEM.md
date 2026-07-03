# Pragyan AI System Reference

## Overview
Pragyan uses AI in a controlled pipeline. The system is designed to personalize learning outcomes while keeping roadmap structure deterministic, explainable, and reviewable.

The core principle is simple: AI may personalize the curriculum, but it does not invent the curriculum structure from scratch.

## AI Flow

### 1. Input collection
The system starts with user profile data, assessment results, career goals, and learning history.

### 2. Domain detection
Career and roadmap content are mapped to a domain so the generator can apply the right template family.

### 3. Template registry selection
A domain-aware template registry provides curriculum scaffolding for the target career area.

### 4. Prompt construction
The generator builds a structured prompt that asks Gemini for a curriculum-shaped roadmap, not a generic bullet list.

### 5. AI generation
Gemini produces the roadmap payload, including weeks, days, topics, and resource suggestions.

### 6. Normalization
The response is coerced into the canonical roadmap shape so downstream services can rely on stable fields.

### 7. Quality scoring
The roadmap is scored for structural quality, depth, and curriculum completeness.

### 8. Prerequisite validation
The system checks topic order and prerequisite graph consistency so learning flows in the correct sequence.

### 9. Zod validation
The final payload must pass schema validation before it is returned or persisted.

### 10. Admin review
Admin tooling exposes diagnostics, warnings, and curriculum stats so the generated roadmap can be reviewed before approval.

## AI Components

### Roadmap generation
The master roadmap generator is the main curriculum authoring pipeline. It combines:
- domain detection
- template-driven scaffolding
- Gemini personalization
- quality checks
- fallback curriculum logic

### Resource intelligence
The learning-resource system uses AI-assisted ranking and history-aware personalization to surface the most relevant material.

### Assessment intelligence
Assessment flows use AI for recommendation, explanation, daily plans, and report generation.

### Memory and telemetry
The AI routes include memory, telemetry, recommendation history, personality, and learning velocity endpoints so the system can improve personalization over time.

## Guardrails
- The generator should not emit placeholder curricula.
- The curriculum structure must remain deterministic enough for admin review.
- Invalid or low-quality output is rejected before persistence.
- Legacy and modern AI routes coexist only for compatibility.

## Relationship to the Progress Engine
The AI system supports progress tracking indirectly by producing clearer curricula and better resource recommendations. The Progress Engine itself should remain a product-layer feature, not a new AI generation layer.

## Implementation Anchors
- Roadmap generation and quality enforcement live in the master roadmap generator module.
- Resource learning history feeds recommendation and personalization.
- Admin review exposes diagnostics for manual approval.
