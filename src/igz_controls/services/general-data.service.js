(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .factory('GeneralDataService', GeneralDataService);

    function GeneralDataService($interval, $q, Restangular, lodash) {
        var PAGE_SIZE_MAX = 200;

        return {
            fetchAllPages: fetchAllPages,
            getErrorMessage: getErrorMessage,
            isDisconnectionError: isDisconnectionError,
            poll: poll,
            pruneObject: pruneObject,
            trackDeletion: trackDeletion
        };

        //
        // Public methods
        //

        /**
         * Fetches all pages (in terms of pagination) of a collection of resources in back-end.
         * @param {string} collection - the collection name.
         * @param {Object} [parameters] - custom parameters to use when fetching a age (sort, filter, fields, include)
         *     pagination parameters.
         * @param {number} [startOnPage=0] - the page number from which to start, defaults to 0 (first page).
         * @param {Array.<Object>} [accumulator=[]] - accumulates the fetched version items to this array.
         * @returns {Promise} an array of clusters versions for a single page (in terms of pagination).
         */
        function fetchAllPages(collection, parameters, startOnPage, accumulator) {
            var items = lodash.defaultTo(accumulator, []);
            var pageNumber = lodash.defaultTo(startOnPage, 0);
            var paginationParams = {
                'page[number]': pageNumber,
                'page[size]': PAGE_SIZE_MAX
            };
            var requestParams = lodash.chain(parameters)
                .clone()                  // copy provided parameters
                .assign(paginationParams) // append/override page size and page number parameters
                .omit('page[of]')         // omit page[of] parameter
                .value();

            return Restangular.all(collection).getList(requestParams).then(function (newItems) {

                // check if last page was fetched
                var done = newItems['total_pages'] === pageNumber + 1;

                // accumulate items from last fetch to accumulator
                Array.prototype.push.apply(items, newItems);

                // if done - return accumulated list of items, otherwise - fetch next page
                return done ? items : fetchAllPages(collection, parameters, pageNumber + 1, items);
            });
        }

        /**
         * Fetches the appropriate error message from `errorMessages` according to either `error`'s `status` code alone,
         * or in combination with a substring that exists in `error`'s `detail`.
         * @param {{data: Object, status: string|number}} error - The error object from back-end.
         * @param {Object} errorMessages - A map between an HTTP response status code and the appropriate error message
         *     to return in that case. The value could be either a string, or an object. If it is an object, each of its
         *     keys will be partially-matched as a substring to `error.detail`. If a match is found, its corresponding
         *     value will be returned.
         * @returns {string|undefined} the appropriate error message from `errorMessages` according to the `error`.
         * @example
         * var errorMessages = {
         *     400: 'Oops: the request is malformed.',
         *     403: {
         *         'deleted': 'You have no permissions to delete the resource.',
         *         'edited': 'You have no permissions to edit the resource.',
         *         default: 'You have no permissions.'
         *     }
         *     default: 'Unknown error occurred.'
         * };
         *
         * var error400 = {
         *     status: 400,
         *     detail: 'Bad Request'
         * };
         * var error403delete = {
         *     status: 403,
         *     detail: 'Resource cannot be deleted'
         * };
         * var error403edit = {
         *     status: 403,
         *     detail: 'Resource cannot be edited'
         * };
         * var error403created = {
         *     status: 403,
         *     detail: 'Resource cannot be created'
         * };
         * var error500 = {
         *     status: 500,
         *     detail: 'Request timed-out'
         * };
         *
         * getErrorMessage(errorMessages, error400);
         * // => 'Oops: the request is malformed'
         *
         * getErrorMessage(errorMessages, error403delete);
         * // => 'You have no permissions to delete the resource'
         *
         * getErrorMessage(errorMessages, error403edit);
         * // => 'You have no permissions to edit the resource'
         *
         * getErrorMessage(errorMessages, error403created);
         * // => 'You have no permissions.'
         *
         * getErrorMessage(errorMessages, error500);
         * // => 'Unknown error occurred.'
         *
         * @example
         * // no `default` property
         * var errorMessages = {
         *     400: 'bla bla bla',
         *     403: {}
         * };
         *
         * getErrorMessage(errorMessages, { status: 400, detail: 'foo bar baz' });
         * // => 'foo bar baz'
         *
         * getErrorMessage(errorMessages, { status: 500, detail: 'foo bar baz' });
         * // => undefined
         *
         * getErrorMessage(errorMessages, { status: 403, detail: 'foo bar baz' });
         * // => undefined
         */
        function getErrorMessage(errorMessages, error) {
            var errorData = lodash.get(error, 'data.errors[0]', error);
            var messages  = lodash.cloneDeep(errorMessages);
            var status    = lodash.get(errorData, 'status');
            var detail    = lodash.get(errorData, 'detail');
            var result    = messages[status];

            if (lodash.isObject(result)) {
                lodash.assign(messages, result);

                result = lodash.find(result, function (value, key) {
                    return lodash.includes(detail, key);
                });
            }

            return lodash.defaultTo(result, messages.default);
        }

        /**
         * Checks if the error status is equal '-1'. It means, that server is unreachable.
         * @param {number} errorStatus - Error status code.
         * @returns {Boolean} if true - server is unreachable
         */
        function isDisconnectionError(errorStatus) {
            return errorStatus === -1;
        }

        /**
         * Polls by calling `pollMethod` and then invoking `isDone` method with `pollMethod`'s result. Stops polling
         * when `isDone` returned `true`. Keeps on polling as long as `isDone` returns `false`.
         * @param {function} pollMethod - the method to invoke for a single polling cycle.
         * @param {function} isDone - the method to invoke with the result of `pollMethod` (in case it is successful).
         *     It should return `true` to indicate the polling should stop or `false` to indicate the polling should
         *     continue.
         * @param {Object} [options] - various options for configuring the polling process.
         * @param {number} [options.delay=2000] - the delay in milli-seconds between polling cycles.
         * @param {function} [options.isDoneFail] - will be invoked with the error of `pollMethod` in case it failed.
         *     If it returns `true` then the polling stops.
         * @param {number} [options.maxRetries=10] - the maximum number of failed polling cycles. When it is exceeded
         *     then a rejected promise is returned with an error message. Note: this parameter is relevant to _failed_
         *     polling cycles. Successful polling cycles could go on forever.
         * @param {number} [options.timeoutMillis] - If provided, polling will time out after this number of
         *     milliseconds.
         * @param {Promise} [options.timeoutPromise] - if provided, the request is cancelled on resolving this promise.
         * @returns {Promise} a promise that is resolved with the result of last polling cycle (when polling is done),
         *     or rejected with an error in case the request for polling failed at least `maxRetries` times or polling
         *     was aborted by resolving `options.timeoutPromise`, or polling timed out after `options.timeoutMillis`
         *     milli-seconds.
         */
        function poll(pollMethod, isDone, options) {
            var deferred = $q.defer();
            var iterationInterval = null;
            var overallInterval = null;
            var terminated = false;

            var config = lodash.chain(options)
                .clone()
                .omitBy(lodash.overSome(lodash.isNil, lodash.isNaN)) // omit undefined, null and NaN values
                .defaults({
                    delay: 2000,
                    maxRetries: 10,
                    timeoutMillis: NaN,
                    isDoneFail: lodash.constant(false),
                    timeoutPromise: {
                        then: angular.noop
                    }
                })
                .value();

            var pollingAbortedError = new Error('polling aborted');
            var pollingTimedOutError = new Error('polling timed out');
            var maxRetriesExceededError = new Error('Max retries exceeded (' + config.maxRetries + ')');

            // when `config.timeoutMillis` is a positive finite number - terminate polling process after this number of milliseconds
            if (lodash.isFinite(config.timeoutMillis) && config.timeoutMillis > 0) {
                overallInterval = $interval(function () {
                    terminatePolling(pollingTimedOutError);
                }, config.timeoutMillis, 1);
            }

            // when `config.timeoutPromise` is a promise - terminate polling process when it is resolved
            if (lodash.isObject(config.timeoutPromise) && lodash.isFunction(config.timeoutPromise.then)) {
                config.timeoutPromise.then(function () {
                    terminatePolling(pollingAbortedError);
                });
            }

            pollOnce();
            return deferred.promise;


            /**
             * Terminates polling process and rejects the returned promise with an appropriate error.
             * Cancels all pending intervals set by this method.
             * @param {Error} error - used as the rejection reason of the returned promise.
             */
            function terminatePolling(error) {
                terminated = true;
                deferred.reject(error);
                if (iterationInterval !== null) {
                    $interval.cancel(iterationInterval);
                    iterationInterval = null;
                }
                if (overallInterval !== null) {
                    $interval.cancel(overallInterval);
                    overallInterval = null;
                }
            }

            /**
             * Polls by calling `pollMethod` and then invoking `isDone` method with `pollMethod`'s result.
             * Stops polling in case `isDone` returns `true`.
             * Schedules next poll in case `isDone` returns `false`.
             */
            function pollOnce() {
                pollMethod()
                    .then(function (result) {
                        if (isDone(result)) {
                            deferred.resolve(result);
                        } else {
                            pollAgain();
                        }
                    })
                    .catch(function (error) {
                        if (config.isDoneFail(error)) {
                            deferred.resolve(error);
                        } else {
                            config.maxRetries -= 1;
                            if (config.maxRetries > 0) {
                                pollAgain();
                            } else {
                                deferred.reject(maxRetriesExceededError);
                            }
                        }
                    });
            }

            /**
             * Schedules next poll cycle after `delay` milli-seconds.
             */
            function pollAgain() {
                if (!terminated) {

                    // `$interval` is used instead of simply using `$timeout(poll, config.delay);`, because repeating
                    // timeouts make e2e automated tests hang (Protractor). using `$interval` does not make it hang.
                    // The 3rd optional `count` argument of `$interval` is used to limit it to only one single
                    // repetition, to resemble a simple `$timeout`.
                    iterationInterval = $interval(function () {
                        iterationInterval = null;
                        pollOnce();
                    }, config.delay, 1);
                }
            }
        }

        /**
         * Removes empty properties from `obj` recursive. The values that will be removed: '' , {}, [].
         * This method mutates passed parameter `obj`.
         * @param {Object} obj - the object to prune
         */
        function pruneObject(obj) {
            lodash.forEach(obj, function (value, key) {
                if (lodash.isObject(value) && !lodash.isEmpty(value)) {
                    pruneObject(value);
                }

                if (!lodash.isBoolean(value) && !lodash.isNumber(value) && lodash.isEmpty(value)) {
                    lodash.unset(obj, key);
                }
            });
        }

        /**
         * Tracks a deletion process of a resource until it is either deleted successfully or failed to be deleted.
         * @param {function} getResourceStatus - a method that should return a promise resolving to the current status
         *     of the resource.
         * @param {Promise} [timeoutPromise] - if provided, the tracking is cancelled on resolving this promise.
         * @returns {Promise} a promise resolved with the string 'successfully deleted' if invoking `getResourceStatus`
         *     gets rejected with "404 Not Found", or rejected with the resource itself in case it failed to be deleted.
         *     if polling is aborted or its max retries are exceeded then this promise will be rejected with the
         *     relevant `Error` object (either max retries number exceeded or polling was aborted).
         */
        function trackDeletion(getResourceStatus, timeoutPromise) {
            return poll(getResourceStatus, isDone, {
                isDoneFail: isDoneFail,
                timeoutPromise: timeoutPromise
            })
                .then(function (result) {

                    // if returned successful because a resource was received - it means deletion failed
                    // otherwise, it means deletion was succeeded
                    return isDoneFail(result) ? 'successfully deleted' : $q.reject(result);
                });

            /**
             * Determines whether polling should stop in case resource status got successfully.
             * @param {{attributes: {operational_status: string}}} resource - the resource
             * @returns {boolean} `true` if polling should stop, or `false` otherwise
             */
            function isDone(resource) {

                // polling is done if resource is no longer in deleting status (meaning deletion of resource failed)
                return lodash.get(resource, 'attr.operational_status') !== 'deleting';
            }

            /**
             * Determines whether polling should stop in case of an error on getting the resource status.
             * @param {Object} error - the error
             * @param {number} [error.status] - the HTTP status code of the error
             * @returns {boolean} `true` if polling should stop, or `false` otherwise
             */
            function isDoneFail(error) {

                // polling is done if "404 Not Found" response was received (meaning deletion of resource succeeded)
                return lodash.isMatch(error, {
                    status: 404,
                    xhrStatus: 'complete' // skip cases when no response is received (request aborted, timed out, etc.)
                });
            }
        }
    }
}());
