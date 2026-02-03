import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("profile", "routes/profile.tsx"),
  route("profile/:userId", "routes/profile.$userId.tsx"),
  route("counters", "routes/counters.tsx"),
  route("badges", "routes/badges.tsx"),
  route("leaderboard", "routes/leaderboard.tsx"),
  route("reviews", "routes/__review.tsx"),

  route("counters/:counterId", "routes/counters.$counterId.tsx"),

  route("contributor/apply", "routes/contributor.apply.tsx"),
  route("admin", "routes/admin.tsx"),
  route("admin/contributor-applications", "routes/admin.contributor-applications.tsx"),
  route("admin/counter-edits", "routes/admin.counter-edits.tsx"),
  route("admin/exercises", "routes/admin.exercises.tsx"),
  route("contributions", "routes/contributions.tsx"),
  route("settings", "routes/settings.tsx"),

] satisfies RouteConfig;
