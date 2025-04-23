export class Timer {
    constructor() { }
    static async wait(milliseconds) {
        return new Promise((resolve) => {
            if (isNaN(milliseconds) || milliseconds < 0) {
                throw new Error('milliseconds must be a finite, non-negative number');
            }
            setTimeout(() => resolve('done!'), milliseconds);
        });
    }
}
