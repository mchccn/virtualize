# @kelsny/virtualize

> Fuck single-threaded JavaScript: virtualize the event loop.

**Includes:**

-   `/`

    -   [ ] builder api to make creating a jobq not a pita

-   `JobQueue` - delegates tasks to virtual threads easily

    -   [x] jobq main thread name symbol
    -   [x] jobq clone new state before passing it
    -   [x] jobq start/stop individual threads
    -   [x] jobq query status of thread
    -   [x] jobq message queue between threads
    -   [ ] jobq cancel job
    -   [ ] jobq mutex lock/unlock
    -   [ ] jobq plugin system (superjson)

-   `Virtualized`

    -   [ ] virtualized setInterval and setTimeout
