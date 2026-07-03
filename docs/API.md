# Pragyan API Reference

## Overview
Pragyan exposes REST APIs under `/api`. Most learning and dashboard routes are authenticated, while assessment and public roadmap discovery endpoints are mixed between public and authenticated access depending on the use case.

## Authentication
- `authenticate` middleware protects user-specific routes.
- `authorize('ADMIN')` protects admin routes.
- Several AI routes are also guarded by rate limiting and AI firewall controls.

## Assessment APIs

### `POST /api/assessment/start`
Purpose: Start a new assessment session.

Authentication: Public

Request:
```json
{
  "category": "string",
  "mode": "string"
}
```

### `POST /api/assessment/answer`
Purpose: Submit an assessment answer.

Authentication: JWT

### `POST /api/assessment/submit`
Purpose: Submit the adaptive assessment.

Authentication: JWT

### `GET /api/assessment/results/:id`
Purpose: Fetch an adaptive assessment result.

Authentication: JWT

### `GET /api/assessment/questions`
Purpose: Fetch assessment questions.

Authentication: Public

### `GET /api/assessment/questions/:category`
Purpose: Fetch category-specific assessment questions.

Authentication: Public

### `POST /api/assessment/create`
Purpose: Admin-create an assessment.

Authentication: Admin JWT

### `POST /api/assessment/submit-legacy`
Purpose: Legacy assessment submission endpoint.

Authentication: JWT

### `GET /api/assessment/result/:resultId`
Purpose: Fetch legacy assessment result.

Authentication: JWT

### `POST /api/assessment/save`
Purpose: Save assessment answers.

Authentication: JWT

### `GET /api/assessment/history`
Purpose: Fetch user assessment history.

Authentication: JWT

### `GET /api/assessment/latest`
Purpose: Fetch latest assessment result.

Authentication: JWT

### `POST /api/assessment/hybrid/parse-resume`
Purpose: Parse uploaded or submitted resume content.

Authentication: JWT

### `POST /api/assessment/hybrid/answers`
Purpose: Save hybrid assessment answers.

Authentication: JWT

### `GET /api/assessment/hybrid/domain-questions/:domain`
Purpose: Fetch questions for a specific assessment domain.

Authentication: Public

### `POST /api/assessment/hybrid/start`
Purpose: Start a hybrid assessment session.

Authentication: Public

### `POST /api/assessment/hybrid/:sessionId/answer`
Purpose: Submit an answer for a hybrid assessment session.

Authentication: Public

### `POST /api/assessment/generate`
Purpose: Admin-generated assessment creation.

Authentication: Admin JWT

### `POST /api/assessment/next`
Purpose: Fetch the next adaptive assessment questions.

Authentication: Public

### `GET /api/assessment/decision/start`
Purpose: Start a decision-tree assessment.

Authentication: Public

### `POST /api/assessment/decision/next`
Purpose: Answer the next decision-tree step.

Authentication: Public

### `POST /api/assessment/decision/complete`
Purpose: Complete the decision-tree assessment.

Authentication: JWT

### `GET /api/assessment/decision/result/:sessionId`
Purpose: Fetch a decision-tree result.

Authentication: JWT

## Roadmap APIs

### `GET /api/roadmaps`
Purpose: Fetch public roadmap catalog.

Authentication: Public

### `GET /api/roadmaps/search`
Purpose: Search roadmaps.

Authentication: Public

### `GET /api/roadmaps/categories`
Purpose: List roadmap categories.

Authentication: Public

### `GET /api/roadmaps/category/:category`
Purpose: Fetch roadmaps by category.

Authentication: Public

### `GET /api/roadmaps/:id`
Purpose: Fetch a roadmap by id.

Authentication: Public

### `GET /api/roadmaps/skillup/:careerId`
Purpose: Fetch a skill-up roadmap for a career.

Authentication: JWT

### `POST /api/roadmaps/progress`
Purpose: Save roadmap progress.

Authentication: JWT

### `GET /api/roadmaps/progress`
Purpose: Fetch current roadmap progress.

