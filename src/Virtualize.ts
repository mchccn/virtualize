import { JobQueueBuilder } from "./JobQueueBuilder";

export class Virtualize {
    public static queue() {
        return new JobQueueBuilder();
    }
}
