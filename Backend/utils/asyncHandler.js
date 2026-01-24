const asyncHandler = (requesHandler) => {
    return async (req, res, next) => {
        Promise.resolve(requesHandler(req, res, next)).catch((error) => next(error));
    }
}

export { asyncHandler };