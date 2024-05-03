/** 戻り値のIDがclearInterval()によって削除されるまで
 * ., .., ...を繰り返しターミナルに表示するロードスピナー
 * usage:
 *  const spinner = new Spinner([".", "..", "..."], 100);
 *  const spinnerID = spinner.start();
 *  // processing...
 *  spinner.stop(spinnerID);
 */
export class Spinner {
  private timeout: number | undefined;
  private intervalId: number | undefined;

  constructor(
    private readonly texts: string[],
    private readonly interval: number,
    private readonly timeup: number,
  ) {
  }

  start(): void {
    let i = 0;
    const printSpinner = () => {
      i = ++i % this.texts.length;
      Deno.stderr.writeSync(new TextEncoder().encode("\r" + this.texts[i]));
    };

    printSpinner();
    this.intervalId = setInterval(printSpinner, this.interval);

    this.timeout = setTimeout(() => {
      this.stop();
      throw new Error("Timeout error");
    }, this.timeup);
  }

  stop(): void {
    if (this.intervalId !== undefined) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    if (this.timeout !== undefined) {
      clearTimeout(this.timeout);
      this.timeout = undefined;
    }
    Deno.stderr.writeSync(new TextEncoder().encode("\r"));
  }
}
