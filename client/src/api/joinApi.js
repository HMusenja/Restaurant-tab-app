import { post } from "./client";

export const joinWithInvite = (invite) => post("/join", { invite });
export const joinWithCode = (code) => post("/join/code", { code });