Authentication: JWT

### `PATCH /api/roadmaps/task/:id`
Purpose: Update a roadmap task's completion state.

Authentication: JWT

### `POST /api/roadmaps`
Purpose: Admin-create a roadmap.

Authentication: Admin JWT

### `PUT /api/roadmaps/:id`
Purpose: Admin-update a roadmap.

Authentication: Admin JWT

### `DELETE /api/roadmaps/:id`
Purpose: Admin-delete a roadmap.

Authentication: Admin JWT

## Career Roadmap APIs

### `GET /api/careers`
Purpose: List approved career roadmaps.

Authentication: Public

### `GET /api/careers/:slug`
Purpose: Fetch a full career roadmap by slug.

Authentication: Public

### `GET /api/topics/:id`
Purpose: Fetch a topic by id.

Authentication: Public

### `GET /api/topics/:id/resources`
Purpose: Fetch resources for a topic.

Authentication: Public

## Learning Resource APIs

### `GET /api/learning-resources`
Purpose: List curated learning resources.

Authentication: Public

### `GET /api/learning-resources/roadmaps/:roadmapId`
Purpose: List learning resources for a roadmap.

Authentication: Public

### `GET /api/learning-resources/personalized`
Purpose: Fetch personalized learning resources.

Authentication: JWT

### `GET /api/learning-resources/history`
Purpose: Fetch learning resource history.

Authentication: JWT

### `POST /api/learning-resources/history`
Purpose: Upsert learning resource history.

Authentication: JWT

## Progress APIs

### `GET /api/progress/:roadmapId`
Purpose: Fetch progress for a roadmap.

Authentication: JWT

### `POST /api/progress/complete-task`
Purpose: Mark a task as completed.

Authentication: JWT

### `POST /api/progress/complete-roadmap`
Purpose: Mark a roadmap as completed.

Authentication: JWT

### `GET /api/progress/user/dashboard`
Purpose: Fetch dashboard progress summary.

Authentication: JWT

## Admin APIs

### `GET /api/admin/dashboard`
Purpose: Fetch admin dashboard metrics.

Authentication: Admin JWT

### `GET /api/admin/users`
Purpose: List users.

Authentication: Admin JWT

### `GET /api/admin/current-users`
Purpose: List current active users.

Authentication: Admin JWT

### `PATCH /api/admin/users/:id/role`
Purpose: Update a user's role.

Authentication: Admin JWT

### `GET /api/admin/roadmaps`
Purpose: Fetch roadmap analytics.

Authentication: Admin JWT

### `GET /api/admin/resources`
Purpose: Fetch admin resources.

Authentication: Admin JWT

### `POST /api/admin/resources`
Purpose: Create an admin resource.

Authentication: Admin JWT

### `PUT /api/admin/resources/:id`
Purpose: Update an admin resource.

Authentication: Admin JWT

### `DELETE /api/admin/resources/:id`
Purpose: Delete an admin resource.

Authentication: Admin JWT

### `GET /api/admin/assessments`
Purpose: Fetch assessment analytics.

Authentication: Admin JWT

### `GET /api/admin/assessments/completion-rates`
Purpose: Fetch assessment completion rates.

Authentication: Admin JWT

### `POST /api/admin/assessment-questions`
Purpose: Create assessment questions.

Authentication: Admin JWT

### `GET /api/admin/adaptive/decision-tree`
Purpose: Fetch adaptive decision tree.

Authentication: Admin JWT

### `PUT /api/admin/adaptive/decision-tree`
Purpose: Update adaptive decision tree.

Authentication: Admin JWT

### `GET /api/admin/adaptive/weights`
Purpose: Fetch adaptive weights.

Authentication: Admin JWT

### `PUT /api/admin/adaptive/weights`
Purpose: Update adaptive weights.

Authentication: Admin JWT

### `POST /api/admin/careers`
Purpose: Admin-create a career roadmap.

Authentication: Admin JWT

### `PUT /api/admin/careers/:id/weights`
Purpose: Update career weights.

