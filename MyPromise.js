const STATE = {
  Pending: "pending",
  Fulfilled: "fullfilled",
  Rejected: "rejected",
};

class MyPromise {
  #cbs = [];
  #value;
  #state = STATE.Pending;
  #onResolveBind = this.#onResolve.bind(this);
  #onRejectBind = this.#onReject.bind(this);

  constructor(cb) {
    try {
      cb(this.#onResolveBind, this.#onRejectBind);
    } catch (e) {
      this.#onRejectBind(e);
    }
  }

  #runCallbacks() {
    queueMicrotask(() => {
      if (this.#state === STATE.Pending) return;

      const type =
        this.#state === STATE.Fulfilled ? "onFullfilled" : "onRejected";

      this.#cbs.forEach((cb) => {
        try {
          const settled = cb[type](this.#value);
          if (settled instanceof MyPromise) {
            settled.then(cb.res, cb.rej);
          } else {
            cb.res(settled);
          }
        } catch (error) {
          cb.rej(error);
        }
      });
      this.#cbs = [];
    });
  }

  #onResolve(value) {
    if (this.#state !== STATE.Pending) return;

    this.#value = value;
    this.#state = STATE.Fulfilled;
    this.#runCallbacks();
  }

  #onReject(value) {
    if (this.#state !== STATE.Pending) return;

    this.#value = value;
    this.#state = STATE.Rejected;
    this.#runCallbacks();
  }

  then(onFullfilled, onRejected) {
    return new MyPromise((res, rej) => {



      this.#cbs.push({
        onFullfilled: onFullfilled ?? ((val) => val),
        onRejected:
          onRejected ??
          ((err) => {
            throw err;
          }),
        res,
        rej,
      });

      this.#runCallbacks();
    });
  }

  catch(onRejected) {
    return this.then(undefined, onRejected);
  }

  finally() {}

  static resolve(value) {
    return new MyPromise((res) => {
      res(value);
    });
  }

  static reject(error) {
    return new MyPromise((_, rej) => {
      rej(error);
    });
  }
}

// const promise = new MyPromise((res) => res(1));

// promise.then(v => {}).then(v => {})

// promise.then(v => {})
// // console.log(promise);
// // setTimeout(() => {
// //   console.log("test");
// //   promise.then((v) => console.log(v));
// // }, 1000);

module.exports = MyPromise;
