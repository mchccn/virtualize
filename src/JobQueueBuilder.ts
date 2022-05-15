import { JobQueue } from "./JobQueue";
import type { ThreadsData } from "./jobs";

export class JobQueueBuilder<Threads extends ThreadsData = {}> {
    private map = new Map<string, ThreadsData[string]>();

    public define<Thread extends string, State, Message>(
        thread: Thread,
        state: State,
        message: Message
    ): JobQueueBuilder<
        Threads & {
            [_ in Thread]: [State, Message];
        }
    > {
        this.map.set(thread, [state, message]);

        return this as JobQueueBuilder<any>;
    }

    public finalize(delay: number) {
        const q = new JobQueue<Threads>(delay);

        this.map.forEach(([state], thread) => {
            q.init(thread, state);
        });

        return q;
    }
}
