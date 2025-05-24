/**
 * 戻り値のIDがclearInterval()によって削除されるまで
 * ., .., ...を繰り返しターミナルに表示するロードスピナー
 * usage:
 *  const spinner = new Spinner([".", "..", "..."], 100);
 *  spinner.start();
 *  // processing...
 *  // show spinner ., .., ...
 *  spinner.stop();
 * @throw Texts array must not be empty
 * @throw Interval must be a positive number
 * @throw timeout must be a positive number
 */
export class Spinner {
  private timer: number | undefined;
  private intervalId: number | undefined;

  constructor(
    private readonly texts: string[],
    private readonly interval: number,
    private readonly timeout: number,
  ) {
    if (texts.length < 1) {
      throw new Error("Texts array must not be empty");
    }
    if (interval < 0) {
      throw new Error("Interval must be a positive number");
    }
    if (timeout < 0) {
      throw new Error("Timeout must be a positive number");
    }
  }

  /**
   * @throw timer error
   */
  start(): void {
    let i = 0;
    const printSpinner = () => {
      i = ++i % this.texts.length;
      Deno.stderr.writeSync(new TextEncoder().encode("\r" + this.texts[i]));
    };

    printSpinner();
    this.intervalId = setInterval(printSpinner, this.interval);

    this.timer = setTimeout(() => {
      this.stop();
      throw new Error("timer error");
    }, this.timeout);
  }

  stop(): void {
    if (this.intervalId !== undefined) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    if (this.timer !== undefined) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
    Deno.stderr.writeSync(new TextEncoder().encode("\r"));
  }
}
