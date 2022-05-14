import type { JobQueue } from "./JobQueue";
import type { ThreadsData } from "./jobs";

// ! do this shit later cuz i have no idea how
export class Mutex<Resource, Threads extends ThreadsData = ThreadsData> {
    private queue: (keyof Threads | symbol)[] = [];

    public constructor(private jobq: JobQueue<Threads>, private resource: Resource) {}
}
