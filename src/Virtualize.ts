import type { JobQueue } from "./JobQueue";
import { JobQueueBuilder } from "./JobQueueBuilder";

export class Virtualize {
    private static canceled = new Map<symbol, boolean>();

    public static queue() {
        return new JobQueueBuilder();
    }

    public static timeout(jobq: JobQueue<any>, callback: () => void, delay: number) {
        const id = Symbol();

        (async () => {
            await new Promise((resolve) => setTimeout(resolve, delay));

            if (!this.canceled.get(id)) jobq.job(async () => callback());
        })();

        return id;
    }

    public static interval(jobq: JobQueue<any>, callback: () => void, delay: number) {
        const id = Symbol();

        (async () => {
            while (true) {
                await new Promise((resolve) => setTimeout(resolve, delay));

                if (this.canceled.get(id)) break;

                jobq.job(async () => callback());
            }
        })();

        return id;
    }

    public static cancel(job: symbol) {
        this.canceled.set(job, true);
    }
}
