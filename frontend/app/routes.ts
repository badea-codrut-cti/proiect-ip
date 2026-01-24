import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("profile", "routes/profile.tsx"),
  route("counters", "routes/counters.tsx"),
  route("reviews", "routes/__review.tsx"),
  route("profile/edit", "routes/profile.edit.tsx"),
  route("leaderboard", "routes/leaderboard.tsx"),
  route("counters/:counterId", "routes/counters.$counterId.tsx"),

] satisfies RouteConfig;
