const STATE = {
  Pending: "pending",
  Fulfilled: "fulfilled",
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
        this.#state === STATE.Fulfilled ? "onFulfilled" : "onRejected";

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

  finally(cb) {
    return this.then(
      (result) => {
        cb();
        return result;
      },
      (error) => {
        cb();
        return error;
      }
    );
  }

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

  static all(promises) {
    const results = [];
    let count = 0;
    return new MyPromise((resolve, reject) => {
      for (let i = 0; i < promises.length; i++) {
        promises[i]
          .then((value) => {
            count++;
            results[i] = value;
            if (promises.length === count) {
              resolve(results);
            }
          })
          .catch(reject);
      }
    });
  }

  static allSettled(promises) {
    const results = [];
    let count = 0;
    return new MyPromise((resolve) => {
      for (let i = 0; i < promises.length; i++) {
        promises[i]
          .then((value) => {
            results[i] = { status: STATE.Fulfilled, value };
          })
          .catch((error) => {
            results[i] = { status: STATE.Rejected, reason: error };
          })
          .finally(() => {
            count++;
            if (count === promises.length) {
              resolve(results);
            }
          });
      }
    });
  }

  static race(promises) {
    return new MyPromise((resolve, reject) => {
      for (let promise of promises) {
        promise.then(resolve).catch(reject);
      }
    });
  }

  static any(promises) {
    const results = [];
    let count = 0;
    return new MyPromise((resolve, reject) => {
      for (let i = 0; i < promises.length; i++) {
        promises[i].then(resolve).catch((error) => {
          count++;
          results[i] = error;
          if (promises.length === count) {
            reject(results);
          }
        });
      }
    });
  }
}


module.exports = MyPromise;
