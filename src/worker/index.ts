import type { AppEnv } from "../shared/types";
import { routeRequest } from "./router";

export default {
  fetch(request: Request, env: AppEnv): Promise<Response> {
    return routeRequest(request, env);
  },
};
