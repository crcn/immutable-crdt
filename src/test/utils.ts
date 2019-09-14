import { Mutation } from "../mutations";

export const clearMutationTimestamp = (mutation: Mutation): Mutation => ({...mutation, timestamp: 0});