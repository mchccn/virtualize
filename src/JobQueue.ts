import * as json from "./json";

type Job = () => Promise<any>;

type ThreadJob<Context = any> = (ctx: Context) => Promise<Context>;

type WrapIntoThreads<Types> = {
    [K in keyof Types]: ThreadJob<Types[K]>[];
};

class JobQueue<Threads extends Record<string, unknown> = Record<string, unknown>> {
    private running = false;

    private terminate = false;

    private resetted = false;

    private readonly noop = async () => {};

    private threads = {} as WrapIntoThreads<Threads>;

    private originals = {} as Threads;

    private states = {} as Threads;

    public constructor(private readonly delay: number) {}

    private queue: (Job | ThreadJob)[] = [];

    private generator(): AsyncGenerator<Job | ThreadJob, never, undefined> {
        return {
            [Symbol.asyncIterator]() {
                return this;
            },
            next: async () => {
                const value = this.queue.shift() ?? this.noop;

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

    public async start() {
        if (this.running) throw new Error("JobQueue is already running.");

        this.running = true;

        for await (const job of this.generator()) {
            if (this.terminate) break;

            const { thread } = job as any;

            if (thread) {
                if (!(thread in this.states)) throw new Error(`JobQueue state for thread '${thread}' was not initialized.`);

                const state = this.states[thread as keyof Threads];

                const updated = await job.call(null, state);

                if (this.resetted) this.resetted = false;
                else this.states[thread as keyof Threads] = updated;
            } else {
                await job.call(null, undefined);
            }
        }

        this.terminate = false;

        this.running = false;
    }

    public async stop() {
        this.terminate = true;
    }

    public job(task: Job): this;
    public job<Thread extends keyof Threads, Context = Threads[Thread]>(thread: Thread, task: ThreadJob<Context>): this;
    public job(...args: [string, ThreadJob] | [Job]): this {
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

    public init<Thread extends keyof Threads, Context extends Threads[Thread]>(thread: Thread, context: Context) {
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

    public get active() {
        return this.running;
    }
}

const q = new JobQueue<{
    side: { state: number };
}>(100);

q.init("side", { state: 0 });

setInterval(() => {
    if (q.active)
        // q.query("side") to query status of thread
        q.job("side", async (ctx) => {
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
