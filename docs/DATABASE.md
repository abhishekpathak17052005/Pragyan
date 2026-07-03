# Pragyan Database Reference

## Overview
Pragyan uses Prisma with MongoDB. The schema is intentionally layered so roadmap generation, learning resources, progress tracking, XP, and assessment telemetry all share a common core instead of duplicating concepts in separate collections.

## Core Learning Hierarchy

### `CareerRoadmap`
Represents the top-level career curriculum. It is the parent container for modules, weeks, days, topics, and resources.

### `CareerRoadmapModule`
Represents a broad curriculum phase or module inside a career roadmap.

### `CareerRoadmapWeek`
Groups a roadmap into weekly learning blocks.

### `CareerRoadmapDay`
Represents a day-level learning unit.

### `CareerRoadmapTopic`
Represents the smallest structured curriculum item in the roadmap tree. Topics are the main attachment point for learning resources.

### `CareerRoadmapResource`
Represents curated content linked to a topic.

## Resource Intelligence Models

### `ResourceLearningHistory`
Tracks how a user interacts with a learning resource.

This model is the foundation for the resource intelligence layer. It supports personalized ranking, history-aware recommendations, and the future progress engine without creating a second parallel tracking system.

Typical uses:
- mark a resource as started or completed
- record whether a resource was verified or useful
- store user-specific learning history for ranking and adaptation

## Progress Models

### `UserProgress`
Stores per-user progress state.

### `CompletedRoadmap`
Stores completed roadmap records.

These tables support roadmap-level completion and dashboard aggregation.

## XP and Daily Learning Models

### `UserXpLog`
Stores XP award history for a user.

### `DailyQuizAttempt`
Stores daily quiz attempt records.

### `UserDailyLearning`
Stores daily learning activity records.

These models support gamification, retention loops, and daily engagement tracking.

## Assessment and Intelligence Models

The schema also contains assessment and adaptive-learning records used by the recommendation and curriculum pipelines.

Common patterns include:
- assessment result storage
- question banks and adaptive decision data
- telemetry for AI-assisted learning flows

## Schema Design Notes

### Hierarchical curriculum model
The roadmap hierarchy is normalized so the UI can render curriculum structure at multiple levels while the admin tools can update individual layers without rewriting the entire roadmap.

### Resource-first personalization
Resources are linked directly to topics and are enriched with user history, which makes it possible to rank learning content by relevance and engagement instead of only by static metadata.

### Progress reuse
The progress engine should reuse `ResourceLearningHistory` and existing roadmap progress collections rather than adding duplicate completion tracking tables.

### Prisma validation
The schema has already been validated successfully, so the documented model names and relations are aligned with the current database design.

## Operational Notes
- MongoDB is the primary database.
- Prisma is used as the data access layer.
- The schema should remain the source of truth for collection shape and relation semantics.
