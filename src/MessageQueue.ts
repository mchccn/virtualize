import type { WrapIntoQueue } from "./wrappers";

export class MessageQueue<Messages extends Record<string, unknown> = Record<string, unknown>> {
    private map = {} as WrapIntoQueue<Messages>;

    public send<Target extends keyof Messages>(from: keyof Messages, target: keyof Messages, data: Messages[Target]) {
        this.map[target] ??= [];

        this.map[target].push({ from, data } as WrapIntoQueue<Messages>[Target][number]);
    }

    public receive<Target extends keyof Messages>(
        target: keyof Messages
    ): WrapIntoQueue<Messages>[Target][number] | undefined {
        const queue = this.map[target];

        if (!queue) return;

        const data = queue.shift();

        if (!queue.length) delete this.map[target];

        return data as WrapIntoQueue<Messages>[Target][number];
    }
}
