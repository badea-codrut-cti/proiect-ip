import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("profile", "routes/profile.tsx"),
  route("profile/:userId", "routes/profile.$userId.tsx"),
  route("counters", "routes/counters.tsx"),
  route("reviews", "routes/__review.tsx"),

  route("counters/:counterId", "routes/counters.$counterId.tsx"),

  route("contributor/apply", "routes/contributor.apply.tsx"),
  route("admin", "routes/admin.tsx"),
  route("admin/contributor-applications", "routes/admin.contributor-applications.tsx"),
  route("admin/exercises/new", "routes/admin.exercises.new.tsx"),
  route("admin/counter-edits", "routes/admin.counter-edits.tsx"),
  route("contributions", "routes/contributions.tsx"),
  route("settings", "routes/settings.tsx"),

] satisfies RouteConfig;
