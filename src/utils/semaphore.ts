export class Semaphore {
  private count: number;
  private queue: Array<() => void> = [];

  constructor(count: number) {
    this.count = count;
  }

  async acquire(): Promise<void> {
    if (this.count > 0) {
      this.count--;
      return;
    }
    return new Promise(resolve => this.queue.push(resolve));
  }

  release(): void {
    if (this.queue.length > 0) {
      this.queue.shift()!();
    } else {
      this.count++;
    }
  }

  wrap<T>(fn: () => Promise<T>): Promise<T> {
    return this.acquire().then(() => fn().finally(() => this.release()));
  }
}
