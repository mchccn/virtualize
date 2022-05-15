// ! do this shit later cuz i have no idea how
export class Mutex<Resource> {
    private queue: Promise<void>[] = [];

    public constructor(private resource: Resource) {}

    public async request() {
        for await (const _ of this.queue);

        let done = () => null! as void;

        let finished = false;

        this.queue.push(
            new Promise((resolve) => {
                done = resolve;
            })
        );

        const relenquish = async () => {
            if (
                ["string", "number", "boolean"].includes(typeof wrapped.$) ||
                typeof wrapped.$ === "bigint" ||
                typeof wrapped.$ === "symbol" ||
                wrapped.$ === undefined ||
                wrapped.$ === null
            )
                this.resource = wrapped.$;

            done();

            finished = true;
        };

        const wrapped = { $: this.resource };

        const resource = () => {
            if (finished) throw new Error(`Mutex cannot use resource after control was released.`);

            return wrapped;
        };

        return [relenquish, resource] as const;
    }
}
