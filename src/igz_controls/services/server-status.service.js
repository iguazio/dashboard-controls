(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .factory('ServerStatusService', ServerStatusService);

    function ServerStatusService($http, $q, $i18next, i18next, lodash, ConfigService, DialogsService) {
        var dialogPromise = null;
        var errors = [];

        return {
            resolveInterceptor: resolveInterceptor,
            rejectInterceptor: rejectInterceptor
        };

        //
        // Public methods
        //

        /**
         * Removes error from errors list if server becomes reachable
         * @param {Object} response - backend response object
         * @returns {Promise} returns promise
         */
        function resolveInterceptor(response) {
            if (response && response.status && response.status !== -1) {
                if (errors.length > 0) {
                    errors = errors.filter(function (err) {
                        return err.method !== response.config.method && err.url !== response.config.url;
                    });
                }

                return $q.resolve(response);
            }
        }

        /**
         * Adds request to errors list if it`s failed and pops a modal if server isn`t reachable more than 60sec
         * @param {Object} rejectionResponse - backend response object
         * @returns {Promise} returns promise
         */
        function rejectInterceptor(rejectionResponse) {
            const currentError = {
                method: rejectionResponse.config.method,
                url: rejectionResponse.config.url
            };

            if (rejectionResponse.status === -1 && rejectionResponse.xhrStatus === 'error') {
                const existingFailedResponse = errors.find(function (err) {
                    return err.method === rejectionResponse.config.method && err.url === rejectionResponse.config.url;
                });

                if (existingFailedResponse) {
                    const dateNow = new Date();
                    const timeFromFirstFailure = (dateNow.getTime() - existingFailedResponse.date.getTime());

                    if (timeFromFirstFailure >= 300000) {
                        return showAlert()
                            .then(function () {
                                location.reload();
                            });
                    }
                } else {
                    currentError.date = new Date();
                    errors.push(currentError);
                }
            }

            return $q.reject(rejectionResponse);
        }

        /**
         * Pops a modal with an error message and makes sure there's only one open.
         * When the modal is resolved, all pending flows that awaited it will continue.
         * @returns {Promise} resolved when modal is closed ("Refresh" button is clicked)
         */
        function showAlert() {
            var lng = i18next.language;

            if (lodash.isNull(dialogPromise)) {
                dialogPromise = DialogsService.oopsAlert($i18next.t('common:SERVER_UNREACHABLE_ALERT', {lng: lng}),
                                                         $i18next.t('common:REFRESH', {lng: lng}))
                    .then(function () {
                        dialogPromise = null;
                    });
            }

            return dialogPromise;
        }
    }
}());
