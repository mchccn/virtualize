import type { ThreadJob, ThreadsData } from "./jobs";

export type WrapIntoThreads<Types extends ThreadsData> = {
    [K in keyof Types]: ThreadJob<Types, Types[K][0]>[];
};

export type WrapIntoStatuses<Types extends ThreadsData> = {
    [K in keyof Types]: boolean;
};

export type WrapIntoQueue<Types extends ExtractMessageTypes<ThreadsData>> = {
    [K in keyof Types]: Array<{ from: keyof Types; data: Types[K][] }>;
};

export type ExtractMessageTypes<Types extends ThreadsData> = {
    [K in keyof Types]: Types[K][1];
};