Authentication: Admin JWT

### `GET /api/admin/career-resources`
Purpose: List topic resources.

Authentication: Admin JWT

### `POST /api/admin/resource`
Purpose: Add a topic resource.

Authentication: Admin JWT

### `PUT /api/admin/resource/:id`
Purpose: Update a topic resource.

Authentication: Admin JWT

### `DELETE /api/admin/resource/:id`
Purpose: Delete a topic resource.

Authentication: Admin JWT

### `PUT /api/admin/resource/reorder`
Purpose: Reorder resources for a topic.

Authentication: Admin JWT

### `POST /api/admin/generate-roadmap`
Purpose: Generate a curriculum preview.

Authentication: Admin JWT

### `POST /api/admin/approve-roadmap`
Purpose: Approve and persist a roadmap.

Authentication: Admin JWT

### `PUT /api/admin/module/:id`
Purpose: Update a roadmap module.

Authentication: Admin JWT

### `PUT /api/admin/week/:id`
Purpose: Update a roadmap week.

Authentication: Admin JWT

### `PUT /api/admin/day/:id`
Purpose: Update a roadmap day.

Authentication: Admin JWT

### `PUT /api/admin/topic/:id`
Purpose: Update a roadmap topic.

Authentication: Admin JWT

### `GET /api/admin/security/metrics`
Purpose: Fetch security metrics.

Authentication: Admin JWT

## AI APIs

### `GET /api/ai/recommend-careers`
Purpose: Fetch career recommendations.

Authentication: Public

### `GET /api/ai/roadmaps/:career`
Purpose: Fetch recommended roadmaps for a career.

Authentication: Public

### `POST /api/ai/personalized-roadmap`
Purpose: Generate a personalized roadmap.

Authentication: JWT

### `GET /api/ai/status`
Purpose: Check AI service status.

Authentication: Public

### `GET /api/ai/telemetry`
Purpose: Fetch AI telemetry.

Authentication: Public

### `POST /api/ai/chat`
Purpose: Chat with the AI assistant.

Authentication: JWT

### `POST /api/ai/action-event`
Purpose: Record AI action telemetry.

Authentication: JWT

### `POST /api/ai/daily-plan`
Purpose: Generate a daily learning plan.

Authentication: JWT

### `POST /api/ai/report`
Purpose: Generate an assessment report.

Authentication: JWT

### `POST /api/ai/roadmap`
Purpose: Generate a learning roadmap.

Authentication: JWT

### `GET /api/ai/decision/evaluate`
Purpose: Evaluate a decision tree.

Authentication: JWT

### `POST /api/ai/decision/snapshot`
Purpose: Save a decision snapshot.

Authentication: JWT

### `GET /api/ai/decision/snapshots`
Purpose: Fetch decision snapshots.

Authentication: JWT

### `GET /api/ai/memory`
Purpose: Fetch AI memory profile.

Authentication: JWT

### `POST /api/ai/memory`
Purpose: Save AI memory profile.

Authentication: JWT

### `POST /api/ai/memory/recommendation`
Purpose: Record recommendation history.

Authentication: JWT

### `POST /api/ai/roadmap/mutate`
Purpose: Record roadmap mutation history.

Authentication: JWT

### `GET /api/ai/personality`
Purpose: Fetch personality profile.

Authentication: JWT

### `POST /api/ai/personality`
Purpose: Save personality profile.

Authentication: JWT

### `POST /api/ai/learning-velocity`
Purpose: Record learning velocity.

Authentication: JWT

### `GET /api/ai/learning-velocity`
Purpose: Fetch learning velocity history.

Authentication: JWT

### `POST /api/ai/memory/feedback`
Purpose: Record AI feedback.

Authentication: JWT

### `GET /api/ai/memory/recommendations`
Purpose: Fetch recommendation history.

Authentication: JWT

## Notes
- Exact response shapes are defined in the relevant controller/service layers.
- Some routes have legacy and modern variants to preserve backward compatibility.
