import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("profile", "routes/profile.tsx"),
  route("counters", "routes/counters.tsx"),

  route("counters/:counterId", "routes/counters.$counterId.tsx"),


  route("__review", "routes/__review.tsx"),
] satisfies RouteConfig;
