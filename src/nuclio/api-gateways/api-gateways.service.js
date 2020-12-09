(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .factory('ApiGatewaysService', ApiGatewaysService);

    function ApiGatewaysService($i18next, i18next, lodash, ConfigService, ElementLoadingStatusService) {
        var lng = i18next.language;
        var authModes = [
            {
                id: 'none',
                name: $i18next.t('common:NONE', { lng: lng })
            },
            {
                id: 'basicAuth',
                name: $i18next.t('functions:BASIC', { lng: lng })
            },
            {
                id: 'accessKey',
                name: $i18next.t('functions:ACCESS_KEY', { lng: lng }),
                tooltip: $i18next.t('functions:ACCESS_KEY', { lng: lng })
            },
            {
                id: 'oauth2',
                name: $i18next.t('functions:OAUTH2', { lng: lng }),
                tooltip: $i18next.t('functions:OAUTH2', { lng: lng })
            }
        ];

        var self = {
            buildEndpoint: buildEndpoint,
            buildIngressHost: buildIngressHost,
            getAuthModes: getAuthModes,
            getCanary: getCanary,
            getCanaryName: getCanaryName,
            getCanaryPercentage: getCanaryPercentage,
            getPrimary: getPrimary,
            getPrimaryName: getPrimaryName,
            hideStatusSpinner: hideStatusSpinner,
            initApiGatewayActions: initApiGatewayActions,
            isSteadyState: isSteadyState,
            isTransientState: isTransientState,
            showStatusSpinner: showStatusSpinner
        };

        return self;

        //
        // Public methods
        //

        /**
         * Builds endpoint of `apiGateway`.
         * @param {Object} apiGateway - the API gateway.
         */
        function buildEndpoint(apiGateway) {
            var spec = lodash.get(apiGateway, 'spec', {});
            if (lodash.isNonEmpty(spec.host)) {
                var endpoint = spec.host + (lodash.isEmpty(spec.path) ? '' : '/' + lodash.trimStart(spec.path, '/'));
                lodash.set(apiGateway, 'ui.endpoint', endpoint);
            }
        }

        /**
         * Builds ingress host and endpoint of `apiGateway` in `project`.
         * @param {Object} apiGateway - the API gateway.
         * @param {Object} project - the project.
         */
        function buildIngressHost(apiGateway, project) {
            var ingressHostTemplate = lodash.get(ConfigService, 'nuclio.ingressHostTemplate', '');

            if (!lodash.isEmpty(ingressHostTemplate)) {
                var namespace = lodash.get(ConfigService, 'nuclio.namespace', '');
                var name = lodash.get(apiGateway, 'spec.name', '');
                var projectName = lodash.get(project, 'metadata.name', '');

                var host = lodash.trimEnd(
                    ingressHostTemplate
                        .replace(/{{\s\.ResourceName\s}}/, name)
                        .replace(/{{\s\.ProjectName\s}}/, projectName)
                        .replace(/{{\s\.Namespace\s}}/, namespace),
                    '/'
                );

                lodash.set(apiGateway, 'spec.host', host);
            }

            self.buildEndpoint(apiGateway);
        }

        /**
         * Returns the available authentication modes.
         * @returns {Array.<Object>} the available authentication modes.
         */
        function getAuthModes() {
            return lodash.filter(authModes, function (mode) {
                return lodash.includes(ConfigService.nuclio.allowedAuthenticationModes, mode.id);
            });
        }

        /**
         * Gets the canary function upstream in the API gateway.
         * @param {Object} apiGateway - the API gateway.
         * @returns {Object} - the canary function upstream.
         */
        function getCanary(apiGateway) {
            return lodash.find(lodash.get(apiGateway, 'spec.upstreams', []), function (upstream) {
                return upstream.percentage > 0;
            });
        }

        /**
         * Gets the name of the canary function.
         * @param {Object} apiGateway - the API gateway.
         * @param {string} [defaultValue=''] - the value to return in case no canary function was found or name is
         *     missing.
         * @returns {string} - the name of the canary function.
         */
        function getCanaryName(apiGateway, defaultValue) {
            return lodash.get(self.getCanary(apiGateway), 'nucliofunction.name', lodash.defaultTo(defaultValue, ''));
        }

        /**
         * Gets the percentage of the canary function.
         * @param {Object} apiGateway - the API gateway.
         * @param {*} [defaultValue=NaN] - the value to return in case no canary function was found or name is
         *     missing.
         * @returns {string} - the percentage of the canary function.
         */
        function getCanaryPercentage(apiGateway, defaultValue) {
            return lodash.get(self.getCanary(apiGateway), 'percentage', lodash.defaultTo(defaultValue, NaN));
        }

        /**
         * Gets the primary function upstream in the API gateway.
         * @param {Object} apiGateway - the API gateway.
         * @returns {Object} - the primary function upstream.
         */
        function getPrimary(apiGateway) {
            return lodash.find(lodash.get(apiGateway, 'spec.upstreams', []), function (upstream) {
                return lodash.isUndefined(upstream.percentage) || upstream.percentage === 0;
            });
        }

        /**
         * Gets the name of the primary function.
         * @param {Object} apiGateway - the API Gateway.
         * @param {string} [defaultValue=''] - the value to return in case name is missing.
         * @returns {string} - the name of the primary function.
         */
        function getPrimaryName(apiGateway, defaultValue) {
            return lodash.get(self.getPrimary(apiGateway), 'nucliofunction.name', lodash.defaultTo(defaultValue, ''));
        }

        /**
         * Hides status loading spinner for each provided API gateway.
         * @param {Object|Array.<Object>} apiGateways - Either a single API gateway, or a list of API gateways.
         */
        function hideStatusSpinner(apiGateways) {
            lodash.forEach(lodash.castArray(apiGateways), function (apiGateway) {
                var apiGatewayName = lodash.get(apiGateway, 'spec.name');
                if (!lodash.isEmpty(apiGatewayName)) {
                    ElementLoadingStatusService.hideSpinner('api-gateway-status-' + apiGatewayName);
                }
            });
        }

        /**
         * API Gateway actions
         * @returns {Object[]} - array of actions
         */
        function initApiGatewayActions() {
            return [
                {
                    label: $i18next.t('common:DELETE', { lng: lng }),
                    id: 'delete',
                    icon: 'igz-icon-trash',
                    active: true,
                    confirm: {
                        message: $i18next.t('functions:DELETE_API_GATEWAY_CONFIRM', { lng: lng }),
                        yesLabel: $i18next.t('common:YES_DELETE', { lng: lng }),
                        noLabel: $i18next.t('common:CANCEL', { lng: lng }),
                        type: 'nuclio_alert'
                    }
                },
                {
                    label: $i18next.t('common:EDIT', { lng: lng }),
                    id: 'edit',
                    icon: 'igz-icon-edit',
                    active: true
                }
            ];
        }

        /**
         * Checks whether the API gateway is in a steady state, meaning "ready" or "error".
         * @param {Object} apiGateway - The API GW to check.
         * @returns {boolean} `true` in case the API GW is in steady state, or `false` otherwise.
         */
        function isSteadyState(apiGateway) {
            return lodash.includes(['ready', 'error'], lodash.get(apiGateway, 'status.state'));
        }

        /**
         * Checks whether the API gateway is in a transient state, meaning any state except "ready" and "error".
         * @param {Object} apiGateway - The API GW to check.
         * @returns {boolean} `true` in case the API GW is in transient state, or `false` otherwise.
         */
        function isTransientState(apiGateway) {
            return !self.isSteadyState(apiGateway);
        }

        /**
         * Shows status loading spinner for each provided API gateway.
         * @param {Object|Array.<Object>} apiGateways - Either a single API gateway, or a list of API gateways.
         */
        function showStatusSpinner(apiGateways) {
            lodash.forEach(lodash.castArray(apiGateways), function (apiGateway) {
                var apiGatewayName = lodash.get(apiGateway, 'spec.name');
                if (!lodash.isEmpty(apiGatewayName)) {
                    ElementLoadingStatusService.showSpinner('api-gateway-status-' + apiGatewayName);
                }
            });
        }
    }
}());
