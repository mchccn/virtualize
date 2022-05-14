type Job = () => Promise<any>;

type ThreadJob<Context = any> = (ctx: Context) => Promise<Context>;

type WrapIntoThreads<Types> = {
    [K in keyof Types]: ThreadJob<Types[K]>;
};

class JobQueue<Threads extends Record<string, unknown> = Record<string, unknown>> {
    private running = false;

    private terminate = false;

    private readonly noop = async () => {};

    private threads = {} as WrapIntoThreads<Threads>;

    public constructor(private readonly delay: number) {}

    private queue: (Job | ThreadJob)[] = [];

    private generator(): AsyncGenerator<Job | ThreadJob, never, undefined> {
        return {
            [Symbol.asyncIterator]() {
                return this;
            },
            next: async () => {
                const value = this.queue.shift() ?? this.noop;

                try {
                    return { done: false, value };
                } finally {
                    if (value === this.noop) await new Promise((res) => setTimeout(res, this.delay));
                }
            },
            return: () => {
                throw new Error("JobQueue#all iterator was not supposed to end.");
            },
            throw: () => {
                throw new Error("JobQueue#all iterator was not supposed to throw.");
            },
        };
    }

    public async start() {
        if (this.running) throw new Error("JobQueue is already running.");

        this.running = true;

        for await (const job of this.generator()) {
            if (this.terminate) break;

            // do the thing
        }

        this.terminate = false;

        this.running = false;
    }

    public async stop() {
        this.terminate = true;
    }

    public job(task: Job): this;
    public job(thread: string, task: ThreadJob): this;
    public job(...args: [string, ThreadJob] | [Job]): this {
        if (args.length === 1) {
            const [task] = args;

            this.queue.push(task);
        } else {
            const [thread, task] = args;
        }

        return this;
    }
}

const q = new JobQueue(100);

setInterval(() => {
    q.job(async () => {
        console.log("task executed");
    });
}, 1000);

q.start();

setInterval(() => {
    console.log("normal execution");
}, 1337);
