import type { ExtractMessageTypes, WrapIntoQueue } from "./wrappers";

export type ThreadsData = Record<string, [state: unknown, message: unknown]>;

export type MainJob<Threads extends ThreadsData = ThreadsData> = (thread: Thread<Threads>) => Promise<any>;

export type ThreadJob<Threads extends ThreadsData = ThreadsData, Context = any> = (
    thread: Thread<Threads>,
    ctx: Context
) => Promise<Context>;

export interface Thread<Threads extends ThreadsData = ThreadsData> {
    message<Target extends keyof Threads>(target: Target, data: ExtractMessageTypes<Threads>[Target]): void;
    receive(): WrapIntoQueue<ExtractMessageTypes<Threads>>[keyof Threads][number] | undefined;
}
