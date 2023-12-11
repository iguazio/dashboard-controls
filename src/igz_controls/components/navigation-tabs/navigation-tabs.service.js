(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .factory('NavigationTabsService', NavigationTabsService);

    function NavigationTabsService($timeout, $i18next, i18next, lodash, ConfigService, FunctionsService) {
        return {
            getNavigationTabsConfig: getNavigationTabsConfig
        };

        //
        // Public methods
        //

        /**
         * Returns navigation tabs config depending on current state
         * @param {string} state
         * @returns {Array}
         */
        function getNavigationTabsConfig(state) {
            var navigationTabsConfigs = {
                'app.project': getProjectConfig(state),
                'app.container': getContainersConfig(),
                'app.cluster': getClusterConfig(),
                'app.clusters': getClustersConfig(),
                'app.app-cluster': getAppClustersConfig(),
                'app.events': getEventsConfig(),
                'app.storage-pool': getStoragePoolsConfig(),
                'app.identity': getIdentityConfig(),
                'app.control-panel': getControlPanelConfig(),
                'app.tenant': getTenantConfig()
            };
            var stateTest = state.match(/^[^.]*.[^.]*/);

            return lodash.get(navigationTabsConfigs, stateTest[0], []);
        }

        //
        // Private methods
        //

        /**
         * Returns project navigation tabs config
         * @returns {Array.<Object>}
         */
        function getProjectConfig(state) {
            var config = [];
            var lng = i18next.language;

            if (state === 'app.project.functions' || state === 'app.project.api-gateways') {
                config = [
                    {
                        tabName: $i18next.t('common:FUNCTIONS', {lng: lng}),
                        uiRoute: 'app.project.functions',
                    }
                ];

                $timeout(function () {
                    if (FunctionsService.isKubePlatform()) {
                        config.push({
                            tabName: $i18next.t('functions:API_GATEWAYS', {lng: lng}),
                            uiRoute: 'app.project.api-gateways',
                        });
                    }
                });
            }

            return config;
        }

        /**
         * Returns containers navigation tabs config
         * @returns {Array.<Object>}
         */
        function getContainersConfig() {
            var lng = i18next.language;
            var config = [
                {
                    tabName: $i18next.t('common:BROWSE', {lng: lng}),
                    uiRoute: 'app.container.browser',
                    capability: 'containers.browse'
                },
                {
                    tabName: $i18next.t('common:OVERVIEW', {lng: lng}),
                    uiRoute: 'app.container.overview',
                    capability: 'containers.overview'
                },
                {
                    tabName: $i18next.t('common:DATA_ACCESS_POLICY', {lng: lng}),
                    uiRoute: 'app.container.data-access-policy',
                    capability: 'containers.dataPolicy'
                }
            ];

            if (ConfigService.isDemoMode()) {
                config.push(
                    {
                        tabName: $i18next.t('common:DATA_LIFECYCLE', {lng: lng}),
                        uiRoute: 'app.container.data-lifecycle',
                        capability: 'containers.dataLifecycle'
                    }
                );

                config.splice(1, 0, {
                    tabName: $i18next.t('common:ANALYTICS', {lng: lng}),
                    uiRoute: 'app.container.analytics',
                    capability: 'containers.analytics'
                });
            }

            return config;
        }

        /**
         * Returns cluster navigation tabs config
         * @returns {Array.<Object>}
         */
        function getClusterConfig() {
            var lng = i18next.language;
            var config = [
                {
                    tabName: $i18next.t('common:NODES', {lng: lng}),
                    uiRoute: 'app.cluster.nodes',
                    capability: 'clusters.nodes'
                }
            ];

            if (ConfigService.isStagingMode()) {
                config.unshift({
                    tabName: $i18next.t('common:OVERVIEW', {lng: lng}),
                    uiRoute: 'app.cluster.overview',
                    capability: 'clusters.overview'
                });
            }

            return config;
        }

        /**
         * Returns clusters navigation tabs config
         * @returns {Array.<Object>}
         */
        function getClustersConfig() {
            var lng = i18next.language;

            return [
                {
                    tabName: $i18next.t('common:DATA', {lng: lng}),
                    id: 'data',
                    uiRoute: 'app.clusters.data',
                    capability: 'clusters'
                },
                {
                    tabName: $i18next.t('common:APPLICATION', {lng: lng}),
                    id: 'app',
                    uiRoute: 'app.clusters.app',
                    capability: 'clusters'
                },
                {
                    tabName: $i18next.t('common:SUPPORT_LOGS', {lng: lng}),
                    id: 'support-logs',
                    uiRoute: 'app.clusters.support-logs',
                    capability: 'clusters.collectLogs'
                }
            ];
        }

        /**
         * Returns app-clusters navigation tabs config
         * @returns {Array.<Object>}
         */
        function getAppClustersConfig() {
            var lng = i18next.language;

            return [
                {
                    tabName: $i18next.t('common:NODES', {lng: lng}),
                    uiRoute: 'app.app-cluster.nodes',
                    capability: 'clusters.nodes'
                }
            ];
        }

        /**
         * Returns storage pools navigation tabs config
         * @returns {Array.<Object>}
         */
        function getStoragePoolsConfig() {
            var lng = i18next.language;
            var config = [
                {
                    tabName: $i18next.t('common:OVERVIEW', {lng: lng}),
                    uiRoute: 'app.storage-pool.overview',
                    capability: 'storagePools.overview'
                },
                {
                    tabName: $i18next.t('common:DEVICES', {lng: lng}),
                    uiRoute: 'app.storage-pool.devices',
                    capability: 'storagePools.listDevices'
                }
            ];

            if (ConfigService.isDemoMode()) {
                config.splice(1, 0, {
                    tabName: $i18next.t('common:CONTAINERS', {lng: lng}),
                    uiRoute: 'app.storage-pool.containers',
                    capability: 'storagePools.listContainers'
                });
            }

            return config;
        }

        /**
         * Returns control panel navigation tabs config
         * @returns {Array.<Object>}
         */
        function getControlPanelConfig() {
            var lng = i18next.language;

            return [{
                tabName: $i18next.t('common:LOGS', {lng: lng}),
                uiRoute: 'app.control-panel.logs'
            }];
        }

        /**
         * Returns identity navigation tabs config
         * @returns {Array.<Object>}
         */
        function getIdentityConfig() {
            var lng = i18next.language;
            var platformType = lodash.get(ConfigService.dashboard, 'platformType', '')

            return [
                {
                    tabName: $i18next.t('common:USERS', {lng: lng}),
                    uiRoute: 'app.identity.users',
                    capability: 'identity.users'
                },
                {
                    tabName: $i18next.t('common:GROUPS', {lng: lng}),
                    uiRoute: 'app.identity.groups',
                    capability: 'identity.groups'
                },
                {
                    tabName: $i18next.t('common:IDP', {lng: lng}),
                    uiRoute: 'app.identity.idp',
                    capability: 'identity.idp'
                },
                {
                    tabName: $i18next.t('common:KEYLOACK_ADMIN_CONSOLE', {lng: lng}),
                    href: lodash.get(ConfigService.dashboard, ['authentication', 'sso', 'console_urls', platformType], ''),
                    hidden: !(lodash.get(ConfigService.dashboard, 'authentication.sso.mode') && platformType)
                }
            ]
        }

        /**
         * Returns events navigation tabs config
         * @returns {Array.<Object>}
         */
        function getEventsConfig() {
            var lng = i18next.language;
            var config = [
                {
                    tabName: $i18next.t('common:EVENT_LOG', {lng: lng}),
                    uiRoute: 'app.events.event-log',
                    capability: 'events.eventLog'
                },
                {
                    tabName: $i18next.t('common:ALERTS', {lng: lng}),
                    uiRoute: 'app.events.alerts',
                    capability: 'events.alerts'
                },
                {
                    tabName: $i18next.t('common:AUDIT', {lng: lng}),
                    uiRoute: 'app.events.audit',
                    capability: 'events.audit'
                },
                {
                    tabName: $i18next.t('common:COMMUNICATION', {lng: lng}),
                    uiRoute: 'app.events.communication',
                    capability: 'events.communication'
                }
            ];

            if (ConfigService.isDemoMode()) {
                config.push({
                    tabName: $i18next.t('common:ESCALATION', {lng: lng}),
                    uiRoute: 'app.events.escalation',
                    capability: 'events.escalations'
                });
            }

            return config;
        }

        /**
         * Returns tenants navigation tabs config
         * @returns {Array.<Object>}
         */
        function getTenantConfig() {
            var lng = i18next.language;

            return [
                {
                    tabName: $i18next.t('common:OVERVIEW', {lng: lng}),
                    uiRoute: 'app.tenant.overview'
                }
            ];
        }
    }
}());
