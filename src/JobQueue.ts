import type { MainJob, Thread, ThreadJob, ThreadsData } from "./jobs";
import * as json from "./json";
import { MessageQueue } from "./MessageQueue";
import type { ExtractMessageTypes, WrapIntoStatuses, WrapIntoThreads } from "./wrappers";

export class JobQueue<Threads extends ThreadsData = ThreadsData> {
    private mq = new MessageQueue<ExtractMessageTypes<Threads>>();

    public readonly main = Symbol("JobQueue#main");

    private running = false;

    private terminate = false;

    private resetted = false;

    private readonly noop = async () => {};

    private threads = {} as WrapIntoThreads<Threads>;

    private originals = {} as Threads;

    private states = {} as Threads;

    private halted = {} as WrapIntoStatuses<Threads>;

    public constructor(private readonly delay: number) {}

    private queue: (MainJob | ThreadJob)[] = [];

    private thread(thread: keyof Threads): Thread<Threads> {
        return {
            message: (target, data) => {
                this.mq.send(thread, target, data);
            },
            receive: () => {
                return this.mq.receive(thread);
            },
        };
    }

    private generator(): AsyncGenerator<MainJob | ThreadJob, never, undefined> {
        return {
            [Symbol.asyncIterator]() {
                return this;
            },
            next: async () => {
                const index = this.queue.findIndex((job) => !this.halted[(job as any).thread]);

                const [value] = index === -1 ? [this.noop] : this.queue.splice(index, 1);

                const { thread } = value as any;

                if (thread) this.threads[thread as keyof Threads].shift();

                try {
                    return { done: false, value };
                } finally {
                    if (value === this.noop) await new Promise((res) => setTimeout(res, this.delay));
                }
            },
            return: async () => {
                if (this.terminate) return { done: true, value: null as never };

                throw new Error("JobQueue#all iterator was not supposed to end.");
            },
            throw: async () => {
                // catch intentional throws next

                throw new Error("JobQueue#all iterator was not supposed to throw.");
            },
        };
    }

    public async start(thread?: keyof Threads) {
        if (typeof thread !== "undefined") {
            if (!this.halted[thread]) throw new Error(`JobQueue thread '${String(thread)}' is already running.`);

            this.halted[thread] = false;
        } else {
            if (this.running) throw new Error("JobQueue is already running.");

            this.running = true;

            for await (const job of this.generator()) {
                if (this.terminate) break;

                const { thread } = job as any;

                if (thread) {
                    if (!(thread in this.states)) throw new Error(`JobQueue state for thread '${String(thread)}' was not initialized.`);

                    const state = this.states[thread as keyof Threads];

                    const updated = await (job as unknown as ThreadJob<Threads>).call(null, this.thread(thread), state);

                    if (this.resetted) this.resetted = false;
                    else this.states[thread as keyof Threads] = json.clone(updated);
                } else {
                    await (job as unknown as MainJob<Threads>).call(null, this.thread(thread));
                }
            }

            this.terminate = false;

            this.running = false;
        }
    }

    public async stop(thread?: keyof Threads) {
        if (typeof thread !== "undefined") {
            if (this.halted[thread]) throw new Error(`JobQueue thread '${String(thread)}' is already paused.`);

            this.halted[thread] = true;
        } else this.terminate = true;

        //
        // if (typeof thread !== "undefined") {
        //     return (this.halted[thread] = true);
        // }

        // return (this.terminate = true);
    }

    public job(task: MainJob): this;
    public job<Thread extends keyof Threads, Context extends Threads[Thread][0] = Threads[Thread][0]>(thread: Thread, task: ThreadJob<Threads, Context>): this;
    public job(...args: [string, ThreadJob<any, any>] | [MainJob]): this {
        if (args.length === 1) {
            const [task] = args;

            Reflect.defineProperty(task, "thread", { value: undefined });

            this.queue.push(task);
        } else {
            const [thread, task] = args;

            Reflect.defineProperty(task, "thread", { value: thread });

            this.threads[thread as keyof Threads] = (this.threads[thread as keyof Threads] ?? []).concat(task);

            this.queue.push(task);
        }

        return this;
    }

    public init<Thread extends keyof Threads, Context extends Threads[Thread]>(thread: Thread, context: Context[0]) {
        if (thread in this.states) throw new Error(`JobQueue state for thread '${String(thread)}' already initialized.`);

        if (!json.serializable(context)) throw new Error(`JobQueue thread state can only be JSON-serializable data.`);

        this.states[thread] = json.clone(context);

        this.originals[thread] = json.clone(context);

        return this;
    }

    public reset(...threads: (keyof Threads)[]) {
        if (threads.length) {
            for (const thread of threads) this.states[thread] = json.clone(this.originals[thread]);
        } else {
            for (const thread in this.states) {
                this.states[thread] = json.clone(this.originals[thread]);
            }
        }

        this.resetted = true;
    }

    public query(thread: keyof Threads) {
        return this.halted[thread];
    }

    public get active() {
        return this.running;
    }
}

/**
 * make a builder api because this shit is verbose af
 *
 * new JobQueue<{
 *     thread_name: [threadStateType, messageDataType];
 *     ...
 * }>
 */

const q = new JobQueue<{
    side: [{ state: number }, never];
}>(100);

q.init("side", { state: 0 });

setInterval(() => {
    if (q.active)
        q.job("side", async (_, ctx) => {
            // pass process object with methods to do stuff
            ctx.state++;

            console.log(ctx);

            if (ctx.state >= 3) {
                q.stop(); // api to only start and stop a specific thread

                q.reset();

                setTimeout(() => q.start(), 2000);
            }

            return ctx;
        });
}, 1000);

q.start();
