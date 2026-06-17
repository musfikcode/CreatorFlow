import { createLoader } from "nuqs/server";
import { credentialsParams } from "../hooks/params";

export const credentialsParamsLoader = createLoader(credentialsParams);
