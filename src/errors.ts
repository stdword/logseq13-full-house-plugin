export class BaseError extends Error {
    args: object

    constructor(msg: string, args: object = {}) {
        super(msg)
        this.args = args

        Object.setPrototypeOf(this, BaseError.prototype);
    }
}

export class StateError extends BaseError {
    constructor(msg: string, args: object = {}) {
        super(msg, args)
        Object.setPrototypeOf(this, StateError.prototype);
    }
}

export class StateMessage extends BaseError {
    constructor(msg: string, args: object = {}) {
        super(msg, args)
        Object.setPrototypeOf(this, StateMessage.prototype);
    }
}

export class RenderError extends BaseError {
    constructor(msg: string, args: object = {}) {
        super(msg, args)
        Object.setPrototypeOf(this, RenderError.prototype);
    }
}
